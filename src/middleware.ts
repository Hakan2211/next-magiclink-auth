import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

class MemoryStore {
  private store: Map<string, { count: number; resetTime: number }>;
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.store = new Map();

    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (value.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }

  increment(key: string, windowMs: number): number {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record) {
      this.store.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return 1;
    }

    // If the window has expired, reset the counter
    if (record.resetTime <= now) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return 1;
    }

    record.count += 1;
    return record.count;
  }

  getResetTime(key: string): number | null {
    const record = this.store.get(key);
    return record ? record.resetTime : null;
  }
}

const store = new MemoryStore();

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const rateLimits: Record<string, RateLimitConfig> = {
  login: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 requests per minute
  verify: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 requests per minute
  enroll: { windowMs: 60 * 1000, maxRequests: 3 }, // 3 requests per minute
};

function getClientIp(request: NextRequest): string {
  // Try to get IP from Vercel's headers first
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  // Fallback to request.ip
  return request.ip || 'unknown';
}

export async function rateLimit(request: NextRequest) {
  const ip = getClientIp(request);
  const path = request.nextUrl.pathname;

  let rateLimitKey: keyof typeof rateLimits | null = null;

  if (path === '/api/login') rateLimitKey = 'login';
  else if (path === '/verify') rateLimitKey = 'verify';
  else if (path === '/api/enroll') rateLimitKey = 'enroll';

  if (!rateLimitKey) return NextResponse.next();

  const config = rateLimits[rateLimitKey];
  const key = `${rateLimitKey}:${ip}`;

  const requestCount = store.increment(key, config.windowMs);

  if (requestCount > config.maxRequests) {
    const resetTime = store.getResetTime(key);
    const retryAfter = resetTime
      ? Math.ceil((resetTime - Date.now()) / 1000)
      : config.windowMs / 1000;

    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
        },
      }
    );
  }

  return NextResponse.next();
}

export async function middleware(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request);
  if (rateLimitResponse.status === 429) {
    return rateLimitResponse;
  }

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
  matcher: ['/api/login', '/api/enroll', '/verify', '/course/:path*'],
};
