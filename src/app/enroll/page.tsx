'use client';

import { useState } from 'react';

export default function EnrollPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [website, setWebsite] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const enrollResponse = await fetch('/api/enroll', {
        method: 'POST',
        body: JSON.stringify({ email, website }),
        headers: { 'Content-Type': 'application/json' },
      });

      const enrollData = await enrollResponse.json();

      if (!enrollResponse.ok) {
        setMessage({
          text: enrollData.message || 'An error occurred.',
          type: 'error',
        });
        setLoading(false);
        return;
      }

      if (enrollData.redirectToLogin) {
        setMessage({
          text:
            enrollData.message || 'You are already enrolled. Please log in.',
          type: 'error',
        });
        setLoading(false);
        return;
      }

      if (enrollData.redirectToPayment) {
        const checkoutResponse = await fetch('/api/create-checkout-session', {
          method: 'POST',
          body: JSON.stringify({ email }),
          headers: { 'Content-Type': 'application/json' },
        });

        const checkoutData = await checkoutResponse.json();

        if (checkoutData.url) {
          window.location.href = checkoutData.url;
        } else {
          setMessage({
            text: 'Failed to create checkout session.',
            type: 'error',
          });
          setLoading(false);
        }
      } else {
        setMessage({
          text: enrollData.message || 'Enrollment completed.',
          type: 'success',
        });
        setLoading(false);
      }
    } catch (err) {
      setMessage({
        text: 'An error occurred. Please try again.',
        type: 'error',
      });
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
        {/* Honeypot field */}
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
      {/* Display message */}
      {message && (
        <p style={{ color: message.type === 'error' ? 'red' : 'green' }}>
          {message.text}
        </p>
      )}
    </div>
  );
}
