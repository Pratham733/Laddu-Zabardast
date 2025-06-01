//src/app/api/update-profile/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import * as jose from 'jose';
import { ObjectId } from 'mongodb';
import { rateLimitApi } from '@/lib/rate-limiter';

const updateProfileSchema = z.object({
  // Define fields that can be updated
  username: z.string().min(3).optional(),
  email: z.string().email().optional(), // Allow email update, handle conflicts later
  phone: z.string().regex(/^[+]?\d{10,15}$/).optional().or(z.literal('')),
  photoURL: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z.string()
      .refine(
        (val) =>
          !val ||
          /^\/images\/[\w\d._-]+\.(jpg|jpeg|png|gif)$/i.test(val) ||
          /^https?:\/\//.test(val),
        {
          message: 'photoURL must be a valid image path or URL',
        }
      )
      .optional()
  ),
  // Add other updatable fields here
});

const JWT_SECRET = process.env.JWT_SECRET;

async function verifyTokenAndGetUserId(token: string): Promise<string | null> {
    console.log("[Update Profile API] Verifying token...");
    if (!JWT_SECRET) {
        console.error('[Update Profile API Error] JWT_SECRET is not defined in environment variables for verification.');
        return null;
    }
    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jose.jwtVerify(token, secret);
        console.log("[Update Profile API] Token payload:", payload);
        // Ensure payload.userId and payload.sub are strings, if both present, prioritize userId
        if (typeof payload.userId === 'string') {
            console.log("[Update Profile API] Token verified successfully, userId:", payload.userId);
            return payload.userId;
        }
        if (typeof payload.sub === 'string') {
            console.log("[Update Profile API] Token verified successfully using sub as userId:", payload.sub);
            return payload.sub;
        }



        console.error('[Update Profile API Error] JWT payload missing userId or sub.');
        return null;
    } catch (error: any) {
        console.error('[Update Profile API Error] JWT Verification failed:', error.message, error.stack);
        return null;
    }
}

