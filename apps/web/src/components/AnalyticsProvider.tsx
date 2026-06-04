'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { PostHogProvider, usePostHog } from 'posthog-js/react';
import { posthog, initAnalytics, capturePageview } from '@/lib/analytics';
import { ANALYTICS_CONSENT_KEY } from '@/components/CookieBanner';

// Tracks SPA navigation as pageviews
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!ph) return;
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    capturePageview(window.location.origin + url);
  }, [pathname, searchParams, ph]);

  return null;
}

// Listens for consent banner acceptance and initialises PostHog on the fly
function ConsentListener() {
  useEffect(() => {
    function onStorageChange(e: StorageEvent) {
      if (e.key === ANALYTICS_CONSENT_KEY && e.newValue === 'accepted') {
        initAnalytics();
      }
    }
    window.addEventListener('storage', onStorageChange);

    // Also watch for in-tab changes via a custom event the CookieBanner dispatches
    function onConsent() {
      initAnalytics();
    }
    window.addEventListener('agx:analytics-accepted', onConsent);

    return () => {
      window.removeEventListener('storage', onStorageChange);
      window.removeEventListener('agx:analytics-accepted', onConsent);
    };
  }, []);

  return null;
}

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      <ConsentListener />
      {children}
    </PostHogProvider>
  );
}
