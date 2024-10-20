import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;

  if (!session && request.nextUrl.pathname.startsWith('/course')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session) {
    try {
      // Verify the JWT token
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      await jwtVerify(session, secret);
    } catch (error) {
      // If token verification fails, clear the cookie and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/course/:path*'],
};
