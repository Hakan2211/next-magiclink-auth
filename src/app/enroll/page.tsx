'use client';

import { useState } from 'react';

export default function EnrollPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [website, setWebsite] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // First, send email to enroll route
      const enrollResponse = await fetch('/api/enroll', {
        method: 'POST',
        body: JSON.stringify({ email, website }),
        headers: { 'Content-Type': 'application/json' },
      });

      const enrollData = await enrollResponse.json();

      // Check if user is already enrolled or has errors
      if (enrollData.redirectToLogin) {
        setError('You are already enrolled. Please log in.');
        setLoading(false);
        return;
      }

      // Then, create a checkout session
      const checkoutResponse = await fetch('/api/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json' },
      });

      const checkoutData = await checkoutResponse.json();

      // Redirect to Stripe checkout
      if (checkoutData.url) {
        window.location.href = checkoutData.url;
      } else {
        setError('Failed to create checkout session.');
        setLoading(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Enroll</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
        />
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          style={{ display: 'none' }}
          tabIndex={-1}
          autoComplete="off"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Enroll'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
