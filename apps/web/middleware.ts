import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// DO NOT import auth() here - it uses bcrypt which doesn't work in Edge Runtime!
// Use getToken() instead which is Edge-compatible

// Paths that don't need any middleware processing
const skipPaths = ['/api', '/_next', '/favicon.ico', '/manifest.json', '/sw.js', '/icons', '/offline', '/logo.png'];

// Auth-excluded paths (no authentication needed)
const authExcludedPaths = ['/login', '/forgot-password', '/reset-password', '/register', '/offline', '/auth'];

// Check if path should skip middleware entirely
function shouldSkip(pathname: string): boolean {
  return skipPaths.some((path) => pathname.startsWith(path));
}

// Check if path is auth-excluded
function isAuthExcludedPath(pathname: string): boolean {
  return authExcludedPaths.some((path) => pathname === path || pathname.startsWith(path + '/'));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware entirely for static files and API routes
  if (shouldSkip(pathname)) {
    return NextResponse.next();
  }

  // For auth-excluded paths, set locale from cookie and continue
  if (isAuthExcludedPath(pathname)) {
    const response = NextResponse.next();
    // Read locale from cookie and set header for next-intl
    const localeCookie = request.cookies.get('NEXT_LOCALE')?.value;
    if (localeCookie && ['vi', 'en'].includes(localeCookie)) {
      response.headers.set('x-next-intl-locale', localeCookie);
    }
    return response;
  }

  // For protected routes, check auth using Edge-compatible getToken
  // AUTH_SECRET is the NextAuth v5 standard, NEXTAUTH_SECRET is legacy
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    // Not authenticated, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated, set locale from cookie and continue
  const response = NextResponse.next();
  const localeCookie = request.cookies.get('NEXT_LOCALE')?.value;
  if (localeCookie && ['vi', 'en'].includes(localeCookie)) {
    response.headers.set('x-next-intl-locale', localeCookie);
  }
  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons|logo.png).*)',
  ],
};
