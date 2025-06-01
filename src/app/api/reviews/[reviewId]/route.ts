// src/app/api/reviews/[reviewId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import Review from '@/model/Review';
import { RouteParams } from '@/types/api';
import jwt from 'jsonwebtoken';

interface ReviewParams {
  reviewId: string;
}

interface JWTPayload {
  userId: string;
  [key: string]: any;
}

interface ReviewBody {
  rating: number;
  comment: string;
}

const JWT_SECRET = process.env.JWT_SECRET;

// PUT: Edit review (user only their own)
export async function PUT(req: NextRequest, { params }: RouteParams<ReviewParams>) {
  await connectToDatabase();
  // --- JWT AUTH ---
  const authToken = req.cookies.get('authToken')?.value;
  if (!authToken || !JWT_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  let payload: JWTPayload;
  try {
    payload = jwt.verify(authToken, JWT_SECRET) as JWTPayload;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { reviewId } = params;
  const { rating, comment }: ReviewBody = await req.json();
  
  const review = await Review.findById(reviewId);
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  if (review.userId.toString() !== payload.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  review.rating = rating;
  review.comment = comment;
  review.updatedAt = new Date();
  await review.save();
  
  return NextResponse.json({ review });
}

// DELETE: Delete review (admin or user)
export async function DELETE(req: NextRequest, context: { params: { reviewId: string } }) {
  const params = await context.params;
  await connectToDatabase();
  const authToken = req.cookies.get('authToken')?.value;
  if (!authToken || !JWT_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let payload: any = null;
  try {
    payload = jwt.verify(authToken, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { reviewId } = params;
  const review = await Review.findById(reviewId);
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  const isAdmin = payload.isAdmin || payload.role === 'admin' || false;
  if (review.userId.toString() !== payload.userId && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await review.deleteOne();
  return NextResponse.json({ success: true });
}

// PATCH: Pin/unpin review (admin only)
export async function PATCH(req: NextRequest, { params }: { params: { reviewId: string } }) {
  await connectToDatabase();
  const authToken = req.cookies.get('authToken')?.value;
  if (!authToken || !JWT_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let payload: any = null;
  try {
    payload = jwt.verify(authToken, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(payload.isAdmin || payload.role === 'admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { reviewId } = params;
  const { pinned } = await req.json();
  const review = await Review.findById(reviewId);
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  review.pinned = !!pinned;
  await review.save();
  return NextResponse.json({ review });
}
