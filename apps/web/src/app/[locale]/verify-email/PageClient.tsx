'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';

export default function VerifyEmailClient() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
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
    api.post('/auth/verify-email', { token })
      .then(() => { setStatus('success'); setTimeout(() => router.push('/onboarding'), 2500); })
      .catch((err) => { setError(err.response?.data?.message ?? tc('error')); setStatus('error'); });
  }, [token, router, tc]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/resend-verification', { email: resendEmail });
      setResendStatus(t('forgot_sent'));
    } catch (err: any) {
      setResendStatus(err.response?.data?.message ?? tc('error'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-sm space-y-6 text-center">
        <Link href="/" className="text-brand-500 font-bold text-lg block">AutoGuildX</Link>

        {status === 'pending' && (
          <>
            <div className="text-5xl">✉️</div>
            <h1 className="text-2xl font-bold">{t('verify_email_title')}</h1>
            <p className="text-gray-400 text-sm leading-relaxed">{t('verify_email_body')}</p>
            <p className="text-gray-500 text-xs">{t('verify_email_resend')}</p>
            <form onSubmit={handleResend} className="space-y-3 text-left">
              <input className="input" type="email" placeholder={t('email')} value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)} required />
              <button className="btn-secondary w-full" type="submit">{t('resend')}</button>
              {resendStatus && <p className="text-sm text-center text-brand-400">{resendStatus}</p>}
            </form>
          </>
        )}

        {status === 'verifying' && (
          <>
            <div className="text-5xl animate-pulse">🔄</div>
            <h1 className="text-2xl font-bold">{tc('loading')}</h1>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-5xl">✅</div>
            <h1 className="text-2xl font-bold text-green-400">{t('verify_email_verified')}</h1>
            <p className="text-gray-400 text-sm">{t('verify_email_body')}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl">❌</div>
            <h1 className="text-2xl font-bold text-red-400">{tc('error')}</h1>
            <p className="text-gray-400 text-sm">{error}</p>
            <form onSubmit={handleResend} className="space-y-3 text-left">
              <input className="input" type="email" placeholder={t('email')} value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)} required />
              <button className="btn-primary w-full" type="submit">{t('resend')}</button>
              {resendStatus && <p className="text-sm text-center text-brand-400">{resendStatus}</p>}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
