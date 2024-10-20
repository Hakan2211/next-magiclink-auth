// app/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_DOMAIN}/login`);
  }

  try {
    // Find user with matching token
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('magic_link_token', token)
      .single();

    if (error || !user) {
      console.error('User not found or error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_DOMAIN}/login`);
    }

    // Check if the magic link has expired
    const expiresAt = new Date(user.magic_link_expires_at);
    const currentTime = new Date();

    if (expiresAt.getTime() < currentTime.getTime()) {
      console.error('Magic link has expired');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_DOMAIN}/login`);
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        // Add a timestamp to ensure uniqueness
        iat: Math.floor(Date.now() / 1000),
      },
      process.env.JWT_SECRET!,
      { expiresIn: '365d' }
    );

    // Create the response first
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_DOMAIN}/course`
    );

    // Set the cookie with the JWT token
    response.cookies.set({
      name: 'session',
      value: jwtToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year in seconds
    });

    // Clear the magic link token
    await supabase
      .from('users')
      .update({
        magic_link_token: null,
        magic_link_expires_at: null,
        last_login: new Date().toISOString(),
      })
      .eq('id', user.id);

    return response;
  } catch (error) {
    console.error('Error in verify route:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_DOMAIN}/login`);
  }
}
