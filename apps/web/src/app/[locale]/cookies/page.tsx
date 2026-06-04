import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export async function generateMetadata() {
  const t = await getTranslations('cookies_policy');
  return { title: `${t('title')} – AutoGuildX` };
}

export default async function CookiesPage() {
  const t = await getTranslations('cookies_policy');
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
          <p className="text-gray-300 text-sm leading-relaxed mb-4">{t('s2_intro')}</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-300 border border-surface-border rounded-lg overflow-hidden">
              <thead className="bg-surface-card text-white">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">{t('s2_table_key')}</th>
                  <th className="text-left px-4 py-3 font-semibold">{t('s2_table_purpose')}</th>
                  <th className="text-left px-4 py-3 font-semibold">{t('s2_table_duration')}</th>
                  <th className="text-left px-4 py-3 font-semibold">{t('s2_table_category')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                <tr>
                  <td className="px-4 py-3">
                    <code className="text-brand-500">auth-storage</code>
                  </td>
                  <td className="px-4 py-3">{t('s2_row_purpose')}</td>
                  <td className="px-4 py-3">{t('s2_row_duration')}</td>
                  <td className="px-4 py-3 font-medium text-green-400">{t('s2_row_category')}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">
                    <code className="text-brand-500">{t('s2_row2_key')}</code>
                  </td>
                  <td className="px-4 py-3">{t('s2_row2_purpose')}</td>
                  <td className="px-4 py-3">{t('s2_row2_duration')}</td>
                  <td className="px-4 py-3 font-medium text-blue-400">{t('s2_row2_category')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-gray-400 text-xs leading-relaxed mt-3 italic">
            {t('s2_analytics_note')}
          </p>

          <p className="text-xs font-bold tracking-[0.1em] uppercase text-gray-500 mt-5 mb-2">
            {t('s2_no_list_title')}
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm leading-relaxed">
            <li>{t('s2_no_ads')}</li>
            <li>{t('s2_no_pixels')}</li>
            <li>{t('s2_no_crosssite')}</li>
          </ul>
        </Section>

        <Section title={t('s3_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">
            {t('s3_body_pre')}{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-500 hover:underline"
            >
              {t('s3_google_link')}
            </a>{' '}
            {t('s3_and')}{' '}
            <a
              href="https://firebase.google.com/support/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-500 hover:underline"
            >
              {t('s3_firebase_link')}
            </a>
            {t('s3_body_post')}
          </p>
        </Section>

        <Section title={t('s4_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s4_body')}</p>
        </Section>

        <Section title={t('s4b_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s4b_p1')}</p>
          <p className="text-gray-300 text-sm leading-relaxed mt-3">{t('s4b_p2')}</p>
        </Section>

        <Section title={t('s5_title')}>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">{t('s5_intro')}</p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm leading-relaxed">
            <li>
              <strong className="text-white">{t('s5_chrome_label')}</strong> {t('s5_chrome')}
            </li>
            <li>
              <strong className="text-white">{t('s5_firefox_label')}</strong> {t('s5_firefox')}
            </li>
            <li>
              <strong className="text-white">{t('s5_safari_label')}</strong> {t('s5_safari')}
            </li>
          </ul>
          <p className="text-gray-300 text-sm leading-relaxed mt-3">{t('s5_outro')}</p>
        </Section>

        <Section title={t('s6_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s6_body')}</p>
        </Section>

        <Section title={t('s7_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s7_body')}</p>
        </Section>

        <Section title={t('s8_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s8_body')}</p>
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
