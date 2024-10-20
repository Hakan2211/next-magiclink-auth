// app/payment-success/page.tsx
import { redirect } from 'next/navigation';
import Stripe from 'stripe';

interface PaymentSuccessPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function PaymentSuccessPage({
  searchParams,
}: PaymentSuccessPageProps) {
  // Access the session_id from the searchParams prop
  const sessionId = searchParams.session_id;

  if (!sessionId || typeof sessionId !== 'string') {
    // If no session_id is found or it's not a string, redirect to home or show an error
    redirect('/');
    return;
  }

  // Initialize Stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-09-30.acacia',
  });

  // Retrieve the checkout session
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (!session) {
    // Handle error if session not found
    redirect('/');
    return;
  }

  // Optionally, verify payment status
  if (session.payment_status !== 'paid') {
    // Handle unpaid session
    redirect('/');
    return;
  }

  return (
    <div>
      <h1>Thank You for Your Purchase!</h1>
      <p>Your payment was successful.</p>
      <p>
        We've sent you a magic link to access your course. Please check your
        email.
      </p>
      <a href="/">Go to Homepage</a>
    </div>
  );
}
