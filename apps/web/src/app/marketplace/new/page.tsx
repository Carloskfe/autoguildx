'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import UpgradeModal from '@/components/UpgradeModal';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

const CATEGORIES = [
  'Engine & Drivetrain',
  'Suspension & Steering',
  'Brakes',
  'Body & Exterior',
  'Interior',
  'Electrical',
  'Wheels & Tires',
  'Exhaust',
  'Fuel System',
  'Restoration',
  'Fabrication',
  'Tuning & Performance',
  'Other',
];

interface ListingForm {
  type: 'part' | 'service';
  title: string;
  description: string;
  price: string;
  category: string;
  vehicleTags: string;
  location: string;
}

export default function NewListingPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  const [form, setForm] = useState<ListingForm>({
    type: 'part',
    title: '',
    description: '',
    price: '',
    category: '',
    vehicleTags: '',
    location: '',
  });

  const set =
    (field: keyof ListingForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const create = useMutation({
    mutationFn: () =>
      api
        .post('/listings', {
          type: form.type,
          title: form.title.trim(),
          description: form.description.trim(),
          ...(form.price && { price: Number(form.price) }),
          category: form.category,
          vehicleTags: form.vehicleTags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          ...(form.location && { location: form.location.trim() }),
        })
        .then((r) => r.data),
    onSuccess: (listing) => router.push(`/marketplace/${listing.id}`),
    onError: (err: unknown) => {
      const e = err as { response?: { status?: number } };
      if (e?.response?.status === 403) setShowUpgrade(true);
    },
  });

  const canSubmit = form.title.trim() && form.description.trim() && form.category;

  if (!isAuthenticated) return null;

  return (
    <AppShell>
      <div className="max-w-xl mx-auto px-4 py-6">
        <h1 className="font-bold text-lg mb-6">New Listing</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) create.mutate();
          }}
          className="space-y-5"
        >
          {/* Type */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Type</label>
            <div className="flex gap-3">
              {(['part', 'service'] as const).map((t) => (
                <label
                  key={t}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border cursor-pointer text-sm transition-colors ${
                    form.type === t
                      ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                      : 'border-surface-border text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    value={t}
                    checked={form.type === t}
                    onChange={() => setForm((f) => ({ ...f, type: t }))}
                  />
                  {t === 'part' ? 'Part / Product' : 'Service'}
                </label>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              className="input w-full text-sm"
              placeholder="e.g. LS3 6.2L crate engine"
              value={form.title}
              onChange={set('title')}
              maxLength={150}
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              className="input w-full text-sm"
              value={form.category}
              onChange={set('category')}
              required
            >
              <option value="">Select a category…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              className="input w-full text-sm resize-none h-32"
              placeholder="Describe the item, condition, specifications…"
              value={form.description}
              onChange={set('description')}
              maxLength={3000}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{form.description.length} / 3000</p>
          </div>

          {/* Price */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">
              Price{' '}
              <span className="text-gray-500">
                (optional — leave blank for &quot;Contact for price&quot;)
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                $
              </span>
              <input
                className="input w-full text-sm pl-7"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.price}
                onChange={set('price')}
              />
            </div>
          </div>

          {/* Vehicle tags */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">
              Vehicle Tags <span className="text-gray-500">(comma-separated)</span>
            </label>
            <input
              className="input w-full text-sm"
              placeholder="e.g. Camaro, C5 Corvette, LS Swap"
              value={form.vehicleTags}
              onChange={set('vehicleTags')}
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">Location</label>
            <input
              className="input w-full text-sm"
              placeholder="City, State"
              value={form.location}
              onChange={set('location')}
              maxLength={100}
            />
          </div>

          {create.isError && !showUpgrade && (
            <p className="text-sm text-red-400">Failed to create listing. Please try again.</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary flex-1 text-sm py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || create.isPending}
              className="btn-primary flex-1 text-sm py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {create.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {create.isPending ? 'Posting…' : 'Post Listing'}
            </button>
          </div>
        </form>
      </div>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </AppShell>
  );
}
