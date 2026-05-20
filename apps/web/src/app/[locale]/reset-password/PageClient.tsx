'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';

export default function ResetPasswordClient() {
  const t = useTranslations('auth');
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
          <p className="text-red-400">{t('error_invalid')}</p>
          <Link href="/forgot-password" className="btn-primary block">{t('forgot_button')}</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) { setError(t('reset_mismatch')); return; }
    setStatus('loading');
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setStatus('success');
      setTimeout(() => router.push('/login'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message ?? t('error', { ns: 'common' }));
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card w-full max-w-sm text-center space-y-4">
          <div className="text-4xl">✅</div>
          <h1 className="text-2xl font-bold text-green-400">{t('reset_success')}</h1>
          <p className="text-gray-400 text-sm">{t('back_to_login')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-sm space-y-6">
        <div>
          <Link href="/" className="text-brand-500 font-bold text-lg">AutoGuildX</Link>
          <h1 className="text-2xl font-bold mt-4">{t('reset_title')}</h1>
          <p className="text-gray-400 text-sm mt-1">{t('reset_subtitle')}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="input" type="password" placeholder={t('new_password')}
            value={newPassword} minLength={8} onChange={(e) => setNewPassword(e.target.value)} required />
          <input className="input" type="password" placeholder={t('confirm_password')}
            value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button className="btn-primary w-full" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? t('reset_loading') : t('reset_button')}
          </button>
        </form>
      </div>
    </div>
  );
}
