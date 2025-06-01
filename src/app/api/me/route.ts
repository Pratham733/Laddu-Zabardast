import { NextResponse, type NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;

async function verifyTokenAndGetUserId(token: string): Promise<string | null> {
  if (!JWT_SECRET) return null;
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    if (typeof payload.userId === 'string') return payload.userId;
    if (typeof payload.sub === 'string') return payload.sub;
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await verifyTokenAndGetUserId(token);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const mongoClient = await clientPromise;
  const dbName = process.env.MONGODB_DB_NAME || 'ladoo_zabardast_db';
  const db = mongoClient.db(dbName);
  const usersCollection = db.collection('users');
  const user = await usersCollection.findOne(
    { _id: new ObjectId(userId) },
    { projection: { password: 0 } }
  );
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  // Only return allowed fields
  const { firstName = '', lastName = '', email = '', phone = '', picture = '', addresses = [], _id, createdAt } = user;
  return NextResponse.json({ user: { userId: _id.toString(), firstName, lastName, email, phone, picture, addresses, createdAt } });
}
