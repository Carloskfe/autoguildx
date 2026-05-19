'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

const EVENT_TYPES = ['meetup', 'workshop', 'show', 'race', 'opportunity', 'other'] as const;

const EVENT_TYPE_LABELS: Record<string, string> = {
  meetup: 'Meetup',
  workshop: 'Workshop',
  show: 'Show / Expo',
  race: 'Race / Track Day',
  opportunity: 'Opportunity / Job',
  other: 'Other',
};

interface EventForm {
  title: string;
  description: string;
  type: string;
  location: string;
  startDate: string;
  endDate: string;
}

export default function NewEventPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  const [form, setForm] = useState<EventForm>({
    title: '',
    description: '',
    type: 'meetup',
    location: '',
    startDate: '',
    endDate: '',
  });

  const set =
    (field: keyof EventForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const create = useMutation({
    mutationFn: () =>
      api
        .post('/events', {
          title: form.title.trim(),
          description: form.description.trim(),
          type: form.type,
          location: form.location.trim(),
          ...(form.startDate && { startDate: new Date(form.startDate).toISOString() }),
          ...(form.endDate && { endDate: new Date(form.endDate).toISOString() }),
        })
        .then((r) => r.data),
    onSuccess: (event) => router.push(`/events/${event.id}`),
  });

  const isOpportunity = form.type === 'opportunity';
  const canSubmit =
    form.title.trim() &&
    form.description.trim() &&
    form.location.trim() &&
    (isOpportunity || form.startDate);

  if (!isAuthenticated) return null;

  return (
    <AppShell>
      <div className="max-w-xl mx-auto px-4 py-6">
        <h1 className="font-bold text-lg mb-6">Post an Event or Opportunity</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) create.mutate();
          }}
          className="space-y-5"
        >
          {/* Type */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">Type</label>
            <select className="input w-full text-sm" value={form.type} onChange={set('type')}>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {EVENT_TYPE_LABELS[t] ?? t}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">
              {isOpportunity ? 'Job / Role Title' : 'Title'} <span className="text-red-400">*</span>
            </label>
            <input
              className="input w-full text-sm"
              placeholder={isOpportunity ? 'e.g. Senior Technician — Austin TX' : 'e.g. Cars & Coffee — Austin'}
              value={form.title}
              onChange={set('title')}
              maxLength={150}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">
              {isOpportunity ? 'Role Description' : 'Description'} <span className="text-red-400">*</span>
            </label>
            <textarea
              className="input w-full text-sm resize-none h-28"
              placeholder={isOpportunity
                ? 'Describe the role, requirements, compensation, and how to apply…'
                : 'What\'s happening, who should come, what to expect…'}
              value={form.description}
              onChange={set('description')}
              maxLength={3000}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{form.description.length} / 3000</p>
          </div>

          {/* Location */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">
              {isOpportunity ? 'Location or Remote' : 'Location'} <span className="text-red-400">*</span>
            </label>
            <input
              className="input w-full text-sm"
              placeholder={isOpportunity ? 'e.g. Austin TX, Remote, or Hybrid' : 'Venue name or address'}
              value={form.location}
              onChange={set('location')}
              maxLength={200}
              required
            />
          </div>

          {/* Dates — hidden for opportunities */}
          {!isOpportunity && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">
                  Start <span className="text-red-400">*</span>
                </label>
                <input
                  className="input w-full text-sm"
                  type="datetime-local"
                  value={form.startDate}
                  onChange={set('startDate')}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">
                  End <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  className="input w-full text-sm"
                  type="datetime-local"
                  value={form.endDate}
                  onChange={set('endDate')}
                  min={form.startDate}
                />
              </div>
            </div>
          )}

          {create.isError && (
            <p className="text-sm text-red-400">Failed to create event. Please try again.</p>
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
              {create.isPending ? 'Posting…' : isOpportunity ? 'Post Opportunity' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
