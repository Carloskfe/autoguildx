'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card w-full max-w-sm text-center space-y-4">
          <p className="text-red-400">Invalid reset link. Please request a new one.</p>
          <Link href="/forgot-password" className="btn-primary block">
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setStatus('loading');
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setStatus('success');
      setTimeout(() => router.push('/login'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Reset failed. The link may have expired.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card w-full max-w-sm text-center space-y-4">
          <div className="text-4xl">✅</div>
          <h1 className="text-2xl font-bold text-green-400">Password updated!</h1>
          <p className="text-gray-400 text-sm">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-sm space-y-6">
        <div>
          <Link href="/" className="text-brand-500 font-bold text-lg">
            AutoGuildX
          </Link>
          <h1 className="text-2xl font-bold mt-4">Set new password</h1>
          <p className="text-gray-400 text-sm mt-1">Choose a strong password (8+ characters).</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="input"
            type="password"
            placeholder="New password"
            value={newPassword}
            minLength={8}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            className="btn-primary w-full"
            type="submit"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
