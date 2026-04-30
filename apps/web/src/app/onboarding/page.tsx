'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import api from '@/lib/api';

const ROLE_CARDS = [
  {
    value: 'mechanic',
    emoji: '🔧',
    label: 'Mechanic / Shop',
    description: 'Restoration specialists, performance tuners, niche experts',
  },
  {
    value: 'manufacturer',
    emoji: '🏭',
    label: 'Manufacturer',
    description: 'Small-scale parts producers, custom fabrication shops',
  },
  {
    value: 'collector',
    emoji: '🏎️',
    label: 'Collector',
    description: 'Owners of rare, classic, or performance vehicles',
  },
  {
    value: 'enthusiast',
    emoji: '🛠️',
    label: 'Enthusiast',
    description: 'DIY builders and general automotive fans',
  },
] as const;

const TAGS = [
  'Classic Cars',
  'Performance',
  'Off-Road',
  'Motorcycles',
  'Restoration',
  'Fabrication',
  'Drag Racing',
  'Import',
  'Diesel',
  'Electric/EV',
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
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

  const totalSteps = 3;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="card w-full max-w-md space-y-6">
        <div>
          <p className="text-gray-400 text-sm">
            Step {step} of {totalSteps}
          </p>
          <div className="flex gap-1 mt-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${i < step ? 'bg-brand-500' : 'bg-surface-border'}`}
              />
            ))}
          </div>
          <h1 className="text-2xl font-bold mt-4">
            {step === 1
              ? 'What best describes you?'
              : step === 2
                ? 'Tell us about yourself'
                : 'Pick your specialties'}
          </h1>
        </div>

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
                  <p className="font-semibold text-white text-sm">{card.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{card.description}</p>
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
              Next
            </button>
          </div>
        )}

        {/* Step 2 — Profile details */}
        {step === 2 && (
          <div className="space-y-4">
            <input
              className="input"
              placeholder="Full name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="input"
              placeholder="Business / shop name (optional)"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            />
            <input
              className="input"
              placeholder="Location (city, state)"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <textarea
              className="input h-24 resize-none"
              placeholder="Short bio"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setStep(1)}>
                Back
              </button>
              <button
                className="btn-primary flex-1"
                onClick={() => setStep(3)}
                disabled={!form.name}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Tags */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">Select all that apply to your work</p>
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
                Back
              </button>
              <button className="btn-primary flex-1" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : 'Finish Setup'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
