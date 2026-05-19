import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-inter' });

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${dmSans.variable} bg-surface text-white antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
