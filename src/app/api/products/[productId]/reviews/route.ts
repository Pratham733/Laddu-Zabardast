// src/app/api/products/[productId]/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import Review from '@/model/Review';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

// GET: Get all reviews for a product (pinned first, then recent)
export async function GET(req: NextRequest, context: { params: { productId: string } }) {
  const params = await context.params;
  await connectToDatabase();
  const { productId } = params;
  if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });

  try {
    let resolvedProductId = null;
    let reviews = [];
    const client2 = await clientPromise;
    const db2 = client2.db(process.env.MONGODB_DB_NAME);

    // If productId is a valid ObjectId, check if a product exists with that _id
    if (ObjectId.isValid(productId)) {
      const product = await db2.collection('products').findOne({ _id: new ObjectId(productId) });
      if (product) {
        resolvedProductId = product._id;
      }
    }
    // If not resolved, try by string id
    if (!resolvedProductId) {
      const product = await db2.collection('products').findOne({ id: productId });
      if (product) {
        resolvedProductId = product._id;
      }
    }
    // If not resolved, try by name (case-insensitive, dashes to spaces)
    if (!resolvedProductId) {
      const product = await db2.collection('products').findOne({ name: { $regex: `^${productId.replace(/-/g, ' ')}$`, $options: 'i' } });
      if (product) {
        resolvedProductId = product._id;
      }
    }
    if (resolvedProductId) {
      reviews = await Review.find({ productId: resolvedProductId }).sort({ pinned: -1, createdAt: -1 });
    }
    return NextResponse.json({ reviews: reviews || [] });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews', details: error instanceof Error ? error.message : error }, { status: 500 });
  }
}
