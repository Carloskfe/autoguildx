'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

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
    roleType: 'individual',
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md space-y-6">
        <div>
          <p className="text-gray-400 text-sm">Step {step} of 2</p>
          <h1 className="text-2xl font-bold mt-1">
            {step === 1 ? 'Tell us about yourself' : 'Pick your specialties'}
          </h1>
        </div>

        {step === 1 && (
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
            <select
              className="input"
              value={form.roleType}
              onChange={(e) => setForm({ ...form, roleType: e.target.value })}
            >
              <option value="individual">Individual</option>
              <option value="business">Business</option>
            </select>
            <button className="btn-primary w-full" onClick={() => setStep(2)} disabled={!form.name}>
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">Select all that apply to your work</p>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${form.tags.includes(tag) ? 'bg-brand-500 border-brand-500 text-white' : 'border-surface-border text-gray-400 hover:border-brand-500'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setStep(1)}>
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
