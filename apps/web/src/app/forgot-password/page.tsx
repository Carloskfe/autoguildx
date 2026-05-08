'use client';
import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('loading');
    try {
      await api.post('/auth/forgot-password', { email });
      setStatus('sent');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-sm space-y-6">
        <div>
          <Link href="/" className="text-brand-500 font-bold text-lg">
            AutoGuildX
          </Link>
          <h1 className="text-2xl font-bold mt-4">Forgot password?</h1>
          <p className="text-gray-400 text-sm mt-1">
            Enter your email and we&apos;ll send a reset link.
          </p>
        </div>

        {status === 'sent' ? (
          <div className="space-y-4 text-center">
            <div className="text-4xl">✉️</div>
            <p className="text-sm text-gray-300">
              Password reset email sent to <span className="text-white font-medium">{email}</span>.
              Check your inbox and follow the link to set a new password.
            </p>
            <Link href="/login" className="btn-secondary w-full block text-center">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="input"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              required
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button className="btn-primary w-full" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Sending…' : 'Send reset link'}
            </button>
            <p className="text-center text-sm text-gray-400">
              <Link href="/login" className="text-brand-500 hover:underline">
                Back to login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
