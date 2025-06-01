//src/app/api/create-order/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import * as jose from 'jose';
import { sendOrderEmail, sendOrderWhatsApp } from '@/services/notification';
import { rateLimitApi } from '@/lib/rate-limiter';

const JWT_SECRET = process.env.JWT_SECRET;

// Basic JWT verification (use a robust library in production)
async function verifyTokenAndGetUserId(token: string): Promise<string | null> {
    if (!JWT_SECRET) {
        console.error('[Create Order API Error] JWT_SECRET is not defined.');
        return null;
    }
    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jose.jwtVerify(token, secret);
        return payload.userId as string || payload.sub as string || null;
    } catch (error) {
        console.error('[Create Order API Error] JWT Verification failed:', error);
        return null;
    }
}

// Zod schema for basic validation (expand as needed)
const orderItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().min(1),
  imageUrl: z.string().refine(
    (val) => !val || val.startsWith('/') || /^https?:\/\//.test(val),
    {
      message: 'Invalid image URL: must be a valid URL or a relative path starting with /',
    }
  ).optional(), // Accepts relative or absolute URLs
  aiHint: z.string().optional(),
});

const shippingDetailsSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8).optional(), // Add phone for WhatsApp notification
  address: z.string().min(5),
  city: z.string().min(2),
  postalCode: z.string().min(4),
  country: z.string().min(2),
  // Omit payment details from shipping info saved in order
});

const orderSchema = z.object({
  shippingDetails: shippingDetailsSchema,
  items: z.array(orderItemSchema).min(1, { message: "Order must contain at least one item." }),
  totalAmount: z.number().positive({ message: "Total amount must be positive." }),
  paymentStatus: z.enum(['completed', 'pending', 'failed']),
  paymentMethod: z.enum(['cod', 'card', 'upi', 'cash']), // Added paymentMethod
  orderStatus: z.enum(['Processing', 'Shipped', 'Delivered', 'Cancelled']),
});


