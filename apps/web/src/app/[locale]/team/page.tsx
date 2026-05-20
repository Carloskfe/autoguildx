'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Wrench,
  Users,
  ShieldCheck,
  GraduationCap,
  Package,
  ArrowRight,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';

interface TeamProfile {
  id: string;
  userId: string;
  name: string;
  bio: string;
  location: string;
  role: string;
  tags: string[];
  isVerified: boolean;
  followersCount: number;
  profileImageUrl?: string;
  profileBannerUrl?: string;
}

const VALUE_KEYS = [
  { icon: Wrench,       titleKey: 'value_enthusiasts_title', bodyKey: 'value_enthusiasts_body' },
  { icon: ShieldCheck,  titleKey: 'value_trust_title',       bodyKey: 'value_trust_body' },
  { icon: Users,        titleKey: 'value_community_title',   bodyKey: 'value_community_body' },
  { icon: GraduationCap,titleKey: 'value_knowledge_title',   bodyKey: 'value_knowledge_body' },
];

export default function TeamPage() {
  const t = useTranslations('team');
  const { data: teamProfile } = useQuery<TeamProfile | null>({
    queryKey: ['team-profile'],
    queryFn: () =>
      api
        .get('/profiles/team')
        .then((r) => r.data)
        .catch(() => null),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <main className="min-h-screen flex flex-col bg-[#0f0f0f]">
      {/* Nav */}
      <header className="border-b border-surface-border px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-brand-500 font-bold text-xl tracking-tight">
          AutoGuildX
        </Link>
        <nav className="flex gap-3">
          <Link href="/discover" className="btn-secondary text-sm">{t('explore_cta')}</Link>
          <Link href="/signup" className="btn-primary text-sm">{t('join_cta')}</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 py-24 gap-6 border-b border-surface-border">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mb-2">
          <Wrench className="w-8 h-8 text-brand-500" />
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight max-w-3xl leading-none">
          {t('hero_line1')}
          <br />
          <span className="text-brand-500">{t('hero_line2')}</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl leading-relaxed">{t('hero_subtitle')}</p>
        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <Link href="/signup" className="btn-primary text-base px-7 py-3">{t('join_cta')}</Link>
          <Link href="/discover" className="btn-secondary text-base px-7 py-3">{t('explore_cta')}</Link>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center space-y-5">
        <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest">{t('mission_label')}</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white leading-snug">{t('mission_title')}</h2>
        <p className="text-gray-400 leading-relaxed">{t('mission_body')}</p>
      </section>

      {/* Values */}
      <section className="border-t border-surface-border">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest text-center mb-12">
            {t('values_label')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {VALUE_KEYS.map(({ icon: Icon, titleKey, bodyKey }) => (
              <div
                key={titleKey}
                className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-3"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-brand-500" />
                </div>
                <h3 className="font-bold text-white">{t(titleKey as any)}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{t(bodyKey as any)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform overview */}
      <section className="border-t border-surface-border bg-surface-card/30">
        <div className="max-w-5xl mx-auto px-6 py-20 space-y-12">
          <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest text-center">
            {t('platform_label')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: Users,         labelKey: 'platform_profiles',    descKey: 'platform_profiles_desc' },
              { icon: Package,       labelKey: 'platform_marketplace', descKey: 'platform_marketplace_desc' },
              { icon: GraduationCap, labelKey: 'platform_courses',     descKey: 'platform_courses_desc' },
            ].map(({ icon: Icon, labelKey, descKey }) => (
              <div key={labelKey} className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-surface-card border border-surface-border flex items-center justify-center mx-auto">
                  <Icon className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="font-bold text-white">{t(labelKey as any)}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{t(descKey as any)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team profile card */}
      {teamProfile && (
        <section className="border-t border-surface-border">
          <div className="max-w-xl mx-auto px-6 py-20 space-y-8 text-center">
            <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest">
              {t('official_account')}
            </p>
            <h2 className="text-2xl font-bold text-white">{t('follow_us')}</h2>

            <Link
              href={`/profile/${teamProfile.userId}`}
              className="block bg-surface-card border border-surface-border hover:border-brand-500/60 rounded-xl p-6 transition-colors group text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center shrink-0">
                  {teamProfile.profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={teamProfile.profileImageUrl}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Wrench className="w-7 h-7 text-brand-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white group-hover:text-brand-500 transition-colors">
                      {teamProfile.name}
                    </span>
                    {teamProfile.isVerified && (
                      <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                    )}
                  </div>
                  {teamProfile.location && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {teamProfile.location}
                    </p>
                  )}
                  {teamProfile.bio && (
                    <p className="text-sm text-gray-400 mt-2 leading-relaxed line-clamp-2">
                      {teamProfile.bio}
                    </p>
                  )}
                  {teamProfile.tags?.filter(Boolean).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {teamProfile.tags.filter(Boolean).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full bg-surface-border text-gray-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-brand-500 transition-colors shrink-0 mt-0.5" />
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-surface-border">
        <div className="max-w-xl mx-auto px-6 py-24 text-center space-y-6">
          <h2 className="text-4xl font-black text-white leading-tight">{t('join_banner_title')}</h2>
          <p className="text-gray-400">{t('join_banner_body')}</p>
          <Link href="/signup" className="btn-primary text-base px-10 py-3.5 inline-block font-semibold">
            {t('create_account')}
          </Link>
          <p className="text-xs text-gray-600">
            {t('already_member')}{' '}
            <Link href="/login" className="text-brand-500 hover:underline">{t('sign_in', { ns: 'auth' })}</Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-border px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-600">
        <span className="text-brand-500 font-bold">AutoGuildX</span>
        <div className="flex gap-5">
          <Link href="/privacy" className="hover:text-gray-400 transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-gray-400 transition-colors">
            Terms
          </Link>
          <Link href="/cookies" className="hover:text-gray-400 transition-colors">
            Cookies
          </Link>
          <Link href="/disclaimer" className="hover:text-gray-400 transition-colors">
            Disclaimer
          </Link>
        </div>
        <span>© 2026 AutoGuildX</span>
      </footer>
    </main>
  );
}
