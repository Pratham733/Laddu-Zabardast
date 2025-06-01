import { connectToDatabase } from '@/lib/mongoose';
import { NextResponse, type NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '@/model/User';
import { rateLimitAuth } from '@/lib/rate-limiter';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const JWT_SECRET = process.env.JWT_SECRET;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

if (!JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET environment variable is not defined at startup.');
}

export async function POST(request: NextRequest) {
  console.log("[Login API] Request received");

  // Apply rate limiting
  try {
    const rateLimit = await rateLimitAuth(request);
    if (!rateLimit.success) {
      console.warn(`[Login API] Rate limit exceeded for IP ${rateLimit.ip}`);
      return new NextResponse(
        JSON.stringify({ error: 'Too many login attempts. Please try again later.' }),
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
    console.error('[Login API] Rate limiting error:', error);
    // Continue processing if rate limiting fails
  }

  if (!JWT_SECRET) {
    return NextResponse.json({ error: 'Internal Server Configuration Error (JWT Secret missing)' }, { status: 500 });
  }

  try {
    const body = await request.json();
    console.log("[Login API] Request body parsed:", body);

    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      const errorMessages = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return NextResponse.json({ error: `Invalid input: ${errorMessages}` }, { status: 400 });
    }

    const { email, password } = validation.data;
    console.log(`[Login API] Attempting login for email: ${email}`);    try {
      await Promise.race([
        connectToDatabase(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database connection timeout')), 5000)
        )
      ]);
    } catch (error) {
      console.error('[Login API] Database connection error:', error);
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
    }

    const user = await User.findOne({ email }).maxTimeMS(5000).exec();

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        firstName: user.firstName || '', // ✅ Add firstName
        lastName: user.lastName || '',   // ✅ Add lastName
        phone: user.phone || '',
        picture: user.picture || '',
        addresses: user.addresses || [],
        role: user.role || null,
        isAdmin: user.isAdmin || false,
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Remove sensitive info
    const { password: _, ...userData } = user._doc;    // Async user sync - don't await
    fetch(`${baseUrl}/api/upsert-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        picture: user.picture || '',
      }),
    }).catch(err => {
      console.error('[Login API Error] Error syncing user data with upsert-user API:', err);
    });

    // Create full response
    const response = NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
        picture: user.picture || '',
        addresses: user.addresses || [],
      },
    }, { status: 200 });

    // Set httpOnly cookie
    response.cookies.set('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 3600,
      path: '/',
    });

    return response;

  } catch (error: any) {
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return NextResponse.json({ error: 'Invalid request body format. Expected JSON.' }, { status: 400 });
    }

    console.error('[Login API Error] Unhandled error during login:', error.message, error.stack);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
