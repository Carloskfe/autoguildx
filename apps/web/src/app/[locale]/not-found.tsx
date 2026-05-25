import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('not_found');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 gap-6 bg-surface">
      <p className="text-8xl font-black text-brand-500">{t('code')}</p>
      <p className="text-xl font-bold text-white">{t('title')}</p>
      <p className="text-gray-400 text-sm max-w-sm">{t('body')}</p>
      <div className="flex gap-3">
        <Link href="/" className="btn-primary text-sm px-6 py-2.5">
          {t('go_home')}
        </Link>
        <Link href="/marketplace" className="btn-secondary text-sm px-6 py-2.5">
          {t('browse_market')}
        </Link>
      </div>
    </div>
  );
}
