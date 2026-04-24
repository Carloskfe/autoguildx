import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-surface-border px-6 py-4 flex items-center justify-between">
        <span className="text-brand-500 font-bold text-xl tracking-tight">AutoGuildX</span>
        <nav className="flex gap-4">
          <Link href="/login" className="btn-secondary text-sm">
            Log In
          </Link>
          <Link href="/signup" className="btn-primary text-sm">
            Join Free
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 gap-8">
        <h1 className="text-5xl md:text-7xl font-black tracking-tight max-w-4xl leading-none">
          Built for Those
          <br />
          <span className="text-brand-500">Who Build Cars.</span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-xl">
          The professional network and marketplace for specialized mechanics, manufacturers, and
          collectors in the United States.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/signup" className="btn-primary text-base px-8 py-3">
            Get Started Free
          </Link>
          <Link href="/discover" className="btn-secondary text-base px-8 py-3">
            Explore Platform
          </Link>
        </div>
      </section>

      {/* Value props */}
      <section className="border-t border-surface-border px-6 py-16">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            {
              title: 'Build Your Presence',
              desc: 'Showcase your work, expertise, and builds in a professional profile tailored to the automotive niche.',
            },
            {
              title: 'Find Trusted Parts',
              desc: 'Browse a curated marketplace of rare parts and specialized services from verified experts.',
            },
            {
              title: 'Connect With Peers',
              desc: 'Follow builders, attend events, and grow your reputation in the community that knows your craft.',
            },
          ].map((item) => (
            <div key={item.title} className="card">
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
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
        <span>© 2026 AutoGuildX. All rights reserved.</span>
      </footer>
    </main>
  );
}
