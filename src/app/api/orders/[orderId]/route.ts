// src/app/api/orders/[orderId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Define the structure of the order
interface Order {
  _id: ObjectId;
  userId: ObjectId;
  createdAt: Date;
  shippingDetails: {
    name: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  items: Array<{
    _id: ObjectId;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
    aiHint?: string;
  }>;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
}

export async function GET(req: NextRequest) {
  try {
    // Extract orderId from the URL path
    const orderId = req.nextUrl.pathname.split('/').pop();

    // Check if orderId is provided and is a valid ObjectId
    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Connect to the MongoDB client
    const client = await clientPromise;
    const db = client.db();

    // Query the database to find the order by its ID
    const order = await db.collection<Order>('orders').findOne({ _id: new ObjectId(orderId) });

    // Check if the order was found
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Omit the _id field and add an id field with the string representation of the ObjectId
    const { _id, userId, createdAt, ...rest } = order;
    const formattedOrder = {
      id: _id.toString(),
      userId: userId.toString(),
      createdAt: createdAt.toISOString(),
      ...rest,
    };

    // Return the formatted order with a 200 status code
    return NextResponse.json({ order: formattedOrder }, { status: 200 });
  } catch (error) {
    // Keep this error log for debugging order fetching issues
    console.error('Error fetching order:', error);

    // Return a 500 status code for internal server errors
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}