'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { MapPin, Calendar, Users, ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { Event } from '@autoguildx/shared';

interface EventWithOrganizer extends Event {
  organizer?: { id: string; email: string };
  organizerId: string;
}

const TYPE_STYLES: Record<string, string> = {
  meetup: 'border-blue-700 text-blue-400',
  workshop: 'border-green-700 text-green-400',
  show: 'border-amber-700 text-amber-400',
  race: 'border-red-700 text-red-400',
  other: 'border-surface-border text-gray-400',
};

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { userId, isAuthenticated } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const {
    data: event,
    isLoading,
    isError,
  } = useQuery<EventWithOrganizer>({
    queryKey: ['event', id],
    queryFn: () => api.get(`/events/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const rsvp = useMutation({
    mutationFn: () => api.post(`/events/${id}/rsvp`),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['event', id] });
      const prev = qc.getQueryData<EventWithOrganizer>(['event', id]);
      qc.setQueryData<EventWithOrganizer>(['event', id], (old) =>
        old ? { ...old, rsvpCount: old.rsvpCount + 1 } : old,
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['event', id], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['event', id] }),
  });

  const del = useMutation({
    mutationFn: () => api.delete(`/events/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      router.push('/events');
    },
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      </AppShell>
    );
  }

  if (isError || !event) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-400 text-sm">Event not found.</p>
          <Link href="/events" className="text-brand-500 text-sm hover:underline mt-2 inline-block">
            ← Back to Events
          </Link>
        </div>
      </AppShell>
    );
  }

  const isOwn = event.organizerId === userId;
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : null;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Back */}
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>

        {/* Header card */}
        <div className="card space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold text-white leading-tight">{event.title}</h1>
            <span
              className={`shrink-0 text-xs px-2 py-1 rounded-full border capitalize ${TYPE_STYLES[event.type] ?? TYPE_STYLES.other}`}
            >
              {event.type}
            </span>
          </div>

          {/* Date & location */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
              <span>
                {format(start, 'EEEE, MMMM d, yyyy')} at {format(start, 'h:mm a')}
                {end && (
                  <span className="text-gray-500">
                    {' '}
                    — {format(end, 'h:mm a')}
                    {end.toDateString() !== start.toDateString() && `, ${format(end, 'MMM d')}`}
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Users className="w-4 h-4 text-gray-500 shrink-0" />
              <span>
                <span className="font-semibold text-white">{event.rsvpCount}</span> going
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="card space-y-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">About</h2>
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
            {event.description}
          </p>
        </div>

        {/* Actions */}
        <div className="card space-y-3">
          {isOwn ? (
            <>
              <p className="text-xs text-gray-500">You are organizing this event.</p>
              <button
                onClick={() => del.mutate()}
                disabled={del.isPending}
                className="btn-secondary w-full text-sm py-2.5 flex items-center justify-center gap-2 text-red-400 hover:text-red-300 border-red-900 hover:border-red-700 disabled:opacity-50"
              >
                {del.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {del.isPending ? 'Deleting…' : 'Delete Event'}
              </button>
            </>
          ) : isAuthenticated ? (
            <button
              onClick={() => rsvp.mutate()}
              disabled={rsvp.isPending}
              className="btn-primary w-full text-sm py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {rsvp.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {rsvp.isPending ? 'Saving…' : "I'm Going"}
            </button>
          ) : (
            <Link href="/login" className="btn-primary w-full text-sm py-2.5 text-center block">
              Log in to RSVP
            </Link>
          )}
        </div>
      </div>
    </AppShell>
  );
}
