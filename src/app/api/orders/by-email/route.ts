//src/app/api/orders/by-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT secret is not set in environment variables');
}

export async function POST(req: NextRequest) {
  try {
    // Get Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract token from header
    const token = authHeader.split(' ')[1];

    // Verify JWT token (assert JWT_SECRET as string)
    try {
      verify(token, JWT_SECRET as string);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse request body
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();

    // Fetch orders by email
    const orders = await db
      .collection('orders')
      .find({ 'shippingDetails.email': email })
      .sort({ createdAt: -1 })
      .toArray();

    // Format orders for response
    const formattedOrders = orders.map(order => ({
      id: order._id.toString(),
      userId: order.userId.toString(),
      createdAt: order.createdAt.toISOString(),
      shippingDetails: order.shippingDetails,
      items: order.items,
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
    }));

    return NextResponse.json({ orders: formattedOrders }, { status: 200 });
  } catch (error) {
    // Keep this error log for debugging order fetching issues
    console.error('Error fetching orders by email:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
