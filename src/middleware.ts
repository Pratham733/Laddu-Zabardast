import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose'; // Import jose for JWT verification

// Define the routes that require authentication
const protectedRoutes = ['/profile', '/orders', '/checkout'];

const JWT_SECRET = process.env.JWT_SECRET;

// Check if JWT_SECRET is defined at load time, else throw error
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined.');
}

// Encode the secret once here since it won't change
const secret = new TextEncoder().encode(JWT_SECRET);

async function verifyToken(token: string): Promise<boolean> {
  try {
    await jose.jwtVerify(token, secret);
    return true; // Token is valid
  } catch (error) {
    console.error('JWT Verification failed:', error);
    return false; // Token is invalid or expired
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for the 'authToken' cookie
  const authToken = request.cookies.get('authToken')?.value;

  // Check if the route is protected
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!authToken) {
      // No token found, redirect to login with redirect param
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      console.log(`Middleware: No auth token found for protected route ${pathname}. Redirecting to login.`);
      return NextResponse.redirect(loginUrl);
    }

    // Verify the JWT token
    const isTokenValid = await verifyToken(authToken);

    if (!isTokenValid) {
      // Token is invalid or expired, redirect to login and delete cookie
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      console.log(`Middleware: Invalid or expired token for protected route ${pathname}. Redirecting to login.`);
      
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('authToken');
      return response;
    }

    // Token is valid, allow access
    console.log(`Middleware: Valid token found for protected route ${pathname}. Allowing access.`);
  }

  // Handle OPTIONS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Check if the request is to the API
  if (request.nextUrl.pathname.startsWith('/api')) {
    const response = NextResponse.next();
    
    // Add CORS headers to API responses
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }

  // Allow request for non-protected routes or valid tokens
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
