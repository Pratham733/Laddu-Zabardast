import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import * as bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { ObjectId } from 'mongodb';
import { rateLimitAuth } from '@/lib/rate-limiter';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
  // Apply rate limiting
  try {
    const rateLimit = await rateLimitAuth(req);
    if (!rateLimit.success) {
      console.warn(`[Change Password API] Rate limit exceeded for IP ${rateLimit.ip}`);
      return new NextResponse(
        JSON.stringify({ error: 'Too many password change attempts. Please try again later.' }),
        { 
          status: 429, 
          headers: { 
            'Retry-After': rateLimit.retryAfter?.toString() || '60',
            'Content-Type': 'application/json'
          } 
        }
      );
    }
  } catch (error) {
    console.error('[Change Password API] Rate limiting error:', error);
    // Continue processing if rate limiting fails
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[Change Password API] No bearer token found in authorization header');
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify JWT token
    let payload;
    try {
      const verifiedToken = await jose.jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
      payload = verifiedToken.payload;
    } catch (e) {
      console.error('[Change Password API] Token verification failed:', e);
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Extract user ID from token
    const rawUserId = payload.userId || payload.sub;
    if (!rawUserId || typeof rawUserId !== 'string') {
      console.error('[Change Password API] Invalid userId in token:', rawUserId);
      return NextResponse.json({ error: 'Unauthorized - Invalid user ID' }, { status: 401 });
    }

    // Parse request body
    let currentPassword, newPassword;
    try {
      const body = await req.json();
      currentPassword = body.currentPassword;
      newPassword = body.newPassword;

      if (!currentPassword || !newPassword) {
        throw new Error('Missing required fields');
      }
    } catch (e) {
      console.error('[Change Password API] Invalid request body:', e);
      return NextResponse.json({ 
        error: 'Bad Request - currentPassword and newPassword are required' 
      }, { status: 400 });
    }

    const userId = new ObjectId(rawUserId);
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'ladoo_zabardast_db');

    // Find user
    const user = await db.collection('users').findOne({ _id: userId });
    if (!user || !user.password) {
      console.error('[Change Password API] User not found or missing password for ID:', rawUserId);
      return NextResponse.json({ error: 'User not found or missing password' }, { status: 404 });    }

    // Verify current password
    const passwordMatches = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatches) {
      console.error('[Change Password API] Incorrect current password for user:', rawUserId);
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return NextResponse.json({ 
        error: 'New password must be at least 6 characters long' 
      }, { status: 400 });
    }

    // Hash and update new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    const result = await db.collection('users').updateOne(
      { _id: userId },
      { 
        $set: { 
          password: hashedNewPassword,
          updatedAt: new Date()
        } 
      }
    );

    if (result.modifiedCount === 0) {
      console.error('[Change Password API] Failed to update password for user:', rawUserId);
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    console.log('[Change Password API] Successfully updated password for user:', rawUserId);
    return NextResponse.json({ 
      message: 'Password updated successfully',
      success: true
    });

  } catch (error) {
    console.error('[Change Password API] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred' 
    }, { status: 500 });
  }
}
