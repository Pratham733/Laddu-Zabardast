
// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';
// import * as jose from 'jose'; // Import jose for JWT verification

// // Define the routes that require authentication
// const protectedRoutes = ['/profile', '/orders', '/checkout'];
// const JWT_SECRET = process.env.JWT_SECRET;

// async function verifyToken(token: string): Promise<boolean> {
//     if (!JWT_SECRET) {
//         console.error('JWT_SECRET is not defined in environment variables.');
//         return false;
//     }
//     try {
//         const secret = new TextEncoder().encode(JWT_SECRET);
//         await jose.jwtVerify(token, secret);
//         return true; // Token is valid
//     } catch (error) {
//         console.error('JWT Verification failed:', error);
//         return false; // Token is invalid or expired
//     }
// }

// export async function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;
//   // Check for the generic 'authToken' cookie (or header if you prefer)
//   const authToken = request.cookies.get('authToken')?.value; // Get the cookie value

//   // Check if the route is protected
//   if (protectedRoutes.some(route => pathname.startsWith(route))) {
//     if (!authToken) {
//       // No token found, redirect to login
//       const loginUrl = new URL('/login', request.url);
//       loginUrl.searchParams.set('redirect', pathname);
//       console.log(`Middleware: No auth token found for protected route ${pathname}. Redirecting to login.`);
//       return NextResponse.redirect(loginUrl);
//     }

//     // Verify the JWT token
//     const isTokenValid = await verifyToken(authToken);

//     if (!isTokenValid) {
//         // Token is invalid or expired, redirect to login
//         const loginUrl = new URL('/login', request.url);
//         loginUrl.searchParams.set('redirect', pathname);
//          console.log(`Middleware: Invalid or expired token for protected route ${pathname}. Redirecting to login.`);
//          // Clear the invalid cookie
//          const response = NextResponse.redirect(loginUrl);
//          response.cookies.delete('authToken');
//         return response;
//     }

//     // Token is present and valid, allow access
//     console.log(`Middleware: Valid token found for protected route ${pathname}. Allowing access.`);
//   }

//   // Allow the request to proceed for non-protected routes or valid tokens
//   return NextResponse.next();
// }

// // Configure the middleware to run only on specified paths
// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - api (API routes)
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      * - login (allow access to login)
//      * - signup (allow access to signup)
//      * Exclude public assets if any:
//      * - /images/:path*
//      * - /.*\\..* (files with extensions, e.g., .png, .jpg)
//      */
//     '/',
//     '/profile/:path*',
//     '/orders/:path*',
//     '/checkout/:path*',
//     // Add other paths you want the middleware to run on, if any.
//     // If you want it on ALL pages except the exclusions:
//     // '/((?!api|_next/static|_next/image|favicon.ico|login|signup|images|.*\\..*).*)',
//   ],
// };
      
//src/middleware.ts
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
};
