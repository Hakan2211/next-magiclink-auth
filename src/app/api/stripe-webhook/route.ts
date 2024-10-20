import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { MagicLinkEmail } from '@/app/components/emails/MagicLinkEmail';
import React from 'react';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia',
});
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')!;
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  console.log('Received Stripe event:', event.type);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_email!;

    // Update user payment status
    const { error: updateError } = await supabase
      .from('users')
      .update({ paymentStatus: 'paid' })
      .eq('email', email);

    if (updateError) {
      console.error('Error updating payment status:', updateError);
    }

    // Generate magic link token
    const magicLinkToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString(); // Expires in 1 hour

    const { error: tokenError } = await supabase
      .from('users')
      .update({
        magic_link_token: magicLinkToken,
        magic_link_expires_at: expiresAt,
      })
      .eq('email', email);

    if (tokenError) {
      console.error('Error updating magic link token:', tokenError);
      // Handle error
    }

    // Send magic link email
    const magicLinkUrl = `${process.env.NEXT_PUBLIC_DOMAIN}/verify?token=${magicLinkToken}`;

    await resend.emails.send({
      from: 'Hakan@hakanda.com',
      to: email,
      subject: 'Your Magic Link',
      react: React.createElement(MagicLinkEmail, { url: magicLinkUrl }),
    });
  }

  return NextResponse.json({ received: true });
}
