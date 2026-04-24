import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy – AutoGuildX',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-surface-border px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-brand-500 font-bold text-xl tracking-tight">
          AutoGuildX
        </Link>
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Back to Home
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        <div>
          <h1 className="text-3xl font-black mb-2">Privacy Policy</h1>
          <p className="text-gray-400 text-sm">Last updated: April 24, 2026</p>
        </div>

        <p className="text-gray-300 leading-relaxed">
          AutoGuildX (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the AutoGuildX
          platform (the &quot;Service&quot;). This Privacy Policy explains what information we
          collect, how we use it, and the rights you have over it. By using the Service you agree to
          the practices described here.
        </p>

        <Section title="1. Information We Collect">
          <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm leading-relaxed">
            <li>
              <strong className="text-white">Account information:</strong> email address, hashed
              password, and role type you provide during registration.
            </li>
            <li>
              <strong className="text-white">Profile information:</strong> name, business name, bio,
              location, tags, and profile photo URL you add voluntarily.
            </li>
            <li>
              <strong className="text-white">User-generated content:</strong> posts, comments,
              marketplace listings, and event listings you create.
            </li>
            <li>
              <strong className="text-white">Authentication data:</strong> when you sign in with
              Google, Firebase Authentication (operated by Google) processes your Google account
              information. We receive only an authentication token.
            </li>
            <li>
              <strong className="text-white">Usage data:</strong> IP addresses, browser type, and
              interaction logs collected automatically by Firebase and our hosting infrastructure
              for security and service reliability purposes.
            </li>
            <li>
              <strong className="text-white">Media files:</strong> images you upload are stored on
              cloud storage infrastructure. File URLs are saved to your account.
            </li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm leading-relaxed">
            <li>To create and manage your account and authenticate you securely.</li>
            <li>To provide, operate, and maintain the Service.</li>
            <li>To enable you to post content and interact with other users.</li>
            <li>To process subscription tier upgrades.</li>
            <li>
              To send transactional emails (e.g., password reset) — we do not send marketing email
              without your explicit consent.
            </li>
            <li>To detect and prevent fraud, abuse, and security incidents.</li>
            <li>To comply with applicable laws and legal obligations.</li>
          </ul>
        </Section>

        <Section title="3. Local Storage and Session Data">
          <p className="text-gray-300 text-sm leading-relaxed">
            AutoGuildX stores a JSON Web Token (JWT) in your browser&apos;s{' '}
            <code className="text-brand-500">localStorage</code> to keep you signed in between
            sessions. This storage is strictly necessary for the Service to function; no tracking or
            advertising data is stored in your browser. You may clear this data at any time through
            your browser settings, which will sign you out.
          </p>
          <p className="text-gray-300 text-sm leading-relaxed mt-3">
            We do not use third-party tracking cookies or advertising networks. Firebase
            Authentication may use its own local storage entries to manage your Google sign-in
            session; these are governed by{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-500 hover:underline"
            >
              Google&apos;s Privacy Policy
            </a>
            .
          </p>
        </Section>

        <Section title="4. Data Sharing and Third Parties">
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            We do not sell your personal information. We share data only as described below:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm leading-relaxed">
            <li>
              <strong className="text-white">Firebase / Google:</strong> identity and authentication
              services.
            </li>
            <li>
              <strong className="text-white">Cloud storage provider (AWS S3 or equivalent):</strong>{' '}
              stores media files you upload.
            </li>
            <li>
              <strong className="text-white">Hosting infrastructure:</strong> servers that run the
              Service may process request logs.
            </li>
            <li>
              <strong className="text-white">Legal requirements:</strong> we may disclose
              information if required by law, subpoena, or to protect the rights of AutoGuildX or
              others.
            </li>
            <li>
              <strong className="text-white">Business transfers:</strong> in the event of a merger
              or acquisition, user data may be transferred as a business asset.
            </li>
          </ul>
        </Section>

        <Section title="5. Data Retention">
          <p className="text-gray-300 text-sm leading-relaxed">
            We retain your account data for as long as your account is active. If you delete your
            account, we will delete your personal data within 30 days, except where we are required
            to retain it by law. Server logs are retained for up to 90 days for security purposes.
            Content you have shared publicly (posts, listings, comments) may remain visible to other
            users until explicitly deleted by you.
          </p>
        </Section>

        <Section title="6. Your Rights">
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            Depending on your jurisdiction, you may have the following rights:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm leading-relaxed">
            <li>
              <strong className="text-white">Access:</strong> request a copy of the personal data we
              hold about you.
            </li>
            <li>
              <strong className="text-white">Correction:</strong> update inaccurate or incomplete
              data through your profile settings.
            </li>
            <li>
              <strong className="text-white">Deletion:</strong> request deletion of your account and
              associated personal data.
            </li>
            <li>
              <strong className="text-white">Portability:</strong> receive your data in a
              structured, machine-readable format (GDPR Article 20).
            </li>
            <li>
              <strong className="text-white">Opt-out of sale (CCPA):</strong> we do not sell
              personal data, so no opt-out action is required.
            </li>
            <li>
              <strong className="text-white">Withdraw consent:</strong> where processing is based on
              consent, you may withdraw it at any time without affecting prior processing.
            </li>
          </ul>
          <p className="text-gray-300 text-sm leading-relaxed mt-3">
            To exercise these rights, contact us at{' '}
            <a href="mailto:privacy@autoguildx.com" className="text-brand-500 hover:underline">
              privacy@autoguildx.com
            </a>
            . We will respond within 30 days.
          </p>
        </Section>

        <Section title="7. Children's Privacy">
          <p className="text-gray-300 text-sm leading-relaxed">
            The Service is not directed at children under the age of 18. We do not knowingly collect
            personal information from anyone under 18. If you become aware that a minor has provided
            us with personal data, please contact us and we will take steps to delete it.
          </p>
        </Section>

        <Section title="8. Changes to This Policy">
          <p className="text-gray-300 text-sm leading-relaxed">
            We may update this Privacy Policy from time to time. When we do, we will update the
            &quot;Last updated&quot; date at the top of this page. Material changes will be
            communicated via a notice on the Service or by email. Continued use of the Service after
            changes constitutes your acceptance of the updated policy.
          </p>
        </Section>

        <Section title="9. Contact Us">
          <p className="text-gray-300 text-sm leading-relaxed">
            If you have questions about this Privacy Policy or wish to exercise your privacy rights,
            please contact:
          </p>
          <address className="not-italic text-gray-300 text-sm mt-3 space-y-1">
            <p className="font-semibold text-white">AutoGuildX</p>
            <p>
              Email:{' '}
              <a href="mailto:privacy@autoguildx.com" className="text-brand-500 hover:underline">
                privacy@autoguildx.com
              </a>
            </p>
          </address>
        </Section>
      </div>

      <footer className="border-t border-surface-border px-6 py-6 text-center text-sm text-gray-500 space-x-4">
        <Link href="/terms" className="hover:text-gray-300 transition-colors">
          Terms of Service
        </Link>
        <span>·</span>
        <Link href="/privacy" className="hover:text-gray-300 transition-colors">
          Privacy Policy
        </Link>
        <span>·</span>
        <Link href="/cookies" className="hover:text-gray-300 transition-colors">
          Cookie Policy
        </Link>
        <span>·</span>
        <Link href="/disclaimer" className="hover:text-gray-300 transition-colors">
          Disclaimer
        </Link>
        <span>·</span>
        <span>© 2026 AutoGuildX</span>
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
