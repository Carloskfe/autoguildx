'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('error_page');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 gap-6 bg-surface">
      <p className="text-5xl font-black text-brand-500">{t('heading')}</p>
      <p className="text-xl font-bold text-white">{t('title')}</p>
      <p className="text-gray-400 text-sm max-w-sm">{t('body')}</p>
      <div className="flex gap-3">
        <button onClick={reset} className="btn-primary text-sm px-6 py-2.5">
          {t('try_again')}
        </button>
        <Link href="/feed" className="btn-secondary text-sm px-6 py-2.5">
          {t('go_feed')}
        </Link>
      </div>
    </div>
  );
}