export async function POST(request: NextRequest) {
  // Apply rate limiting
  try {
    const rateLimit = await rateLimitApi(request);
    if (!rateLimit.success) {
      console.warn(`[Create Order API] Rate limit exceeded for IP ${rateLimit.ip}`);
      return new NextResponse(
        JSON.stringify({ error: 'Too many order requests. Please try again later.' }),
        { 
          status: 429, 
          headers: { 
            'Retry-After': rateLimit.retryAfter?.toString() || '60',
            'Content-Type': 'application/json'
          } 
        }
      );
    }
  } catch (error) {
    console.error('[Create Order API] Rate limiting error:', error);
    // Continue processing if rate limiting fails
  }

  // 1. Authentication
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    console.warn('[Create Order API Warn] Unauthorized: No token provided.');
    return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
  }

  const userId = await verifyTokenAndGetUserId(token);
  if (!userId) {
    console.warn('[Create Order API Warn] Unauthorized: Invalid token.');
    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
  }
   console.log(`[Create Order API] Authenticated user ID: ${userId}`);


  // 2. Parse and Validate Request Body
  let orderData;
  try {
    orderData = await request.json();
    console.log("[Create Order API] Request body parsed:", orderData);
    const validation = orderSchema.safeParse(orderData);
    if (!validation.success) {
        console.error("[Create Order API Error] Validation failed:", validation.error.errors);
        const errorMessages = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        return NextResponse.json({ error: `Invalid order data: ${errorMessages}` }, { status: 400 });
    }
    orderData = validation.data; // Use validated data
  } catch (error) {
     if (error instanceof SyntaxError && error.message.includes('JSON')) {
         console.error('[Create Order API Error] Invalid JSON in request body:', error.message);
         return NextResponse.json({ error: 'Invalid request body format. Expected JSON.' }, { status: 400 });
     }
    console.error('[Create Order API Error] Error parsing request body:', error);
    return NextResponse.json({ error: 'Failed to parse request body.' }, { status: 400 });
  }

  // 3. Database Interaction
  let mongoClient;
  try {
    console.log("[Create Order API] Connecting to MongoDB...");
    mongoClient = await clientPromise;
    const db = mongoClient.db(process.env.MONGODB_DB_NAME);
    const ordersCollection = db.collection('orders');

    const newOrder = {
        userId: new ObjectId(userId), // Store user ID as ObjectId
        createdAt: new Date(),
        ...orderData,
    };

    console.log("[Create Order API] Inserting order into database...");
    const result = await ordersCollection.insertOne(newOrder);
    console.log("[Create Order API] Order inserted, result:", result);


    if (!result.insertedId) {
        throw new Error("Failed to insert order into database.");
    }

    const orderId = result.insertedId.toString();

    // 4. Send Notifications
    try {
      // Email notification to customer
      await sendOrderEmail({
        to: orderData.shippingDetails.email,
        subject: `Order Confirmation - Order #${orderId}`,
        text: `Thank you for your order!\nOrder ID: ${orderId}\nTotal: ₹${orderData.totalAmount}\nWe will notify you when your order is shipped.`,
        html: `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f7f7fa; padding: 0; margin: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: #f7f7fa; padding: 0; margin: 0;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: #fff; border-radius: 18px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); margin: 32px 0;">
            <tr>
              <td style="padding: 32px 32px 16px 32px; text-align: center;">
                <h1 style="color: #eab308; font-size: 2rem; margin: 0 0 8px 0; letter-spacing: 1px;">Order Confirmed!</h1>
                <p style="font-size: 1.1rem; color: #333; margin: 0 0 16px 0;">Thank you, <b>${orderData.shippingDetails.name}</b>! Your order has been placed successfully.</p>
                <div style="background: #f1f5f9; border-radius: 10px; padding: 18px 0; margin-bottom: 18px;">
                  <span style="display: block; color: #64748b; font-size: 0.95rem;">Order ID</span>
                  <span style="font-size: 1.2rem; font-weight: bold; color: #eab308;">${orderId}</span>
                </div>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 18px 0;">
                  <tr>
                    <td style="font-size: 1rem; color: #64748b; padding: 4px 0;">Order Date:</td>
                    <td style="font-size: 1rem; color: #222; padding: 4px 0; text-align: right;">${new Date().toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 1rem; color: #64748b; padding: 4px 0;">Total Amount:</td>
                    <td style="font-size: 1.1rem; color: #16a34a; font-weight: bold; padding: 4px 0; text-align: right;">₹${orderData.totalAmount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 1rem; color: #64748b; padding: 4px 0;">Payment Method:</td>
                    <td style="font-size: 1rem; color: #222; padding: 4px 0; text-align: right; text-transform: capitalize;">${orderData.paymentMethod}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 1rem; color: #64748b; padding: 4px 0;">Order Status:</td>
                    <td style="font-size: 1rem; color: #222; padding: 4px 0; text-align: right; text-transform: capitalize;">${orderData.orderStatus}</td>
                  </tr>
                </table>
                <h2 style="font-size: 1.1rem; color: #eab308; margin: 24px 0 8px 0;">Shipping Details</h2>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 18px;">
                  <tr><td style="color: #64748b;">Name:</td><td style="color: #222; text-align: right;">${orderData.shippingDetails.name}</td></tr>
                  <tr><td style="color: #64748b;">Email:</td><td style="color: #222; text-align: right;">${orderData.shippingDetails.email}</td></tr>
                  <tr><td style="color: #64748b;">Address:</td><td style="color: #222; text-align: right;">${orderData.shippingDetails.address}, ${orderData.shippingDetails.city}, ${orderData.shippingDetails.country} - ${orderData.shippingDetails.postalCode}</td></tr>
                </table>
                <h2 style="font-size: 1.1rem; color: #eab308; margin: 24px 0 8px 0;">Order Summary</h2>
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 18px;">
                  <tr style="background: #f1f5f9;">
                    <th align="left" style="padding: 8px; color: #64748b; font-size: 0.98rem;">Item</th>
                    <th align="center" style="padding: 8px; color: #64748b; font-size: 0.98rem;">Qty</th>
                    <th align="right" style="padding: 8px; color: #64748b; font-size: 0.98rem;">Price</th>
                  </tr>
                  ${orderData.items.map((item:any) => `
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #222;">${item.name}</td>
                      <td align="center" style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #222;">${item.quantity}</td>
                      <td align="right" style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #222;">₹${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                  <tr>
                    <td colspan="2" align="right" style="padding: 8px; font-weight: bold; color: #222;">Total</td>
                    <td align="right" style="padding: 8px; font-weight: bold; color: #16a34a;">₹${orderData.totalAmount.toFixed(2)}</td>
                  </tr>
                </table>
                <div style="margin: 24px 0 0 0;">
                  <p style="font-size: 1rem; color: #64748b;">We will notify you when your order is shipped. For any queries, reply to this email or contact us at <a href="mailto:ladduzab@gmail.com" style="color: #eab308; text-decoration: none;">ladduzab@gmail.com</a>.</p>
                  <p style="font-size: 1rem; color: #64748b; margin-top: 12px;">Thank you for shopping with <b style="color: #eab308;">Laddu Zabardast</b>!</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
        `
      });
      // WhatsApp notification to customer
      await sendOrderWhatsApp({
        to: orderData.shippingDetails.phone || '', // Make sure phone is present and in correct format
        message: `Thank you for your order!\nOrder ID: ${orderId}\nTotal: ₹${orderData.totalAmount}`
      });
      // Email/WhatsApp notification to admin (optional)
      if (process.env.ADMIN_EMAIL) {
        await sendOrderEmail({
          to: process.env.ADMIN_EMAIL,
          subject: `New Order Placed from ${orderData.shippingDetails.name}`,
          text: `A new order has been placed by ${orderData.shippingDetails.name}.
Email: ${orderData.shippingDetails.email}
Phone: ${orderData.shippingDetails.phone || 'N/A'}
Address: ${orderData.shippingDetails.address}, ${orderData.shippingDetails.city}, ${orderData.shippingDetails.country} - ${orderData.shippingDetails.postalCode}
Total: ₹${orderData.totalAmount}
Payment: ${orderData.paymentMethod} (${orderData.paymentStatus})
Order Status: ${orderData.orderStatus}
\nItems:\n${orderData.items.map((item:any) => `- ${item.name} x${item.quantity} (₹${item.price.toFixed(2)} each)`).join('\n')}`,
          html: `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f7f7fa; padding: 0; margin: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: #f7f7fa; padding: 0; margin: 0;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #fff; border-radius: 18px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); margin: 32px 0;">
            <tr>
              <td style="padding: 32px 32px 16px 32px; text-align: left;">
                <h1 style="color: #eab308; font-size: 2rem; margin: 0 0 8px 0; letter-spacing: 1px;">New Order Placed from ${orderData.shippingDetails.name}</h1>
                <div style="background: #f1f5f9; border-radius: 10px; padding: 18px 0; margin-bottom: 18px;">
                  <span style="display: block; color: #64748b; font-size: 0.95rem;">Customer Name</span>
                  <span style="font-size: 1.2rem; font-weight: bold; color: #eab308;">${orderData.shippingDetails.name}</span>
                </div>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 18px 0;">
                  <tr>
                    <td style="font-size: 1rem; color: #64748b; padding: 4px 0;">Order Date:</td>
                    <td style="font-size: 1rem; color: #222; padding: 4px 0; text-align: right;">${new Date().toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 1rem; color: #64748b; padding: 4px 0;">Total Amount:</td>
                    <td style="font-size: 1.1rem; color: #16a34a; font-weight: bold; padding: 4px 0; text-align: right;">₹${orderData.totalAmount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 1rem; color: #64748b; padding: 4px 0;">Payment:</td>
                    <td style="font-size: 1rem; color: #222; padding: 4px 0; text-align: right; text-transform: capitalize;">${orderData.paymentMethod} (${orderData.paymentStatus})</td>
                  </tr>
                  <tr>
                    <td style="font-size: 1rem; color: #64748b; padding: 4px 0;">Order Status:</td>
                    <td style="font-size: 1rem; color: #222; padding: 4px 0; text-align: right; text-transform: capitalize;">${orderData.orderStatus}</td>
                  </tr>
                </table>
                <h2 style="font-size: 1.1rem; color: #eab308; margin: 24px 0 8px 0;">Customer Details</h2>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 18px;">
                  <tr><td style="color: #64748b;">Name:</td><td style="color: #222; text-align: right;">${orderData.shippingDetails.name}</td></tr>
                  <tr><td style="color: #64748b;">Email:</td><td style="color: #222; text-align: right;">${orderData.shippingDetails.email}</td></tr>
                  <tr><td style="color: #64748b;">Phone:</td><td style="color: #222; text-align: right;">${orderData.shippingDetails.phone || 'N/A'}</td></tr>
                  <tr><td style="color: #64748b;">Address:</td><td style="color: #222; text-align: right;">${orderData.shippingDetails.address}, ${orderData.shippingDetails.city}, ${orderData.shippingDetails.country} - ${orderData.shippingDetails.postalCode}</td></tr>
                </table>
                <h2 style="font-size: 1.1rem; color: #eab308; margin: 24px 0 8px 0;">Order Items</h2>
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 18px;">
                  <tr style="background: #f1f5f9;">
                    <th align="left" style="padding: 8px; color: #64748b; font-size: 0.98rem;">Item</th>
                    <th align="center" style="padding: 8px; color: #64748b; font-size: 0.98rem;">Qty</th>
                    <th align="right" style="padding: 8px; color: #64748b; font-size: 0.98rem;">Price</th>
                  </tr>
                  ${orderData.items.map((item:any) => `
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #222;">${item.name}</td>
                      <td align="center" style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #222;">${item.quantity}</td>
                      <td align="right" style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #222;">₹${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                  <tr>
                    <td colspan="2" align="right" style="padding: 8px; font-weight: bold; color: #222;">Total</td>
                    <td align="right" style="padding: 8px; font-weight: bold; color: #16a34a;">₹${orderData.totalAmount.toFixed(2)}</td>
                  </tr>
                </table>
                <div style="margin: 24px 0 0 0;">
                  <p style="font-size: 1rem; color: #64748b;">You received this order via <b style="color: #eab308;">Laddu Zabardast</b> website.</p>
                  <p style="font-size: 1rem; color: #64748b; margin-top: 12px;">Login to the admin panel to view, process, or update this order.</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
          `
        });
      }
    } catch (error) {
      console.error('[Create Order API Error] Notification sending failed:', error);
      return NextResponse.json({ error: 'Order created, but failed to send notifications.' }, { status: 500 });
    }

    // 5. Success Response
    return NextResponse.json({ message: 'Order created successfully.', orderId }, { status: 201 });
  } catch (error) {
    console.error('[Create Order API Error] Database interaction failed:', error);
    return NextResponse.json({ error: 'Failed to create order. Please try again later.' }, { status: 500 });
  }
}
