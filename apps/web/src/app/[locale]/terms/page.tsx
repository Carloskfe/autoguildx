import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export async function generateMetadata() {
  const t = await getTranslations('terms');
  return { title: `${t('title')} – AutoGuildX` };
}

export default async function TermsPage() {
  const t = await getTranslations('terms');
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
          <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm leading-relaxed">
            <li>{t('s2_i1')}</li>
            <li>{t('s2_i2')}</li>
            <li>{t('s2_i3')}</li>
            <li>
              {t('s2_i4_pre')}{' '}
              <a href="mailto:support@autoguildx.com" className="text-brand-500 hover:underline">
                support@autoguildx.com
              </a>{' '}
              {t('s2_i4_post')}
            </li>
          </ul>
        </Section>

        <Section title={t('s3_title')}>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">{t('s3_intro')}</p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm leading-relaxed">
            <li>{t('s3_i1')}</li>
            <li>{t('s3_i2')}</li>
            <li>{t('s3_i3')}</li>
            <li>{t('s3_i4')}</li>
          </ul>
        </Section>

        <Section title={t('s4_title')}>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">{t('s4_intro')}</p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm leading-relaxed">
            <li>{t('s4_i1')}</li>
            <li>{t('s4_i2')}</li>
            <li>{t('s4_i3')}</li>
            <li>{t('s4_i4')}</li>
            <li>{t('s4_i5')}</li>
            <li>{t('s4_i6')}</li>
            <li>{t('s4_i7')}</li>
          </ul>
          <p className="text-gray-300 text-sm leading-relaxed mt-3">{t('s4_outro')}</p>
        </Section>

        <Section title={t('s5_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s5_body')}</p>
        </Section>

        <Section title={t('s6_title')}>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">{t('s6_p1')}</p>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s6_p2')}</p>
        </Section>

        <Section title={t('s7_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s7_body')}</p>
        </Section>

        <Section title={t('s8_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">
            {t('s8_body_pre')}{' '}
            <Link href="/disclaimer" className="text-brand-500 hover:underline">
              {t('s8_disclaimer_link')}
            </Link>{' '}
            {t('s8_body_post')}
          </p>
        </Section>

        <Section title={t('s9_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s9_body')}</p>
        </Section>

        <Section title={t('s10_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s10_body')}</p>
        </Section>

        <Section title={t('s11_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s11_body')}</p>
        </Section>

        <Section title={t('s12_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s12_body')}</p>
        </Section>

        <Section title={t('s13_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s13_body')}</p>
        </Section>

        <Section title={t('s14_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">
            {t('s14_body_pre')}{' '}
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
