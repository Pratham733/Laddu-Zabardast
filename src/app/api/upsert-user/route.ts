import { NextResponse, type NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const upsertUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
});

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET environment variable is not defined at startup.');
}

export async function POST(request: NextRequest) {
  console.log("[Upsert User API] Request received");

  if (!JWT_SECRET) {
    console.error('[Upsert User API Error] JWT_SECRET is not set.');
    return NextResponse.json(
      { error: 'Internal Server Configuration Error (JWT Secret missing)' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    console.log("[Upsert User API] Parsed body:", body);

    const validation = upsertUserSchema.safeParse(body);
    if (!validation.success) {
      const errorMessages = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      console.error("[Validation Error]", errorMessages);
      return NextResponse.json({ error: `Invalid input: ${errorMessages}` }, { status: 400 });
    }    const { firstName, lastName, email } = validation.data;

    const mongoClient = await clientPromise;
    const db = mongoClient.db(process.env.MONGODB_DB_NAME);
    const usersCollection = db.collection("users");

    const updateData: Record<string, any> = { lastLogin: new Date(), firstName, lastName };

    // Perform upsert operation
    await usersCollection.updateOne(
      { email },
      {
        $set: updateData,
        $setOnInsert: { email, createdAt: new Date() }, // Only fields not in $set
      },
      { upsert: true }
    );

    // Fetch the user after upsert
    const user = await usersCollection.findOne({ email });

    if (!user || !user._id) {
      console.error("[Upsert User API Error] Failed to retrieve user after upsert.");
      return NextResponse.json(
        { error: 'Failed to retrieve user after upsert.' },
        { status: 500 }
      );
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const statusCode = user.createdAt ? 201 : 200;
    const message = user.createdAt ? 'User created successfully' : 'User updated successfully';

    console.log(`[Upsert User API] ${message}, ID: ${user._id}`);

    return NextResponse.json({ message, token }, { status: statusCode });

  } catch (error: any) {
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      console.error('[Upsert User API Error] Invalid JSON:', error.message);
      return NextResponse.json({ error: 'Invalid JSON format.' }, { status: 400 });
    }

    console.error('[Upsert User API Error] Unexpected error:', error.message, error.stack);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
