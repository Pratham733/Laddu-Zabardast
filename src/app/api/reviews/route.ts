// src/app/api/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import Review from '@/model/Review';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

// POST: Add a review
export async function POST(req: NextRequest) {
  await connectToDatabase();
  // --- JWT AUTH ---
  const authToken = req.cookies.get('authToken')?.value;
  if (!authToken || !JWT_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let payload: any;
  try {
    payload = jwt.verify(authToken, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { productId, rating, comment } = await req.json();
  if (!productId || !rating || !comment) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const userId = payload.userId;
  const userName = payload.firstName || payload.email || 'User';

  // --- Ensure productId is always an ObjectId ---
  let resolvedProductId = null;
  const client = await import('@/lib/mongodb').then(m => m.default);
  const db = (await client).db(process.env.MONGODB_DB_NAME);
  const { ObjectId } = require('mongodb');
  if (ObjectId.isValid(productId)) {
    // Try as ObjectId
    const product = await db.collection('products').findOne({ _id: new ObjectId(productId) });
    if (product) resolvedProductId = product._id;
  }
  if (!resolvedProductId) {
    // Try as string id
    const product = await db.collection('products').findOne({ id: productId });
    if (product) resolvedProductId = product._id;
  }
  if (!resolvedProductId) {
    // Try as name
    const product = await db.collection('products').findOne({ name: { $regex: `^${productId.replace(/-/g, ' ')}$`, $options: 'i' } });
    if (product) resolvedProductId = product._id;
  }
  if (!resolvedProductId) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  // Only one review per user per product
  const existing = await Review.findOne({ productId: resolvedProductId, userId });
  if (existing) {
    return NextResponse.json({ error: 'You have already reviewed this product.' }, { status: 400 });
  }
  const review = await Review.create({ productId: resolvedProductId, userId, userName, rating, comment });
  return NextResponse.json({ review });
}
