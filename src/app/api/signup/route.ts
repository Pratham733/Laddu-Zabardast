//src/app/api/signup/route.ts
import { NextResponse, NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import clientPromise from '@/lib/mongodb'; // Import clientPromise
import { MongoClient } from 'mongodb'; // Import MongoClient
import { rateLimitAuth } from '@/lib/rate-limiter';

const port = process.env.PORT || 9004;
const signupSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Apply rate limiting
  try {
    const rateLimit = await rateLimitAuth(request);
    if (!rateLimit.success) {
      console.warn(`[Signup API] Rate limit exceeded for IP ${rateLimit.ip}`);
      return new NextResponse(
        JSON.stringify({ error: 'Too many signup attempts. Please try again later.' }),
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
    console.error('[Signup API] Rate limiting error:', error);
    // Continue processing if rate limiting fails
  }

  let mongoClient;
  try {
    const body = await request.json();
    console.log("[Signup API] Request body parsed:", body);

    // Validate input
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {    console.error('[Signup API Error] Validation failed:', validation.error.errors);
      const errorMessages = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return new NextResponse(
        JSON.stringify({ error: `Invalid input: ${errorMessages}` }), 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
    }

    const { firstName, lastName, email, password } = validation.data;
    console.log(`[Signup API] Attempting signup for email: ${email}, firstName: ${firstName}, lastName: ${lastName}`);

    const client: MongoClient = await clientPromise; // Get the client
    const db = client.db(process.env.MONGODB_DB_NAME); // Get the database
    const usersCollection = db.collection('users'); // Define usersCollection here
    
    // --- Check Existing User ---
    let existingUser;
    try {
        console.log(`[Signup API] Checking if user exists with email: ${email}`);
        existingUser = await usersCollection.findOne({ email });
      } catch (findError: any) {
          console.error(`[Signup API Error] Error finding user with email:`, findError.message, findError.stack);
          return NextResponse.json({ error: 'Error checking user existence. Please check server logs.' }, { status: 500 });
      }

    if (existingUser) {
        if (existingUser.email === email) {
          console.warn(`[Signup API Warn] Signup attempt failed: Email ${email} already in use.`);
          return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
        }
    }

    // --- Create User ---
    const saltRounds = 10;
    let hashedPassword;
    try {
        console.log("[Signup API] Hashing password...");
        hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log("[Signup API] Password hashed successfully.");
    } catch (hashError: any) {
        console.error('[Signup API Error] Error hashing password for:', email, hashError.message, hashError.stack);
        return NextResponse.json({ error: 'Internal Server Error during signup process (hashing). Please check server logs.' }, { status: 500 });
    }

    try {
      const result = await usersCollection.insertOne({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        createdAt: new Date(),
      });
      if (!result.insertedId) {
        console.error(`[Signup API Error] User not created for email: ${email}`);
        return NextResponse.json({ error: 'User creation failed. Please check the logs.' }, { status: 500 });
      }
    } catch (insertError: any) {
      console.error('[Signup API Error] Error inserting user:', email, insertError.message, insertError.stack);
      return NextResponse.json({ error: 'Error during user creation process.' }, { status: 500 });
    }

    return NextResponse.json({ message: "User signed up successfully!" });

  } catch (error: any) {
    // --- Catch errors from request.json() or other unexpected issues ---
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
        console.error('[Signup API Error] Invalid JSON received in request body:', error.message);
        return NextResponse.json({ error: 'Invalid request body format. Expected JSON.' }, { status: 400 });
    }

    // Generic catch-all for other unhandled errors
    console.error('[Signup API Error] Unhandled error during signup:', error.message, error.stack);
    return NextResponse.json({ error: 'Internal Server Error. Please check server logs.' }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
