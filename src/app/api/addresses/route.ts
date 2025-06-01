import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import * as jose from 'jose';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    const rawUserId = payload.userId || payload.sub;

    if (typeof rawUserId !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing userId in token' }, { status: 401 });
    }

    const userId = new ObjectId(rawUserId);

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'ladoo_zabardast_db');

    // Parse address from request body
    const body = await request.json();

    // You should validate `body` here as per your address schema

    // Update user addresses array with new address
    const updateResult = await db.collection('users').updateOne(
      { _id: userId },
      { $push: { addresses: body } }
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to add address' }, { status: 500 });
    }

    // Fetch updated user addresses
    const user = await db.collection('users').findOne(
      { _id: userId },
      { projection: { addresses: 1 } }
    );

    // Return updated addresses in JSON response
    return NextResponse.json({ addresses: user?.addresses || [] });

  } catch (err) {
    console.error('POST /api/addresses error:', err);
    return NextResponse.json({ error: 'Unauthorized or internal error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    const rawUserId = payload.userId || payload.sub;

    if (typeof rawUserId !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing userId in token' }, { status: 401 });
    }

    const userId = new ObjectId(rawUserId);

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'ladoo_zabardast_db');

    const user = await db.collection('users').findOne(
      { _id: userId },
      { projection: { addresses: 1 } }
    );

    return NextResponse.json({ addresses: user?.addresses || [] });

  } catch (err) {
    console.error('GET /api/addresses error:', err);
    return NextResponse.json({ error: 'Unauthorized or internal error' }, { status: 500 });
  }
}
