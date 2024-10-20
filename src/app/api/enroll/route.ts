// app/api/enroll/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { email, website } = await req.json();

  // Honeypot check
  if (website) {
    console.warn('Honeypot triggered on enroll by email:', email);
    // Optionally log this attempt
    return NextResponse.json(
      { message: 'Bot detected. Access denied.', type: 'error' },
      { status: 400 }
    );
  }

  try {
    // Check if user already exists with 'paid' status
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('paymentStatus', 'paid')
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking user:', selectError);
      return NextResponse.json(
        { message: 'Error checking user status', type: 'error' },
        { status: 500 }
      );
    }

    // If user already paid, return message to the frontend
    if (existingUser) {
      return NextResponse.json({
        message: 'You are already enrolled. Please log in.',
        type: 'error',
        redirectToLogin: true,
      });
    }

    // Upsert the user with 'unpaid' status

    const id = uuidv4();
    const { error: upsertError } = await supabase
      .from('users')
      .upsert({ id, email, paymentStatus: 'unpaid' });

    if (upsertError) {
      console.error('Error upserting user:', upsertError);
      return NextResponse.json(
        { message: 'Error enrolling user', type: 'error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'You were successfully enrolled. Proceeding to payment.',
      type: 'success',
      redirectToPayment: true,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ message: 'Unexpected error' }, { status: 500 });
  }
}
