'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { useTranslations, useLocale } from 'next-intl';
import api from '@/lib/api';
import { locales, type Locale } from '@/i18n';

const ROLE_CARDS = [
  {
    value: 'mechanic',
    emoji: '🔧',
    label: 'Technician / Shop',
    description: 'Shop owners, technicians, restorers, and performance tuners',
  },
  {
    value: 'manufacturer',
    emoji: '🏭',
    label: 'Maker / Fabricator',
    description: 'Parts makers, custom fabricators, and small-scale producers',
  },
  {
    value: 'collector',
    emoji: '🏎️',
    label: 'Collector / Owner',
    description: 'Owners of classic, custom, or performance vehicles — two wheels or four',
  },
  {
    value: 'enthusiast',
    emoji: '🛠️',
    label: 'Enthusiast / DIYer',
    description: 'Weekend builders, curious learners, and everyone who loves cars and motos',
  },
] as const;

const TAGS = [
  'Classic Cars',
  'Motorcycles',
  'Performance',
  'Off-Road',
  'Restoration',
  'Fabrication',
  'Trucks',
  'Drag Racing',
  'Import',
  'Diesel',
  'Electric/EV',
  'Lowriders',
];

const LOCALE_OPTIONS: { value: Locale; flag: string; label: string; sublabel: string }[] = [
  { value: 'en', flag: '🇺🇸', label: 'English', sublabel: 'English' },
  { value: 'es', flag: '🇲🇽', label: 'Español', sublabel: 'Spanish' },
];

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const tc = useTranslations('common');
  const currentLocale = useLocale() as Locale;
  const pathname = usePathname();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    businessName: '',
    location: '',
    bio: '',
    roleType: '' as string,
    tags: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggleTag = (tag: string) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/profiles', form);
      router.push('/feed');
    } catch {
      setLoading(false);
    }
  };

  function switchLocale(next: Locale) {
    if (next === currentLocale) { setStep(1); return; }
    const segments = pathname.split('/');
    segments[1] = next;
    router.push(segments.join('/').replace('/onboarding', '/onboarding'));
  }

  const totalSteps = 4; // 0=lang, 1=role, 2=profile, 3=tags

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="card w-full max-w-md space-y-6">
        {step > 0 && (
          <div>
            <p className="text-gray-400 text-sm">
              {t('step', { current: step, total: totalSteps - 1 })}
            </p>
            <div className="flex gap-1 mt-2">
              {Array.from({ length: totalSteps - 1 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${i < step ? 'bg-brand-500' : 'bg-surface-border'}`}
                />
              ))}
            </div>
            <h1 className="text-2xl font-bold mt-4">
              {step === 1 ? t('role_title') : step === 2 ? t('profile_title') : t('tags_title')}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {step === 1 ? t('role_subtitle') : step === 2 ? t('profile_subtitle') : t('tags_subtitle')}
            </p>
          </div>
        )}

        {/* Step 0 — Language picker */}
        {step === 0 && (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <div className="text-4xl">🌐</div>
              <h1 className="text-2xl font-bold">{t('language_title')}</h1>
              <p className="text-sm text-gray-400">{t('language_subtitle')}</p>
            </div>
            <div className="space-y-3">
              {LOCALE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => switchLocale(opt.value)}
                  className={clsx(
                    'w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all',
                    opt.value === currentLocale
                      ? 'border-brand-500 bg-brand-500/10'
                      : 'border-surface-border hover:border-gray-500 bg-surface-card',
                  )}
                >
                  <span className="text-3xl shrink-0">{opt.flag}</span>
                  <div>
                    <p className="font-semibold text-white">{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.sublabel}</p>
                  </div>
                  {opt.value === currentLocale && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1 — Role picker */}
        {step === 1 && (
          <div className="space-y-3">
            {ROLE_CARDS.map((card) => (
              <button
                key={card.value}
                type="button"
                onClick={() => setForm({ ...form, roleType: card.value })}
                className={clsx(
                  'w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all',
                  form.roleType === card.value
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-surface-border hover:border-gray-500 bg-surface-card',
                )}
              >
                <span className="text-3xl shrink-0">{card.emoji}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm">{t(`role_${card.value}_label` as any)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t(`role_${card.value}_desc` as any)}</p>
                </div>
                {form.roleType === card.value && (
                  <div className="ml-auto w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center shrink-0">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
            <button
              className="btn-primary w-full mt-2"
              onClick={() => setStep(2)}
              disabled={!form.roleType}
            >
              {t('next')}
            </button>
          </div>
        )}

        {/* Step 2 — Profile details */}
        {step === 2 && (
          <div className="space-y-4">
            <input
              className="input"
              placeholder={`${t('name_placeholder')} *`}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="input"
              placeholder={`${t('business_placeholder')} (${t('business_label')})`}
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            />
            <input
              className="input"
              placeholder={t('location_placeholder')}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <textarea
              className="input h-24 resize-none"
              placeholder={t('bio_placeholder')}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setStep(1)}>
                {t('back')}
              </button>
              <button
                className="btn-primary flex-1"
                onClick={() => setStep(3)}
                disabled={!form.name}
              >
                {t('next')}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Tags */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    form.tags.includes(tag)
                      ? 'bg-brand-500 border-brand-500 text-white'
                      : 'border-surface-border text-gray-400 hover:border-brand-500'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setStep(2)}>
                {t('back')}
              </button>
              <button className="btn-primary flex-1" onClick={handleSubmit} disabled={loading}>
                {loading ? '…' : t('finish')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