export async function POST(request: NextRequest) {
  console.log("[Update Profile API] Request received");

  // Apply rate limiting
  try {
    const rateLimit = await rateLimitApi(request);
    if (!rateLimit.success) {
      console.warn(`[Update Profile API] Rate limit exceeded for IP ${rateLimit.ip}`);
      return new NextResponse(
        JSON.stringify({ error: 'Too many profile update attempts. Please try again later.' }),
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
    console.error('[Update Profile API] Rate limiting error:', error);
    // Continue processing if rate limiting fails
  }

  if (!JWT_SECRET) {
    console.error('[Update Profile API Error] JWT_SECRET is not set.');
    return NextResponse.json({ error: 'Internal Server Configuration Error (JWT Secret missing)' }, { status: 500 });
  }

  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1]; // Get token from "Bearer <token>"

  if (!token) {
    console.warn('[Update Profile API Warn] Request unauthorized: No token provided.');
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }

  const userId = await verifyTokenAndGetUserId(token);

  if (!userId) {
     console.warn('[Update Profile API Warn] Request unauthorized: Invalid token.');
    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
  }
   console.log(`[Update Profile API] Authenticated user ID for profile update: ${userId}`);

  let mongoClient;
  try {
    const body = await request.json();
    console.log("[Update Profile API] Request body parsed:", body);

    // Validate input body against the schema
    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) {
      console.error("[Update Profile API Error] Validation failed:", validation.error.errors);
      const errorMessages = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return NextResponse.json({ error: `Invalid input: ${errorMessages}` }, { status: 400 });
    }

    const { username, email, phone, photoURL } = validation.data;

    // Prepare update data - only include fields that were actually provided in the request
    const updateData: Record<string, any> = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (photoURL !== undefined) updateData.photoURL = photoURL;
    // Add other fields from validation.data if they exist
    console.log("[Update Profile API] Data prepared for update:", updateData);


    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
       console.warn("[Update Profile API Warn] Request contained no fields to update.");
       return NextResponse.json({ message: 'No fields provided for update' }, { status: 400 });
    }

     // --- Database Connection ---
     try {
        console.log("[Update Profile API] Attempting to get MongoDB client promise...");
        mongoClient = await clientPromise;
        console.log("[Update Profile API] MongoDB client promise resolved successfully.");
     } catch (dbConnectError: any) {
        console.error("[Update Profile API Error] Failed to get MongoDB client promise:", dbConnectError.message, dbConnectError.stack);
        return NextResponse.json({ error: 'Database connection error. Please check server logs.' }, { status: 500 });
    }

    const dbName = process.env.MONGODB_DB_NAME || "ladoo_zabardast_db";
    const db = mongoClient.db(dbName);
    const usersCollection = db.collection("users");
    console.log(`[Update Profile API] Using database: ${dbName}, collection: users`);

    // --- Optional: Check if email is being updated and if it's already taken ---
    if (email) {
        console.log(`[Update Profile API] Checking if email ${email} is already taken by another user...`);
        let existingUserWithEmail;
        try {
            existingUserWithEmail = await usersCollection.findOne({
                email: email,
                _id: { $ne: new ObjectId(userId) } // Exclude the current user
            });
            console.log(`[Update Profile API] Existing user check result for email ${email}:`, existingUserWithEmail ? 'Found' : 'Not Found');
        } catch (findError: any) {
             console.error(`[Update Profile API Error] Error checking for existing email ${email}:`, findError.message, findError.stack);
             return NextResponse.json({ error: 'Error checking email availability. Please check server logs.' }, { status: 500 });
        }

        if (existingUserWithEmail) {
            console.warn(`[Update Profile API Warn] Update failed: Email ${email} already in use by another account.`);
            return NextResponse.json({ error: 'Email already in use by another account' }, { status: 409 }); // 409 Conflict
        }
    }
    // --- End Optional Check ---

    // Add a timestamp for the last update
    updateData.updatedAt = new Date();
    console.log("[Update Profile API] Updating user document with ID:", userId);


    // Update the user document in MongoDB
    let result;
    try {
        result = await usersCollection.updateOne(
          { _id: new ObjectId(userId) }, // Find user by their ObjectId
          { $set: updateData }
        );
        console.log("[Update Profile API] MongoDB update result:", result);
    } catch (updateError: any) {
         console.error(`[Update Profile API Error] Error updating profile for user ${userId}:`, updateError.message, updateError.stack);
         return NextResponse.json({ error: 'Error updating user profile in database. Please check server logs.' }, { status: 500 });
    }


    if (result.matchedCount === 0) {
      console.warn(`[Update Profile API Warn] Update failed: User with ID ${userId} not found.`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Always fetch and return the latest user data, even if not modified
    let updatedUser;
    try {
      updatedUser = await usersCollection.findOne(
        { _id: new ObjectId(userId) },
        { projection: { password: 0, resetPasswordToken: 0, resetPasswordExpires: 0 } } // Exclude sensitive fields
      );
      console.log("[Update Profile API] Updated user data fetched successfully:", updatedUser);
    } catch (fetchError: any) {
      console.error(`[Update Profile API Error] Error fetching updated profile for user ${userId}:`, fetchError.message, fetchError.stack);
      // Still return success, but log the error. The update itself succeeded.
      return NextResponse.json({ message: 'Profile updated successfully, but failed to fetch updated data.' }, { status: 200 });
    }

    if (result.modifiedCount === 0 && result.matchedCount > 0) {
      console.log(`[Update Profile API] Profile data for user ${userId} is already up to date. No changes applied.`);
      return NextResponse.json({ message: 'Profile data is already up to date', user: updatedUser }, { status: 200 });
    }

    console.log(`[Update Profile API] Profile updated successfully for user ID: ${userId}`);
    return NextResponse.json({ message: 'Profile updated successfully', user: updatedUser }, { status: 200 });

  } catch (error: any) {
     // --- Catch errors from request.json() or other unexpected issues ---
     if (error instanceof SyntaxError && error.message.includes('JSON')) {
         console.error('[Update Profile API Error] Invalid JSON received in request body:', error.message);
         return NextResponse.json({ error: 'Invalid request body format. Expected JSON.' }, { status: 400 });
     }

    // Generic catch-all for other unhandled errors
    console.error('[Update Profile API Error] Unhandled error during profile update:', error.message, error.stack);
    return NextResponse.json({ error: 'Internal Server Error updating profile. Please check server logs.' }, { status: 500 });
  }
}
