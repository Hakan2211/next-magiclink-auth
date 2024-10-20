import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { MagicLinkEmail } from '@/app/components/emails/MagicLinkEmail';
import React from 'react';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  const { email, website } = await req.json();

  //honeypot check
  if (website) {
    console.warn('Honeypot triggered on login by email:', email);
    // You can optionally log this attempt
    return NextResponse.json(
      { message: 'Bot detected. Access denied.' },
      { status: 400 }
    );
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (!user) {
    return NextResponse.json({
      message: 'Email not found. Please enroll first.',
    });
  }

  if (user.paymentStatus !== 'paid') {
    return NextResponse.json({
      message: 'You need to enroll before logging in.',
    });
  }

  // Generate magic link token
  const magicLinkToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

  await supabase
    .from('users')
    .update({
      magic_link_token: magicLinkToken,
      magic_link_expires_at: expiresAt,
    })
    .eq('email', email);

  // Send magic link email
  const magicLinkUrl = `${process.env.NEXT_PUBLIC_DOMAIN}/verify?token=${magicLinkToken}`;

  await resend.emails.send({
    from: 'Hakan@hakanda.com',
    to: email,
    subject: 'Your Magic Link',
    react: React.createElement(MagicLinkEmail, { url: magicLinkUrl }),
  });

  return NextResponse.json({ message: 'Magic link sent to your email.' });
}
