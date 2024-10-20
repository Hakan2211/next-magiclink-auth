'use client';

import { useState } from 'react';

export default function LoginPage() {
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

    //   const res = await fetch('/api/login', {
    //     method: 'POST',
    //     body: JSON.stringify({ email, website }),
    //     headers: { 'Content-Type': 'application/json' },
    //   });

    //   const data = await res.json();
    //   setMessage(data.message);
    // };
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, website }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          text: data.message || 'An error occurred.',
          type: 'error',
        });
        setLoading(false);
        return;
      }

      setMessage({
        text: data.message || 'Check your email for the magic link.',
        type: 'success',
      });
      setLoading(false);
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
      <h1>Login</h1>
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
          {loading ? 'Processing...' : 'Send Magic Link'}
        </button>
      </form>
      {message && (
        <p style={{ color: message.type === 'error' ? 'red' : 'green' }}>
          {message.text}
        </p>
      )}
    </div>
  );
}
