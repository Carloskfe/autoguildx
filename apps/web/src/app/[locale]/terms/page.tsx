import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service – AutoGuildX',
};

export default function TermsPage() {
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
          <h1 className="text-3xl font-black mb-2">Terms of Service</h1>
          <p className="text-gray-400 text-sm">Last updated: April 24, 2026</p>
        </div>

        <p className="text-gray-300 leading-relaxed">
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of the AutoGuildX
          platform (&quot;Service&quot;), operated by AutoGuildX (&quot;we&quot;, &quot;us&quot;,
          &quot;our&quot;). By creating an account or using the Service you agree to these Terms in
          full. If you do not agree, do not use the Service.
        </p>

        <Section title="1. Eligibility">
          <p className="text-gray-300 text-sm leading-relaxed">
            You must be at least 18 years old and legally able to enter into a binding contract in
            your jurisdiction to use AutoGuildX. By using the Service you represent that you meet
            these requirements. We reserve the right to terminate accounts of users who misrepresent
            their eligibility.
          </p>
        </Section>

        <Section title="2. Account Registration">
          <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm leading-relaxed">
            <li>You are responsible for maintaining the confidentiality of your credentials.</li>
            <li>
              You must provide accurate and complete information when creating your account and keep
              it up to date.
            </li>
            <li>
              You may not share your account, impersonate another person, or create accounts for
              deceptive purposes.
            </li>
            <li>
              You are responsible for all activity that occurs under your account, whether or not
              authorized by you. Notify us immediately at{' '}
              <a href="mailto:support@autoguildx.com" className="text-brand-500 hover:underline">
                support@autoguildx.com
              </a>{' '}
              if you suspect unauthorized access.
            </li>
          </ul>
        </Section>

        <Section title="3. Subscription Tiers">
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            AutoGuildX offers three tiers: Free, Owner, and Company. Features available in each tier
            are described on our pricing page. By subscribing to a paid tier:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm leading-relaxed">
            <li>
              You authorize us to charge the applicable fee to your payment method on a recurring
              basis.
            </li>
            <li>
              Subscriptions renew automatically unless cancelled before the renewal date. You may
              cancel at any time via your account settings.
            </li>
            <li>
              We do not offer refunds for partial billing periods, except as required by applicable
              law.
            </li>
            <li>
              We reserve the right to modify pricing with 30 days&apos; advance notice. Continued
              use after a price change constitutes acceptance of the new pricing.
            </li>
          </ul>
        </Section>

        <Section title="4. Acceptable Use">
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            You agree not to use the Service to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm leading-relaxed">
            <li>Post false, misleading, or fraudulent content, listings, or event information.</li>
            <li>
              Harass, threaten, or abuse other users, or engage in hate speech or discriminatory
              conduct.
            </li>
            <li>
              Violate any applicable law, including consumer protection, intellectual property, or
              export control laws.
            </li>
            <li>
              Attempt to gain unauthorized access to any part of the Service or another user&apos;s
              account.
            </li>
            <li>
              Scrape, crawl, or systematically extract data from the Service without written
              permission.
            </li>
            <li>
              Transmit spam, malware, or any content designed to interfere with the Service or other
              users&apos; systems.
            </li>
            <li>
              Sell, resell, or commercially exploit access to the Service without our consent.
            </li>
          </ul>
          <p className="text-gray-300 text-sm leading-relaxed mt-3">
            We may remove content, suspend, or terminate accounts that violate these rules at our
            sole discretion, with or without notice.
          </p>
        </Section>

        <Section title="5. Marketplace Listings">
          <p className="text-gray-300 text-sm leading-relaxed">
            AutoGuildX is a venue for users to list automotive parts and services. We do not
            participate in, guarantee, or take responsibility for transactions between buyers and
            sellers. You are solely responsible for the accuracy of your listings, the condition of
            goods sold, and compliance with applicable sales laws. We strongly recommend verifying
            the identity and reputation of any counterparty before completing a transaction.
          </p>
        </Section>

        <Section title="6. User Content">
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            You retain ownership of content you submit to the Service (posts, images, listings,
            comments). By submitting content, you grant AutoGuildX a worldwide, non-exclusive,
            royalty-free license to store, display, reproduce, and distribute that content solely to
            operate and improve the Service.
          </p>
          <p className="text-gray-300 text-sm leading-relaxed">
            You represent and warrant that your content does not infringe any third-party
            intellectual property rights, violate any applicable law, or contain material that is
            obscene, defamatory, or harmful to minors.
          </p>
        </Section>

        <Section title="7. Intellectual Property">
          <p className="text-gray-300 text-sm leading-relaxed">
            All trademarks, logos, design elements, and proprietary software of the Service are the
            exclusive property of AutoGuildX. Nothing in these Terms grants you any right to use our
            intellectual property for any purpose beyond your personal, non-commercial use of the
            Service.
          </p>
        </Section>

        <Section title="8. Disclaimers">
          <p className="text-gray-300 text-sm leading-relaxed">
            The Service is provided &quot;as is&quot; and &quot;as available&quot; without
            warranties of any kind, express or implied, including but not limited to warranties of
            merchantability, fitness for a particular purpose, or non-infringement. We do not
            warrant that the Service will be uninterrupted, error-free, or free of harmful
            components. See our full{' '}
            <Link href="/disclaimer" className="text-brand-500 hover:underline">
              Disclaimer
            </Link>{' '}
            for details.
          </p>
        </Section>

        <Section title="9. Limitation of Liability">
          <p className="text-gray-300 text-sm leading-relaxed">
            To the maximum extent permitted by applicable law, AutoGuildX and its officers,
            directors, employees, and agents shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages, or any loss of profits or revenues, whether
            incurred directly or indirectly, arising from your use of or inability to use the
            Service, even if we have been advised of the possibility of such damages. Our total
            aggregate liability shall not exceed the greater of (a) the amount you paid us in the
            twelve months preceding the claim or (b) USD $100.
          </p>
        </Section>

        <Section title="10. Indemnification">
          <p className="text-gray-300 text-sm leading-relaxed">
            You agree to indemnify, defend, and hold harmless AutoGuildX and its affiliates from any
            claim, demand, loss, or expense (including reasonable attorneys&apos; fees) arising out
            of your use of the Service, your content, your violation of these Terms, or your
            violation of any third-party right.
          </p>
        </Section>

        <Section title="11. Termination">
          <p className="text-gray-300 text-sm leading-relaxed">
            You may delete your account at any time. We may suspend or terminate your access to the
            Service at any time for any reason, including breach of these Terms. Upon termination,
            your right to use the Service ceases immediately. Sections 6 through 13 survive
            termination.
          </p>
        </Section>

        <Section title="12. Governing Law and Disputes">
          <p className="text-gray-300 text-sm leading-relaxed">
            These Terms are governed by the laws of the State of Delaware, United States, without
            regard to conflict of law principles. Any dispute arising from these Terms or your use
            of the Service shall be resolved by binding arbitration administered under the rules of
            the American Arbitration Association, except that either party may seek injunctive
            relief in a court of competent jurisdiction for claims involving intellectual property
            or unauthorized access.
          </p>
        </Section>

        <Section title="13. Changes to These Terms">
          <p className="text-gray-300 text-sm leading-relaxed">
            We may update these Terms from time to time. We will notify you of material changes by
            updating the &quot;Last updated&quot; date and, where required by law, by email or
            in-app notice. Your continued use of the Service after changes take effect constitutes
            your acceptance of the revised Terms.
          </p>
        </Section>

        <Section title="14. Contact">
          <p className="text-gray-300 text-sm leading-relaxed">
            For questions about these Terms, contact us at{' '}
            <a href="mailto:legal@autoguildx.com" className="text-brand-500 hover:underline">
              legal@autoguildx.com
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
