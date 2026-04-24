import Link from 'next/link';

export const metadata = {
  title: 'Disclaimer – AutoGuildX',
};

export default function DisclaimerPage() {
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
          <h1 className="text-3xl font-black mb-2">Disclaimer</h1>
          <p className="text-gray-400 text-sm">Last updated: April 24, 2026</p>
        </div>

        <p className="text-gray-300 leading-relaxed">
          Please read this Disclaimer carefully before using the AutoGuildX platform
          (&quot;Service&quot;), operated by AutoGuildX (&quot;we&quot;, &quot;us&quot;,
          &quot;our&quot;). By accessing or using the Service, you acknowledge and accept the
          limitations described below.
        </p>

        <Section title="1. No Professional Advice">
          <p className="text-gray-300 text-sm leading-relaxed">
            Content published on AutoGuildX — including posts, profiles, listings, event
            descriptions, and comments — is provided for general informational purposes only. Nothing
            on the Service constitutes professional mechanical, engineering, legal, financial, or
            safety advice. Always consult a qualified professional before acting on any information
            you find here.
          </p>
        </Section>

        <Section title="2. User-Generated Content">
          <p className="text-gray-300 text-sm leading-relaxed">
            AutoGuildX is a platform that hosts content created by its users. We do not verify,
            endorse, or take responsibility for the accuracy, completeness, legality, or quality of
            any user-generated content, including marketplace listings, service descriptions, event
            details, or profile information. Any reliance you place on such content is strictly at
            your own risk.
          </p>
        </Section>

        <Section title="3. Marketplace Transactions">
          <p className="text-gray-300 text-sm leading-relaxed">
            AutoGuildX provides a venue for users to advertise automotive parts and services.
            We are not a party to any transaction between buyers and sellers, do not hold funds, and
            make no warranties regarding the condition, authenticity, legality, or fitness for
            purpose of any goods or services listed. We are not responsible for disputes, losses,
            damages, or liabilities arising from transactions conducted through or facilitated by
            the Service. Conduct your own due diligence before completing any purchase or sale.
          </p>
        </Section>

        <Section title="4. Third-Party Links and Services">
          <p className="text-gray-300 text-sm leading-relaxed">
            The Service may contain links to third-party websites, services, or content. These links
            are provided for convenience only. We do not control, endorse, or assume any
            responsibility for third-party content, privacy practices, or the availability of
            external sites. Accessing third-party resources is at your own risk and subject to those
            parties&apos; own terms and policies.
          </p>
        </Section>

        <Section title="5. Service Availability">
          <p className="text-gray-300 text-sm leading-relaxed">
            We strive to maintain a reliable platform but do not guarantee that the Service will be
            available continuously, error-free, or free from interruptions. We may suspend, modify,
            or discontinue any part of the Service at any time without notice and without liability.
            We are not responsible for any loss or damage resulting from downtime, data loss, or
            service disruption.
          </p>
        </Section>

        <Section title="6. Accuracy of Information">
          <p className="text-gray-300 text-sm leading-relaxed">
            While we make reasonable efforts to keep the platform functioning correctly, we make no
            representations or warranties of any kind — express or implied — about the accuracy,
            reliability, suitability, or completeness of the Service or any information it contains.
            Information may be out of date, and we undertake no obligation to update it.
          </p>
        </Section>

        <Section title="7. Limitation of Liability">
          <p className="text-gray-300 text-sm leading-relaxed">
            To the fullest extent permitted by applicable law, AutoGuildX and its officers,
            employees, and agents shall not be liable for any direct, indirect, incidental, special,
            consequential, or punitive damages arising out of or in connection with your use of or
            inability to use the Service, any content on the Service, or any transaction entered into
            through the Service — even if we have been advised of the possibility of such damages.
          </p>
          <p className="text-gray-300 text-sm leading-relaxed mt-3">
            Some jurisdictions do not allow the exclusion or limitation of certain warranties or
            liabilities, so some of the above limitations may not apply to you. In such cases, our
            liability is limited to the maximum extent permitted by applicable law.
          </p>
        </Section>

        <Section title="8. Automotive Safety">
          <p className="text-gray-300 text-sm leading-relaxed">
            Automotive repair, modification, and parts installation carry inherent safety risks.
            AutoGuildX does not assume any responsibility for harm, injury, death, or property
            damage arising from advice, techniques, products, or services discussed or transacted
            on the platform. Always follow manufacturer guidelines, safety standards, and applicable
            regulations. If in doubt, consult a licensed professional mechanic or engineer.
          </p>
        </Section>

        <Section title="9. Changes to This Disclaimer">
          <p className="text-gray-300 text-sm leading-relaxed">
            We reserve the right to update or modify this Disclaimer at any time. Changes take effect
            immediately upon posting. The &quot;Last updated&quot; date at the top of this page will
            reflect the most recent revision. Your continued use of the Service after changes are
            posted constitutes your acceptance of the updated Disclaimer.
          </p>
        </Section>

        <Section title="10. Contact">
          <p className="text-gray-300 text-sm leading-relaxed">
            For questions about this Disclaimer, please contact us at{' '}
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
