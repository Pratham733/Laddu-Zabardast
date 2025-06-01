import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import * as jose from 'jose';
import { AddressParams, RouteParams } from '@/types/api';

const JWT_SECRET = process.env.JWT_SECRET!;

interface JWTPayload {
  userId?: string;
  sub?: string;
}

export async function PUT(req: NextRequest, { params }: RouteParams<AddressParams>) {
  try {
    const index = parseInt(params.index);
    if (isNaN(index)) {
      return NextResponse.json({ error: 'Invalid index' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(JWT_SECRET)) as { payload: JWTPayload };
    const rawUserId = payload.userId ?? payload.sub;
    if (typeof rawUserId !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing userId in token' }, { status: 401 });
    }

    const userId = new ObjectId(rawUserId);

    const newAddress = await req.json();

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'ladoo_zabardast_db');

    const user = await db.collection('users').findOne({ _id: userId });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const addresses = user.addresses || [];
    if (index < 0 || index >= addresses.length) {
      return NextResponse.json({ error: 'Invalid address index' }, { status: 400 });
    }

    addresses[index] = newAddress;

    await db.collection('users').updateOne({ _id: userId }, { $set: { addresses } });

    return NextResponse.json({ addresses });

  } catch (err) {
    console.error('PUT /api/addresses/[index] error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
export async function DELETE(req: NextRequest, context: { params: { index: string } }) {
  try {
    const indexParam = context.params.index;

    const index = parseInt(indexParam);
    if (isNaN(index)) {
      return NextResponse.json({ error: 'Invalid index' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    const rawUserId = payload.userId ?? payload.sub;
    if (typeof rawUserId !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing userId in token' }, { status: 401 });
    }

    const userId = new ObjectId(rawUserId);

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'ladoo_zabardast_db');

    const user = await db.collection('users').findOne({ _id: userId });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const addresses = user.addresses || [];
    if (index < 0 || index >= addresses.length) {
      return NextResponse.json({ error: 'Invalid address index' }, { status: 400 });
    }

    addresses.splice(index, 1);

    await db.collection('users').updateOne({ _id: userId }, { $set: { addresses } });

    return NextResponse.json({ addresses });

  } catch (err) {
    console.error('DELETE /api/addresses/[index] error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}