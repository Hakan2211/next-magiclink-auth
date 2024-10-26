'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { z } from 'zod';
import { toast } from 'sonner';
import MailIcon from '../icons/MailIcon';
import AlertCircleIcon from '../icons/AlertCircleIcon';

const emailSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

const AuthPage = ({ mode }: { mode: 'login' | 'enroll' }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [website, setWebsite] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setValidationError(null);

    try {
      emailSchema.parse({ email });
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationError(error.errors[0].message);
        setLoading(false);
        return;
      }
    }

    try {
      const endpoint = mode === 'login' ? '/api/login' : '/api/enroll';
      const res = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ email, website }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'An error occurred');
        setLoading(false);
        return;
      }

      if (data.redirectToLogin) {
        toast.error(data.message);
        setLoading(false);
        return;
      }

      if (data.redirectToPayment) {
        const checkoutResponse = await fetch('/api/create-checkout-session', {
          method: 'POST',
          body: JSON.stringify({ email }),
          headers: { 'Content-Type': 'application/json' },
        });

        const checkoutData = await checkoutResponse.json();

        if (checkoutData.url) {
          window.location.href = checkoutData.url;
        } else {
          toast.error('Failed to create checkout session');
          setLoading(false);
        }
      } else {
        toast.success(data.message);
        setEmail('');
        setLoading(false);
      }
    } catch (err) {
      toast.error('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {mode === 'login' ? 'Welcome back' : 'Get Started'}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === 'login'
              ? 'Enter your email to receive a magic link'
              : 'Enter your email to create your account'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setValidationError(null);
                  }}
                  className={`pl-10 ${
                    validationError
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : ''
                  }`}
                  required
                />
                <MailIcon className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              </div>
              {validationError && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              )}
            </div>
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
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white" />
                  {mode === 'login' ? 'Sending link...' : 'Enrolling...'}
                </div>
              ) : mode === 'login' ? (
                'Send Magic Link'
              ) : (
                'Enroll Now'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AuthPage;
