'use client';

import posthog from 'posthog-js';
import { ANALYTICS_CONSENT_KEY } from '@/components/CookieBanner';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';

let initialised = false;

export function initAnalytics() {
  if (typeof window === 'undefined') return;
  if (!POSTHOG_KEY) return;
  if (initialised) return;
  if (localStorage.getItem(ANALYTICS_CONSENT_KEY) !== 'accepted') return;
  if (navigator.doNotTrack === '1') return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false, // handled manually via PageViewTracker
    capture_pageleave: true,
    autocapture: true,
    person_profiles: 'identified_only',
    // Never capture PII in DOM elements
    mask_all_text: false,
    sanitize_properties(properties) {
      // Strip any accidental email addresses from element text
      if (properties.$elements) {
        properties.$elements = properties.$elements.map((el: Record<string, unknown>) => {
          if (typeof el.text === 'string' && el.text.includes('@')) {
            el.text = '[redacted]';
          }
          return el;
        });
      }
      return properties;
    },
  });

  initialised = true;
}

export function identifyUser(userId: string, props: Record<string, unknown>) {
  if (!initialised) return;
  posthog.identify(userId, props);
}

export function resetUser() {
  if (!initialised) return;
  posthog.reset();
}

export function capture(event: string, properties?: Record<string, unknown>) {
  if (!initialised) return;
  posthog.capture(event, properties);
}

export function capturePageview(url: string) {
  if (!initialised) return;
  posthog.capture('$pageview', { $current_url: url });
}

export { posthog };
