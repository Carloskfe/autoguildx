import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export async function generateMetadata() {
  const t = await getTranslations('privacy');
  return { title: `${t('title')} – AutoGuildX` };
}

export default async function PrivacyPage() {
  const t = await getTranslations('privacy');
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
          <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm leading-relaxed">
            <li>
              <strong className="text-white">{t('s1_account_label')}</strong> {t('s1_account')}
            </li>
            <li>
              <strong className="text-white">{t('s1_profile_label')}</strong> {t('s1_profile')}
            </li>
            <li>
              <strong className="text-white">{t('s1_ugc_label')}</strong> {t('s1_ugc')}
            </li>
            <li>
              <strong className="text-white">{t('s1_auth_label')}</strong> {t('s1_auth')}
            </li>
            <li>
              <strong className="text-white">{t('s1_usage_label')}</strong> {t('s1_usage')}
            </li>
            <li>
              <strong className="text-white">{t('s1_media_label')}</strong> {t('s1_media')}
            </li>
          </ul>
        </Section>

        <Section title={t('s2_title')}>
          <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm leading-relaxed">
            <li>{t('s2_i1')}</li>
            <li>{t('s2_i2')}</li>
            <li>{t('s2_i3')}</li>
            <li>{t('s2_i4')}</li>
            <li>{t('s2_i5')}</li>
            <li>{t('s2_i6')}</li>
            <li>{t('s2_i7')}</li>
          </ul>
        </Section>

        <Section title={t('s3_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s3_p1')}</p>
          <p className="text-gray-300 text-sm leading-relaxed mt-3">
            {t('s3_p2_pre')}{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-500 hover:underline"
            >
              {t('s3_google_link')}
            </a>
            {t('s3_p2_post')}
          </p>
        </Section>

        <Section title={t('s4_title')}>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">{t('s4_intro')}</p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm leading-relaxed">
            <li>
              <strong className="text-white">{t('s4_firebase_label')}</strong> {t('s4_firebase')}
            </li>
            <li>
              <strong className="text-white">{t('s4_storage_label')}</strong> {t('s4_storage')}
            </li>
            <li>
              <strong className="text-white">{t('s4_hosting_label')}</strong> {t('s4_hosting')}
            </li>
            <li>
              <strong className="text-white">{t('s4_legal_label')}</strong> {t('s4_legal')}
            </li>
            <li>
              <strong className="text-white">{t('s4_transfer_label')}</strong> {t('s4_transfer')}
            </li>
          </ul>
        </Section>

        <Section title={t('s5_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s5_body')}</p>
        </Section>

        <Section title={t('s6_title')}>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">{t('s6_intro')}</p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm leading-relaxed">
            <li>
              <strong className="text-white">{t('s6_access_label')}</strong> {t('s6_access')}
            </li>
            <li>
              <strong className="text-white">{t('s6_correction_label')}</strong>{' '}
              {t('s6_correction')}
            </li>
            <li>
              <strong className="text-white">{t('s6_deletion_label')}</strong> {t('s6_deletion')}
            </li>
            <li>
              <strong className="text-white">{t('s6_portability_label')}</strong>{' '}
              {t('s6_portability')}
            </li>
            <li>
              <strong className="text-white">{t('s6_optout_label')}</strong> {t('s6_optout')}
            </li>
            <li>
              <strong className="text-white">{t('s6_withdraw_label')}</strong> {t('s6_withdraw')}
            </li>
          </ul>
          <p className="text-gray-300 text-sm leading-relaxed mt-3">{t('s6_contact')}</p>
        </Section>

        <Section title={t('s7_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s7_body')}</p>
        </Section>

        <Section title={t('s8_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s8_body')}</p>
        </Section>

        <Section title={t('s9_title')}>
          <p className="text-gray-300 text-sm leading-relaxed">{t('s9_intro')}</p>
          <address className="not-italic text-gray-300 text-sm mt-3 space-y-1">
            <p className="font-semibold text-white">{t('s9_company')}</p>
            <p>
              {t('s9_email_label')}{' '}
              <a href="mailto:privacy@autoguildx.com" className="text-brand-500 hover:underline">
                privacy@autoguildx.com
              </a>
            </p>
          </address>
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
