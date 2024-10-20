// app/api/enroll/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { email } = await req.json();

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
        { message: 'Error checking user status' },
        { status: 500 }
      );
    }

    // If user already paid, return message to the frontend
    if (existingUser) {
      return NextResponse.json({
        message: 'You are already enrolled.',
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
        { message: 'Error enrolling user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'User enrolled successfully',
      redirectToPayment: true,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ message: 'Unexpected error' }, { status: 500 });
  }
}
