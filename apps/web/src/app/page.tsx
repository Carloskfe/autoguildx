import Link from 'next/link';
import { Car, Wrench, GraduationCap } from 'lucide-react';

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
        <div className="max-w-5xl mx-auto space-y-8">

          {/* 2-column cards */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="card">
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center mb-4">
                <Car className="w-5 h-5 text-brand-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Build Your Presence &amp; Connect</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Showcase your work and builds in a professional profile. Follow other builders,
                attend events, and grow your reputation in a community that knows your craft.
              </p>
            </div>
            <div className="card">
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center mb-4">
                <Wrench className="w-5 h-5 text-brand-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Find Trusted Parts</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Browse a curated marketplace of rare parts and specialized services from verified
                experts.
              </p>
            </div>
          </div>

          {/* Courses banner */}
          <div className="card border-brand-500/30 bg-brand-500/5 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6 text-brand-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Develop or Reshape Your Skills</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Learn from certified experts or teach what you know. Complete courses and earn
                  certificates that live on your profile.
                </p>
              </div>
            </div>
            <Link
              href="/courses"
              className="btn-primary text-sm px-6 py-2.5 shrink-0 text-center"
            >
              Browse Courses
            </Link>
          </div>

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
