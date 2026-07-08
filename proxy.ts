import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  // Check if the request is for an admin route
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isAdminApiRoute = request.nextUrl.pathname.startsWith('/api/admin');
  
  // Cron route authenticates via CRON_SECRET header — skip JWT middleware
  const isCronRoute = request.nextUrl.pathname === '/api/admin/run-scheduled-event-emails';

  if ((isAdminRoute || isAdminApiRoute) && !isCronRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (!token.isAdmin) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // For protected API routes that require authentication (but not necessarily admin)
  const isProtectedApiRoute = request.nextUrl.pathname.startsWith('/api/users') ||
                               request.nextUrl.pathname.includes('/register') ||
                               request.nextUrl.pathname.includes('/unregister');
  
  if (isProtectedApiRoute && !isAdminApiRoute) {
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/users/:path*',
    '/api/events/:path*/register',
    '/api/events/:path*/unregister'
  ]
};