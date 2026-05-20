'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
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
      setError(err.response?.data?.message ?? t('error', { ns: 'common' }));
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
          <h1 className="text-2xl font-bold mt-4">{t('forgot_title')}</h1>
          <p className="text-gray-400 text-sm mt-1">{t('forgot_body')}</p>
        </div>

        {status === 'sent' ? (
          <div className="space-y-4 text-center">
            <div className="text-4xl">✉️</div>
            <p className="text-sm text-gray-300">{t('forgot_sent')}</p>
            <Link href="/login" className="btn-secondary w-full block text-center">
              {t('back_to_login')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="input"
              type="email"
              placeholder={t('email')}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              required
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button className="btn-primary w-full" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? t('forgot_sending') : t('forgot_button')}
            </button>
            <p className="text-center text-sm text-gray-400">
              <Link href="/login" className="text-brand-500 hover:underline">
                {t('back_to_login')}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
