'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, type Locale } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'EN',
  es: 'ES',
};

export default function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  function switchLocale(next: Locale) {
    if (next === locale) return;
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000;SameSite=Lax`;
    const segments = pathname.split('/');
    segments[1] = next;
    router.push(segments.join('/'));
    if (isAuthenticated) {
      api.patch('/auth/me/language', { uiLanguage: next }).catch(() => {});
    }
  }

  return (
    <div className="flex items-center rounded-md overflow-hidden border border-surface-border text-xs font-semibold">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          className={`px-2 py-1 transition-colors ${
            l === locale
              ? 'bg-brand-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-surface-card'
          }`}
          aria-label={`Switch to ${l.toUpperCase()}`}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
