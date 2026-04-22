import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'AutoGuildX – Built for Those Who Build Cars',
  description: 'The professional network and marketplace for specialized automotive experts, builders, and collectors.',
  openGraph: {
    title: 'AutoGuildX',
    description: 'Built for those who build cars.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} bg-surface text-white antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
