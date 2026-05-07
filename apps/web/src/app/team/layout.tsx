import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Team',
  description:
    'Meet the people behind AutoGuildX — building the professional network for automotive experts, mechanics, and collectors.',
  openGraph: {
    title: 'AutoGuildX Team',
    description:
      'Meet the people behind AutoGuildX — building the professional network for automotive experts.',
  },
};

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
