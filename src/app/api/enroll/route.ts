// app/api/enroll/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$/;

export async function POST(req: NextRequest) {
  const { email, website } = await req.json();

  // Validate the email with regex
  if (!email || !emailRegex.test(email)) {
    return NextResponse.json(
      { message: 'Please enter a valid email address.', type: 'error' },
      { status: 400 }
    );
  }

  // Honeypot check
  if (website) {
    console.warn('Honeypot triggered on enroll by email:', email);
    return NextResponse.json(
      { message: 'Bot detected. Access denied.', type: 'error' },
      { status: 400 }
    );
  }

  try {
    // First, check if the user exists (regardless of payment status)
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking user:', selectError);
      return NextResponse.json(
        { message: 'Error checking user status', type: 'error' },
        { status: 500 }
      );
    }

    // If user exists and is paid, return message to frontend
    if (existingUser?.paymentStatus === 'paid') {
      return NextResponse.json({
        message: 'You are already enrolled. Please log in.',
        type: 'error',
        redirectToLogin: true,
      });
    }

    // If user exists but is unpaid, update their record
    if (existingUser) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ paymentStatus: 'unpaid' })
        .eq('id', existingUser.id);

      if (updateError) {
        console.error('Error updating user:', updateError);
        return NextResponse.json(
          { message: 'Error updating user status', type: 'error' },
          { status: 500 }
        );
      }
    } else {
      // If user doesn't exist, create new record
      const { error: insertError } = await supabase.from('users').insert({
        id: uuidv4(),
        email,
        paymentStatus: 'unpaid',
      });

      if (insertError) {
        console.error('Error inserting user:', insertError);
        return NextResponse.json(
          { message: 'Error creating user', type: 'error' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: 'You were successfully enrolled. Proceeding to payment.',
      type: 'success',
      redirectToPayment: true,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred', type: 'error' },
      { status: 500 }
    );
  }
}
