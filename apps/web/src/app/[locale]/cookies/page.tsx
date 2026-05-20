import Link from 'next/link';

export const metadata = {
  title: 'Cookie Policy – AutoGuildX',
};

export default function CookiesPage() {
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
          <h1 className="text-3xl font-black mb-2">Cookie Policy</h1>
          <p className="text-gray-400 text-sm">Last updated: April 24, 2026</p>
        </div>

        <p className="text-gray-300 leading-relaxed">
          This Cookie Policy explains how AutoGuildX (&quot;we&quot;, &quot;us&quot;,
          &quot;our&quot;) uses browser storage technologies when you use our platform
          (&quot;Service&quot;). We are committed to being transparent about what we store, why we
          store it, and how you can control it.
        </p>

        <Section title="1. What Are Cookies?">
          <p className="text-gray-300 text-sm leading-relaxed">
            Cookies are small text files that a website stores on your device when you visit it.
            They are widely used to make websites work efficiently, remember preferences, and
            provide information to site operators. Similar technologies — such as{' '}
            <code className="text-brand-500">localStorage</code> and{' '}
            <code className="text-brand-500">sessionStorage</code> — serve comparable functions but
            store data differently in your browser.
          </p>
        </Section>

        <Section title="2. What AutoGuildX Stores (and What We Don't)">
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            AutoGuildX does <strong className="text-white">not</strong> use traditional HTTP cookies
            for tracking, advertising, or analytics. Instead, we use browser{' '}
            <code className="text-brand-500">localStorage</code> for a single, strictly necessary
            purpose:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-300 border border-surface-border rounded-lg overflow-hidden">
              <thead className="bg-surface-card text-white">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Key</th>
                  <th className="text-left px-4 py-3 font-semibold">Purpose</th>
                  <th className="text-left px-4 py-3 font-semibold">Duration</th>
                  <th className="text-left px-4 py-3 font-semibold">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                <tr>
                  <td className="px-4 py-3">
                    <code className="text-brand-500">auth-storage</code>
                  </td>
                  <td className="px-4 py-3">
                    Stores your JWT authentication token and user ID so you remain signed in between
                    page loads and sessions.
                  </td>
                  <td className="px-4 py-3">Until you sign out or clear browser data</td>
                  <td className="px-4 py-3 font-medium text-green-400">Strictly Necessary</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-gray-300 text-sm leading-relaxed mt-4">
            We do <strong className="text-white">not</strong> use:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm leading-relaxed mt-2">
            <li>Advertising or retargeting cookies</li>
            <li>Third-party analytics cookies (e.g., Google Analytics)</li>
            <li>Social media tracking pixels</li>
            <li>Persistent session cookies from AutoGuildX itself</li>
          </ul>
        </Section>

        <Section title="3. Third-Party Storage — Firebase Authentication">
          <p className="text-gray-300 text-sm leading-relaxed">
            When you sign in with Google, we use Firebase Authentication (a Google service).
            Firebase stores its own entries in your browser&apos;s{' '}
            <code className="text-brand-500">localStorage</code> and{' '}
            <code className="text-brand-500">IndexedDB</code> to manage your Google sign-in session.
            These entries are governed exclusively by{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-500 hover:underline"
            >
              Google&apos;s Privacy Policy
            </a>{' '}
            and{' '}
            <a
              href="https://firebase.google.com/support/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-500 hover:underline"
            >
              Firebase&apos;s Privacy and Security documentation
            </a>
            . AutoGuildX has no control over and does not access these entries directly.
          </p>
        </Section>

        <Section title="4. Strictly Necessary Storage">
          <p className="text-gray-300 text-sm leading-relaxed">
            The <code className="text-brand-500">auth-storage</code> key in{' '}
            <code className="text-brand-500">localStorage</code> is strictly necessary for the
            Service to function. Without it, you would be unable to remain signed in. Because this
            storage is essential, we do not require your prior consent to set it — however, you
            retain the right to remove it at any time by clearing your browser storage or signing
            out, which will end your authenticated session.
          </p>
        </Section>

        <Section title="5. How to Manage or Delete Browser Storage">
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            You can view, modify, or delete all browser storage at any time through your
            browser&apos;s developer tools or settings:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm leading-relaxed">
            <li>
              <strong className="text-white">Chrome / Edge:</strong> DevTools (F12) → Application →
              Storage → Local Storage, or Settings → Privacy and Security → Clear browsing data.
            </li>
            <li>
              <strong className="text-white">Firefox:</strong> DevTools (F12) → Storage → Local
              Storage, or Settings → Privacy &amp; Security → Clear Data.
            </li>
            <li>
              <strong className="text-white">Safari:</strong> Develop → Show Web Inspector →
              Storage, or Settings → Privacy → Manage Website Data.
            </li>
          </ul>
          <p className="text-gray-300 text-sm leading-relaxed mt-3">
            Clearing AutoGuildX&apos;s storage will sign you out of the Service. Clearing
            Firebase&apos;s storage entries will also sign you out of your Google session on
            AutoGuildX.
          </p>
        </Section>

        <Section title="6. Do Not Track">
          <p className="text-gray-300 text-sm leading-relaxed">
            Some browsers offer a &quot;Do Not Track&quot; (DNT) signal. Because AutoGuildX does not
            engage in cross-site tracking, the presence or absence of a DNT signal does not change
            the data we store.
          </p>
        </Section>

        <Section title="7. Changes to This Policy">
          <p className="text-gray-300 text-sm leading-relaxed">
            We may update this Cookie Policy to reflect changes in our practices or for other
            operational, legal, or regulatory reasons. We will update the &quot;Last updated&quot;
            date at the top of this page when we do so. Please review it periodically.
          </p>
        </Section>

        <Section title="8. Contact Us">
          <p className="text-gray-300 text-sm leading-relaxed">
            If you have questions about our use of browser storage, please contact us at{' '}
            <a href="mailto:privacy@autoguildx.com" className="text-brand-500 hover:underline">
              privacy@autoguildx.com
            </a>
            .
          </p>
        </Section>
      </div>

      <LegalFooter />
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

function LegalFooter() {
  return (
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
  );
}
