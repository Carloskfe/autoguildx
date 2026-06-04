import type { Metadata } from 'next';
import { Barlow, Barlow_Condensed } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import Providers from '../providers';
import CookieBanner from '@/components/CookieBanner';

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
});

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-heading',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://autoguildx.com'),
  title: {
    default: 'AutoGuildX – Where Car & Moto People Belong',
    template: '%s | AutoGuildX',
  },
  description:
    'The community and marketplace for everyone passionate about cars, motorcycles, and all things automotive.',
  openGraph: {
    title: 'AutoGuildX',
    description: 'Where car & moto people belong.',
    type: 'website',
    siteName: 'AutoGuildX',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutoGuildX',
    description: 'Where car & moto people belong.',
  },
};

// All pages under this layout are dynamically rendered (auth-dependent)
export const dynamic = 'force-dynamic';

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as (typeof locales)[number])) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <body
        className={`${barlow.variable} ${barlowCondensed.variable} bg-surface text-white antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
          <CookieBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
