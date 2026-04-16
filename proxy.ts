import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'srms_token';

const PUBLIC_PATHS = ['/login', '/signup'];
const AUTH_PATHS = ['/login', '/signup'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;

  // Redirect authenticated users away from login/signup
  if (AUTH_PATHS.some(p => pathname.startsWith(p)) && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Protect dashboard routes — redirect unauthenticated users to login
  const isDashboardRoute = !PUBLIC_PATHS.some(p => pathname.startsWith(p)) &&
    !pathname.startsWith('/api') &&
    pathname !== '/';

  if (isDashboardRoute && !token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
