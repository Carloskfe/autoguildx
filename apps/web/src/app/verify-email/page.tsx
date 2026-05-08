'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token');

  const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>(
    token ? 'verifying' : 'pending',
  );
  const [error, setError] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');

  useEffect(() => {
    if (!token) return;
    api
      .post('/auth/verify-email', { token })
      .then(() => {
        setStatus('success');
        setTimeout(() => router.push('/onboarding'), 2500);
      })
      .catch((err) => {
        setError(err.response?.data?.message ?? 'Verification failed. The link may have expired.');
        setStatus('error');
      });
  }, [token, router]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/resend-verification', { email: resendEmail });
      setResendStatus('Verification email sent — check your inbox.');
    } catch (err: any) {
      setResendStatus(err.response?.data?.message ?? 'Failed to resend. Try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-sm space-y-6 text-center">
        <Link href="/" className="text-brand-500 font-bold text-lg block">
          AutoGuildX
        </Link>

        {status === 'pending' && (
          <>
            <div className="text-5xl">✉️</div>
            <h1 className="text-2xl font-bold">Check your inbox</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              We sent a verification link to your email address. Click it to activate your account.
            </p>
            <p className="text-gray-500 text-xs">
              Didn&apos;t receive it? Check your spam folder or resend below.
            </p>
            <form onSubmit={handleResend} className="space-y-3 text-left">
              <input
                className="input"
                type="email"
                placeholder="Your email address"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                required
              />
              <button className="btn-secondary w-full" type="submit">
                Resend verification email
              </button>
              {resendStatus && <p className="text-sm text-center text-brand-400">{resendStatus}</p>}
            </form>
          </>
        )}

        {status === 'verifying' && (
          <>
            <div className="text-5xl animate-pulse">🔄</div>
            <h1 className="text-2xl font-bold">Verifying…</h1>
            <p className="text-gray-400 text-sm">Just a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-5xl">✅</div>
            <h1 className="text-2xl font-bold text-green-400">Email verified!</h1>
            <p className="text-gray-400 text-sm">
              Your account is now active. Redirecting to onboarding…
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl">❌</div>
            <h1 className="text-2xl font-bold text-red-400">Verification failed</h1>
            <p className="text-gray-400 text-sm">{error}</p>
            <form onSubmit={handleResend} className="space-y-3 text-left">
              <input
                className="input"
                type="email"
                placeholder="Your email address"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                required
              />
              <button className="btn-primary w-full" type="submit">
                Resend verification email
              </button>
              {resendStatus && <p className="text-sm text-center text-brand-400">{resendStatus}</p>}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
