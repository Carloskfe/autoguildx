import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export async function generateMetadata() {
  const t = await getTranslations('disclaimer');
  return { title: `${t('title')} – AutoGuildX` };
}

export default async function DisclaimerPage() {
  const t = await getTranslations('disclaimer');
  const tl = await getTranslations('legal');
  const tn = await getTranslations('nav');

  return (
    <main className="min-h-screen">
      <header className="border-b border-surface-border px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-brand-500 font-bold text-xl tracking-tight">
          AutoGuildX
        </Link>
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
          {tl('back_home')}
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        <div>
          <h1 className="text-3xl font-black mb-2">{t('title')}</h1>
          <p className="text-gray-400 text-sm">{t('last_updated')}</p>
        </div>

        <p className="text-gray-300 leading-relaxed">{t('intro')}</p>

        <Section title={t('s1_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s1_body')}</p>
        </Section>

        <Section title={t('s2_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s2_body')}</p>
        </Section>

        <Section title={t('s3_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s3_body')}</p>
        </Section>

        <Section title={t('s4_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s4_body')}</p>
        </Section>

        <Section title={t('s5_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s5_body')}</p>
        </Section>

        <Section title={t('s6_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s6_body')}</p>
        </Section>

        <Section title={t('s7_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s7_p1')}</p>
          <p className="text-gray-300 text-sm leading-relaxed mt-3">{t('s7_p2')}</p>
        </Section>

        <Section title={t('s8_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s8_body')}</p>
        </Section>

        <Section title={t('s9_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s9_body')}</p>
        </Section>

        <Section title={t('s10_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">
            {t('s10_body_pre')}{' '}
            <a href="mailto:legal@autoguildx.com" className="text-brand-500 hover:underline">
              legal@autoguildx.com
            </a>
            .
          </p>
        </Section>
      </div>

      <footer className="border-t border-surface-border px-6 py-6 text-center text-sm text-gray-500 space-x-4">
        <Link href="/terms" className="hover:text-gray-300 transition-colors">
          {tn('terms')}
        </Link>
        <span>·</span>
        <Link href="/privacy" className="hover:text-gray-300 transition-colors">
          {tn('privacy')}
        </Link>
        <span>·</span>
        <Link href="/cookies" className="hover:text-gray-300 transition-colors">
          {tn('cookies')}
        </Link>
        <span>·</span>
        <Link href="/disclaimer" className="hover:text-gray-300 transition-colors">
          {tn('disclaimer')}
        </Link>
        <span>·</span>
        <span>{tn('copyright')}</span>
      </footer>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}
