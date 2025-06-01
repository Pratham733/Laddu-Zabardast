import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  console.log("[Health API] Request received");
  const startTime = Date.now();

  try {
    // Test MongoDB connection with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('MongoDB connection timeout')), 5000);
    });

    const connectionPromise = Promise.all([
      connectToDatabase(),
      clientPromise
    ]);

    await Promise.race([connectionPromise, timeoutPromise]);

    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Health API] Error:', error);
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
