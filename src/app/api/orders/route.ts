// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import clientPromise from '@/lib/mongodb';
import { Order } from '@/types/order';
import { rateLimitApi } from '@/lib/rate-limiter';

function validateOrder(data: Partial<Order>): string | null {
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    return 'Order must contain at least one item.';
  }
  if (!data.shippingDetails) {
    return 'Shipping details are required.';
  }
  const { name, email, address, phone, city, state, zip, streetAddress, postalCode, country } = data.shippingDetails || {};
  if (
    !name || !email || !address || !phone || !city || !state || !zip ||
    !streetAddress || !postalCode || !country
  ) {
    return 'All shipping details fields are required.';
  }
  if (typeof data.totalAmount !== 'number' || data.totalAmount <= 0) {
    return 'Total amount must be a positive number.';
  }
  const validPaymentMethods = ['cod', 'card', 'upi', 'cash'];
  if (!data.paymentMethod || !validPaymentMethods.includes(data.paymentMethod.toLowerCase())) {
    return `Payment method must be one of: ${validPaymentMethods.join(', ')}. Received: ${data.paymentMethod}`;
  }
  return null; // valid
}

export async function POST(req: NextRequest) {
  // Apply rate limiting
  try {
    const rateLimit = await rateLimitApi(req);
    if (!rateLimit.success) {
      console.warn(`[Orders API] Rate limit exceeded for IP ${rateLimit.ip}`);
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
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
    console.error('[Orders API] Rate limiting error:', error);
    // Continue processing if rate limiting fails
  }

  try {
    // Try to get token from next-auth (cookie)
    let token = await getToken({ req, secret: process.env.JWT_SECRET });
    // If not found, try Authorization header
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const jwt = authHeader.split(' ')[1];
        const jose = await import('jose');
        try {
          const { payload } = await jose.jwtVerify(jwt, new TextEncoder().encode(process.env.JWT_SECRET!));
          const id = typeof payload.userId === 'string' ? payload.userId : (typeof payload.sub === 'string' ? payload.sub : undefined);
          token = { id };
        } catch {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      }
    }
    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientData: Order = await req.json();

    // Validate order data
    const validationError = validateOrder(clientData);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Explicitly construct the object to be saved, ensuring fields from clientData are used.
    // _id is intentionally omitted as MongoDB will generate it.
    const newOrderToSave = {
      userId: token.id as string, // From authenticated token
      items: clientData.items,
      shippingDetails: clientData.shippingDetails,
      totalAmount: clientData.totalAmount,
      paymentMethod: clientData.paymentMethod, // Explicitly take from client payload
      paymentStatus: clientData.paymentStatus, // Explicitly take from client payload
      orderStatus: clientData.orderStatus || 'processing', // Default to 'processing' if not provided
      createdAt: new Date(), // Set creation timestamp
    };

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection('orders').insertOne(newOrderToSave);

    return NextResponse.json(
      { message: 'Order created', orderId: result.insertedId.toString() },
      { status: 201 }
    );
  } catch (error) {
    // Keep this error log for debugging order creation issues
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Try to get token from next-auth (cookie)
    let token = await getToken({ req, secret: process.env.JWT_SECRET });
    // If not found, try Authorization header
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const jwt = authHeader.split(' ')[1];
        const jose = await import('jose');
        try {
          const { payload } = await jose.jwtVerify(jwt, new TextEncoder().encode(process.env.JWT_SECRET!));
          const id = typeof payload.userId === 'string' ? payload.userId : (typeof payload.sub === 'string' ? payload.sub : undefined);
          const email = typeof payload.email === 'string' ? payload.email : undefined;
          token = { id, email };
        } catch {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      }
    }
    if (!token?.id || !token?.email) {
      // Keep this error log for debugging unauthorized access
      console.error('Unauthorized request to fetch orders');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use the same admin email as in your auth-context
    const adminEmail = "spratham388@gmail.com";
    const isAdmin = token.email === adminEmail;

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db();

    let totalOrders, orders;
    if (isAdmin) {
      // Admin: fetch all orders
      totalOrders = await db.collection('orders').countDocuments();
      orders = await db
        .collection('orders')
        .find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
    } else {
      // Regular user: fetch only their orders
      totalOrders = await db.collection('orders').countDocuments({ userId: token.id });
      orders = await db
        .collection('orders')
        .find({ userId: token.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
    }

    return NextResponse.json({
      page,
      limit,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      orders,
    });
  } catch (error) {
    // Keep this error log for debugging order fetching issues
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Try to get token from next-auth (cookie)
    let token = await getToken({ req, secret: process.env.JWT_SECRET });
    // If not found, try Authorization header
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const jwt = authHeader.split(' ')[1];
        const jose = await import('jose');
        try {
          const { payload } = await jose.jwtVerify(jwt, new TextEncoder().encode(process.env.JWT_SECRET!));
          const email = typeof payload.email === 'string' ? payload.email : undefined;
          token = { email };
        } catch {
          return NextResponse.json({ error: 'Invalid or expired token. Please log in again.' }, { status: 401 });
        }
      }
    }
    if (!token?.email) {
      return NextResponse.json({ error: 'Unauthorized: Admin email required.' }, { status: 401 });
    }
    const adminEmail = "spratham388@gmail.com";
    const isAdmin = token.email === adminEmail;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Only admins can update order status.' }, { status: 403 });
    }
    const body = await req.json();
    const { orderId, status, paymentStatus } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    const updateFields: Partial<Order> = {};

    if (status) {
      const allowedOrderStatuses = ["processing", "shipped", "delivered", "cancelled"]; // Lowercase for consistency
      if (!allowedOrderStatuses.includes(status.toLowerCase())) {
        return NextResponse.json({ error: `Invalid order status value. Allowed: ${allowedOrderStatuses.join(', ')}` }, { status: 400 });
      }
      updateFields.orderStatus = status.toLowerCase() as Order['orderStatus'];
    }

    if (paymentStatus) {
      const allowedPaymentStatuses = ["pending", "paid", "failed", "completed"];
      if (!allowedPaymentStatuses.includes(paymentStatus.toLowerCase())) {
        return NextResponse.json({ error: `Invalid payment status value. Allowed: ${allowedPaymentStatuses.join(', ')}` }, { status: 400 });
      }
      updateFields.paymentStatus = paymentStatus.toLowerCase() as Order['paymentStatus'];
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: 'No status (order or payment) provided for update.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const filter = { _id: typeof orderId === 'string' ? new (await import('mongodb')).ObjectId(orderId) : orderId };
    const updateOperation = { $set: updateFields };

    console.log("Attempting to update order. Filter:", JSON.stringify(filter), "Update:", JSON.stringify(updateOperation)); // Detailed log

    const result = await db.collection('orders').findOneAndUpdate(
      filter,
      updateOperation,
      { returnDocument: 'after' }
    );

    console.log("MongoDB findOneAndUpdate result:", JSON.stringify(result)); // Detailed log of the result

    // The result object from findOneAndUpdate includes 'value' (the document) and 'ok' (status).
    // If 'ok' is 1 and 'value' is null, it means the document was not found.
    // If 'ok' is 1 and 'value' is not null, the document was found and potentially updated.
    if (!result || result.ok !== 1 || !result.value) { // Check 'ok' status and 'value'
        // If result.value is null but result.ok was 1, it means not found.
        // If result.ok was not 1, an error occurred.
        const errorMessage = result && result.ok !== 1 ? "MongoDB update operation failed." : "Order not found or update failed to apply.";
        console.error("Update failed or order not found. Full result:", JSON.stringify(result));
        return NextResponse.json({ error: errorMessage }, { status: 404 });
    }
    
    // At this point, result.value contains the updated document
    const updatedOrder = result.value;
    let message = "Order updated successfully.";
    // Use the actual updated values from updatedOrder for the message
    const finalOrderStatus = updatedOrder.orderStatus;
    const finalPaymentStatus = updatedOrder.paymentStatus;

    if (updateFields.orderStatus && updateFields.paymentStatus) {
        message = `Order status updated to '${finalOrderStatus}' and payment status to '${finalPaymentStatus}'.`;
    } else if (updateFields.orderStatus) {
        message = `Order status updated to '${finalOrderStatus}'.`;
    } else if (updateFields.paymentStatus) {
        message = `Payment status updated to '${finalPaymentStatus}'.`;
    }

    return NextResponse.json({ message, order: updatedOrder });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Internal Server Error. Please try again later.' }, { status: 500 });
  }
}