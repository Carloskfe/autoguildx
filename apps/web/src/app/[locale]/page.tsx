import Link from 'next/link';
import { Car, Wrench, CalendarDays, GraduationCap, Users, Package, BookOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function LandingPage() {
  const t = useTranslations('landing');
  const tn = useTranslations('nav');

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-surface-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-brand-500 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-black text-xl tracking-tight text-white">
            AutoGuildX
          </span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="btn-secondary text-sm">
            {t('log_in')}
          </Link>
          <Link href="/signup" className="btn-primary text-sm">
            {t('join_free')}
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 md:py-28 gap-6 relative overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-brand-500/5 blur-3xl" />
        </div>

        <p className="text-brand-500 text-xs font-bold tracking-[0.2em] uppercase">
          {t('hero_eyebrow')}
        </p>

        <h1 className="display text-6xl md:text-8xl max-w-4xl leading-[0.92] uppercase">
          {t('hero_line1')}
          <br />
          <span className="text-brand-500">{t('hero_line2')}</span>
        </h1>

        <p className="text-gray-400 text-base md:text-lg max-w-lg leading-relaxed">
          {t('hero_subtitle')}
        </p>

        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <Link href="/signup" className="btn-primary text-base px-8 py-3">
            {t('cta_start')}
          </Link>
          <Link href="/discover" className="btn-secondary text-base px-8 py-3">
            {t('cta_explore')}
          </Link>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center justify-center gap-8 pt-6 border-t border-surface-border w-full max-w-lg mt-2">
          {[
            { Icon: Users, key: 'stat_community' },
            { Icon: Package, key: 'stat_listings' },
            { Icon: BookOpen, key: 'stat_courses' },
          ].map(({ Icon, key }) => (
            <div key={key} className="flex items-center gap-2 text-gray-500 text-sm">
              <Icon className="w-4 h-4 text-brand-500/70" />
              <span>{t(key as any)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Value props */}
      <section className="border-t border-surface-border px-6 py-16 bg-surface-card/30">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card card-interactive group">
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center mb-4 group-hover:bg-brand-500/20 transition-colors">
                <Car className="w-5 h-5 text-brand-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t('card_presence_title')}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{t('card_presence_body')}</p>
            </div>
            <div className="card card-interactive group">
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center mb-4 group-hover:bg-brand-500/20 transition-colors">
                <Wrench className="w-5 h-5 text-brand-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t('card_parts_title')}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{t('card_parts_body')}</p>
            </div>
            <div className="card card-interactive group">
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center mb-4 group-hover:bg-brand-500/20 transition-colors">
                <CalendarDays className="w-5 h-5 text-brand-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t('card_events_title')}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{t('card_events_body')}</p>
            </div>
          </div>

          {/* Courses banner */}
          <div className="card border-brand-500/30 bg-brand-500/5 hover:bg-brand-500/8 hover:border-brand-500/50 flex flex-col md:flex-row md:items-center gap-6 transition-all duration-200">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6 text-brand-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">{t('courses_title')}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{t('courses_body')}</p>
              </div>
            </div>
            <Link href="/courses" className="btn-primary text-sm px-6 py-2.5 shrink-0 text-center">
              {t('courses_cta')}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
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
