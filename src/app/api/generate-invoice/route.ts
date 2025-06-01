//src/app/api/generate-invoice/route.ts
// src/app/api/generate-invoice/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;

async function verifyTokenAndGetUserId(token: string): Promise<string | null> {
  if (!JWT_SECRET) {
    console.error('[Generate Invoice API Error] JWT_SECRET is not defined.');
    return null;
  }
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    if (typeof payload.userId === 'string') return payload.userId;
    if (typeof payload.sub === 'string') return payload.sub;
    return null;
  } catch (error) {
    console.error('[Generate Invoice API Error] JWT Verification failed:', error);
    return null;
  }
}

async function generateInvoicePdf(order: any): Promise<Uint8Array> {
  // Defensive: Provide defaults for missing fields
  const safeOrder = {
    _id: order._id || { toString: () => 'N/A' },
    createdAt: order.createdAt || new Date(),
    shippingDetails: order.shippingDetails || {},
    items: Array.isArray(order.items) ? order.items : [],
    totalAmount: typeof order.totalAmount === 'number' ? order.totalAmount : 0,
  };

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 50;

  const drawText = (
    text: string,
    x: number,
    currentY: number,
    options: { size?: number; font?: any; color?: any } = {}
  ) => {
    page.drawText(text, {
      x,
      y: currentY,
      size: options.size ?? 10,
      font: options.font ?? font,
      color: options.color ?? rgb(0, 0, 0),
    });
    return currentY - (options.size ?? 10) - 6;
  };

  // Title
  y = drawText('INVOICE', 50, y, { size: 26, font: boldFont });
  y -= 15;

  // Company Info
  y = drawText('LADDU ZABARDAST', 50, y, { font: boldFont, size: 14 });
  y = drawText('123 Sweet Street, Foodville, India', 50, y);
  y = drawText('info@ladduzabardast.com', 50, y);
  y -= 20;

  // Order & Customer Info
  const orderDate = safeOrder.createdAt ? format(new Date(safeOrder.createdAt), 'PPP') : 'N/A';
  y = drawText(`Order ID: ${safeOrder._id.toString()}`, 50, y, { font: boldFont });
  y = drawText(`Order Date: ${orderDate}`, 50, y);
  y -= 12;
  y = drawText('Bill To:', 50, y, { font: boldFont });
  y = drawText(safeOrder.shippingDetails?.name || 'N/A', 50, y);
  y = drawText(safeOrder.shippingDetails?.address || 'N/A', 50, y);
  y = drawText(`${safeOrder.shippingDetails?.city || ''}, ${safeOrder.shippingDetails?.postalCode || ''}`, 50, y);
  y = drawText(safeOrder.shippingDetails?.country || '', 50, y);
  y = drawText(`Email: ${safeOrder.shippingDetails?.email || 'N/A'}`, 50, y);
  y -= 25;

  // Table Header
  const tableTopY = y;
  page.drawLine({ start: { x: 50, y: y + 5 }, end: { x: width - 50, y: y + 5 } });
  y = drawText('Item', 50, y, { font: boldFont });
  drawText('Qty', 350, tableTopY, { font: boldFont });
  drawText('Price', 420, tableTopY, { font: boldFont });
  drawText('Total', 500, tableTopY, { font: boldFont });
  page.drawLine({ start: { x: 50, y: y - 3 }, end: { x: width - 50, y: y - 3 } });
  y -= 10;

  // Table Items
  if (safeOrder.items.length === 0) {
    y = drawText('No items found for this order.', 50, y);
  } else {
    safeOrder.items.forEach((item: any) => {
      const itemTotal = (item.price * item.quantity).toFixed(2);
      const currentItemY = y;
      y = drawText(item.name || 'N/A', 50, y);
      drawText(item.quantity?.toString() || '0', 350, currentItemY);
      drawText(`₹${item.price?.toFixed(2) || '0.00'}`, 420, currentItemY);
      drawText(`₹${itemTotal}`, 500, currentItemY);
      y -= 8;
    });
  }

  page.drawLine({ start: { x: 50, y: y + 6 }, end: { x: width - 50, y: y + 6 } });
  y -= 20;

  // Totals
  const totalsY = y;
  y = drawText('Subtotal:', 420, y);
  drawText(`₹${safeOrder.totalAmount.toFixed(2)}`, 500, totalsY);
  y = drawText('Shipping:', 420, y);
  drawText('Free', 500, y + 5);
  page.drawLine({ start: { x: 400, y }, end: { x: width - 50, y } });
  y = drawText('Total:', 420, y - 5, { font: boldFont });
  drawText(`₹${safeOrder.totalAmount.toFixed(2)}`, 500, y + 5, { font: boldFont });
  y -= 30;

  // Footer Note
  y = drawText('Thank you for your order!', 50, y, { size: 12, font: boldFont });

  return pdfDoc.save();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderIdParam = searchParams.get('orderId');

    if (!orderIdParam) {
      return NextResponse.json({ error: 'Missing orderId parameter' }, { status: 400 });
    }

    let orderId: ObjectId;
    try {
      orderId = new ObjectId(orderIdParam);
    } catch {
      return NextResponse.json({ error: 'Invalid orderId format' }, { status: 400 });
    }

    // Authentication check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: Missing Authorization header' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Invalid Authorization header format' }, { status: 401 });
    }

    const userId = await verifyTokenAndGetUserId(token);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db(process.env.MONGODB_DB_NAME);
    const ordersCollection = db.collection('orders');

    console.log(`[Generate Invoice API] Fetching order with ID: ${orderId}`);
    const order = await ordersCollection.findOne({ _id: orderId });

    if (!order) {
      console.warn(`[Generate Invoice API] Order not found: ${orderId}`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Debug: Log the order object and key fields
    console.log('[Generate Invoice API] Order fetched:', JSON.stringify(order, null, 2));
    console.log('[Generate Invoice API] order.totalAmount:', order.totalAmount);
    console.log('[Generate Invoice API] order.items:', order.items);
    console.log('[Generate Invoice API] order.shippingDetails:', order.shippingDetails);

    // Authorization check: Only owner or admin can access
    // Assuming userIsAdmin is stored in user data or token, implement accordingly.
    const userIsAdmin = false; // Implement your admin check logic here
    if (order.userId.toString() !== userId && !userIsAdmin) {
      console.warn(`[Generate Invoice API] User ${userId} unauthorized to access order ${orderId}`);
      return NextResponse.json({ error: 'Unauthorized to access this order' }, { status: 403 });
    }

    try {
      console.log(`[Generate Invoice API] Generating PDF for order: ${orderId}`);
      const pdfBytes = await generateInvoicePdf(order);
      console.log(`[Generate Invoice API] PDF generated successfully.`);

      return new NextResponse(pdfBytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${orderId}.pdf"`,
        },
      });
    } catch (pdfError) {
      console.error('[Generate Invoice API Error] PDF generation failed:', pdfError);
      // Return error stack and order data for debugging
      return NextResponse.json({
        error: 'PDF generation failed',
        details: pdfError instanceof Error ? pdfError.stack : String(pdfError),
        order: order
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Generate Invoice API Error] Failed to generate invoice:', error);
    return NextResponse.json({ error: 'Failed to generate invoice PDF.' }, { status: 500 });
  }
}
