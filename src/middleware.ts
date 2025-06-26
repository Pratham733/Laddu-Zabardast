//src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
  // Removed 'Content-Type': 'application/json' to allow correct Content-Type for uploads
};

// Define the routes that require authentication
const protectedRoutes = [
  '/profile', 
  '/orders', 
  '/checkout',
  '/wishlist'
];

const protectedApiRoutes = [
  '/api/wishlist',
  '/api/orders',
  '/api/upload-product-image'
];

const JWT_SECRET = process.env.JWT_SECRET;

// Check if JWT_SECRET is defined at load time, else throw error
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined.');
}

// Encode the secret once here since it won't change
const secret = new TextEncoder().encode(JWT_SECRET);

function getAuthToken(request: NextRequest): string | null {
  return request.cookies.get('authToken')?.value || 
         request.cookies.get('next-auth.session-token')?.value ||
         request.headers.get('Authorization')?.replace('Bearer ', '') ||
         null;
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    await jose.jwtVerify(token, secret);
    return true;
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle OPTIONS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  const token = getAuthToken(request);

  // Check if it's an API route
  if (pathname.startsWith('/api/')) {
    if (protectedApiRoutes.some(route => pathname.startsWith(route))) {
      if (!token) {
        console.error(`API Authentication failed: No token provided for ${pathname}`);
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized: No token provided' }),
          { status: 401, headers: corsHeaders }
        );
      }

      const isValid = await verifyToken(token);
      if (!isValid) {
        console.error(`API Authentication failed: Invalid token for ${pathname}`);
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized: Invalid token' }),
          { status: 401, headers: corsHeaders }
        );
      }
    }

    // Add CORS headers to all API responses
    const response = NextResponse.next();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // Handle protected routes (non-API)
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      console.log(`No auth token found for protected route ${pathname}. Redirecting to login.`);
      return NextResponse.redirect(loginUrl);
    }

    const isValid = await verifyToken(token);
    if (!isValid) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      console.log(`Invalid token for protected route ${pathname}. Redirecting to login.`);
      
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('authToken');
      return response;
    }
  }

  return NextResponse.next();
}

// Configure the middleware to run on specified paths
export const config = {
  matcher: [
    '/',
    '/profile/:path*',
    '/orders/:path*',
    '/checkout/:path*',
    '/api/:path*',
    '/admin/:path*',
    // Exclude Next.js static resources and API routes we want public
    '/((?!_next/static|_next/image|favicon.ico|login|signup|images).*)',
  ],
}
