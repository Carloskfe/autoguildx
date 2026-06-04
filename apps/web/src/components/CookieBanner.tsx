'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export const ANALYTICS_CONSENT_KEY = 'agx-analytics-consent';

export type ConsentValue = 'accepted' | 'declined';

export function getAnalyticsConsent(): ConsentValue | null {
  if (typeof window === 'undefined') return null;
  const val = localStorage.getItem(ANALYTICS_CONSENT_KEY);
  if (val === 'accepted' || val === 'declined') return val;
  return null;
}

export function setAnalyticsConsent(value: ConsentValue) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
  // Expose on window so PostHog initialization can check this synchronously
  (window as Window & { agxAnalyticsConsent?: ConsentValue }).agxAnalyticsConsent = value;
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const t = useTranslations('cookies_banner');

  useEffect(() => {
    // Don't show if user already chose, or if DNT is on
    if (getAnalyticsConsent() !== null) return;
    if (navigator.doNotTrack === '1') {
      setAnalyticsConsent('declined');
      return;
    }
    setVisible(true);
  }, []);

  function accept() {
    setAnalyticsConsent('accepted');
    setVisible(false);
    window.dispatchEvent(new Event('agx:analytics-accepted'));
  }

  function decline() {
    setAnalyticsConsent('declined');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={t('aria_label')}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-surface-border bg-surface/95 backdrop-blur px-4 py-4 shadow-lg shadow-black/40"
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-gray-300 leading-relaxed flex-1">
          {t('message')}{' '}
          <Link href="/privacy" className="text-brand-500 hover:underline whitespace-nowrap">
            {t('privacy_link')}
          </Link>
          {' · '}
          <Link href="/cookies" className="text-brand-500 hover:underline whitespace-nowrap">
            {t('cookies_link')}
          </Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={decline}
            className="btn-secondary text-sm px-4 py-2"
          >
            {t('decline')}
          </button>
          <button
            onClick={accept}
            className="btn-primary text-sm px-4 py-2"
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
