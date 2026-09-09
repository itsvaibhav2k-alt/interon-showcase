import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'interon-session';

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path.startsWith('/admin')) {
    if (!req.cookies.has(SESSION_COOKIE)) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
