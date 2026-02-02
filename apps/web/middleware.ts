import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// SIMPLIFIED MIDDLEWARE - Auth is handled by NextAuth's authorized callback
// This middleware only handles locale

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/logo.png')
  ) {
    return NextResponse.next();
  }

  // Set locale from cookie for next-intl
  const response = NextResponse.next();
  const localeCookie = request.cookies.get('NEXT_LOCALE')?.value;
  if (localeCookie && ['vi', 'en'].includes(localeCookie)) {
    response.headers.set('x-next-intl-locale', localeCookie);
  }
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons|logo.png).*)',
  ],
};
