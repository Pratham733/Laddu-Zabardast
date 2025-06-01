import { RateLimiterMemory } from 'rate-limiter-flexible';
import { NextRequest, NextResponse } from 'next/server';

// Create separate rate limiters for different endpoints
const authLimiter = new RateLimiterMemory({
  points: 5, // Number of requests
  duration: 60, // Per 60 seconds
});

const apiLimiter = new RateLimiterMemory({
  points: 30, // Number of requests
  duration: 60, // Per 60 seconds
});

interface RateLimitResponse {
  success: boolean;
  ip: string;
  retryAfter?: number;
}

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') ?? '127.0.0.1';
}

export async function rateLimitAuth(request: NextRequest): Promise<RateLimitResponse> {
  const ip = getClientIP(request);
  try {
    await authLimiter.consume(ip);
    return { success: true, ip };
  } catch (error: any) {
    return {
      success: false,
      ip,
      retryAfter: error.msBeforeNext ? Math.ceil(error.msBeforeNext / 1000) : 60
    };
  }
}

export async function rateLimitApi(request: NextRequest): Promise<RateLimitResponse> {
  const ip = getClientIP(request);
  try {
    await apiLimiter.consume(ip);
    return { success: true, ip };
  } catch (error: any) {
    return {
      success: false,
      ip,
      retryAfter: error.msBeforeNext ? Math.ceil(error.msBeforeNext / 1000) : 60
    };
  }
}
