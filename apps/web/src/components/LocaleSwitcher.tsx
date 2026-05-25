'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, type Locale } from '@/i18n';

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'EN',
  es: 'ES',
};

export default function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(next: Locale) {
    if (next === locale) return;
    // Persist chosen locale in cookie so middleware uses it on future visits
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000;SameSite=Lax`;
    // Replace the locale segment in the current path
    const segments = pathname.split('/');
    segments[1] = next;
    router.push(segments.join('/'));
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
