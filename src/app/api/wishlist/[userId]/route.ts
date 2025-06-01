// src/app/api/wishlist/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT secret is not set in environment variables');
}

// GET: Fetch wishlist for a user
export async function GET(req: NextRequest, context: any) {
  try {
    // Extract and validate userId from params
    const params = await context.params;
    const userId = params.userId;
    if (!userId) {
      console.error('[Wishlist API] No userId provided');
      return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
    }

    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) {
      console.error('[Wishlist API] No token provided');
      return NextResponse.json({ error: 'Unauthorized: No token' }, { status: 401 });
    }

    let payload: any;
    try {
      payload = await jose.jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    } catch (e) {
      console.error('[Wishlist API] Token verification failed:', e);
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // Verify user is accessing their own wishlist
    if (payload.payload.userId !== userId && payload.payload.sub !== userId) {
      console.error('[Wishlist API] UserId mismatch:', { tokenId: payload.payload.userId, requestedId: userId });
      return NextResponse.json({ error: 'Forbidden: Cannot access another user\'s wishlist' }, { status: 403 });
    }

    // Fetch wishlist from database
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'ladoo_zabardast_db');
    
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(userId) 
    });

    if (!user) {
      console.error('[Wishlist API] User not found:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ items: user.wishlist || [] });

  } catch (err) {
    console.error('[Wishlist API] Server error:', err);
    return NextResponse.json({ 
      error: 'Server error', 
      message: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT: Update wishlist for a user
export async function PUT(req: NextRequest, context: any) {
  try {
    // Extract and validate userId
    const params = await context.params;
    const userId = params.userId;
    if (!userId) {
      console.error('[Wishlist API] No userId provided');
      return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
    }

    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) {
      console.error('[Wishlist API] No token provided');
      return NextResponse.json({ error: 'Unauthorized: No token' }, { status: 401 });
    }

    let payload: any;
    try {
      payload = await jose.jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    } catch (e) {
      console.error('[Wishlist API] Token verification failed:', e);
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // Verify user is updating their own wishlist
    if (payload.payload.userId !== userId && payload.payload.sub !== userId) {
      console.error('[Wishlist API] UserId mismatch:', { tokenId: payload.payload.userId, requestedId: userId });
      return NextResponse.json({ error: 'Forbidden: Cannot modify another user\'s wishlist' }, { status: 403 });
    }

    // Parse and validate request body
    let items;
    try {
      const body = await req.json();
      items = body.items;
      if (!Array.isArray(items)) {
        throw new Error('Items must be an array');
      }
    } catch (e) {
      console.error('[Wishlist API] Invalid request body:', e);
      return NextResponse.json({ error: 'Bad Request: Invalid wishlist data' }, { status: 400 });
    }

    // Update wishlist in database
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'ladoo_zabardast_db');
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { wishlist: items } }
    );

    if (result.matchedCount === 0) {
      console.error('[Wishlist API] User not found:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (result.modifiedCount === 0) {
      console.warn('[Wishlist API] No changes made to wishlist');
    }

    return NextResponse.json({ 
      success: true,
      message: 'Wishlist updated successfully'
    });

  } catch (err) {
    console.error('[Wishlist API] Server error:', err);
    return NextResponse.json({ 
      error: 'Server error', 
      message: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
