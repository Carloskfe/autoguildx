'use client';

import Link from 'next/link';
import { useInfiniteQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { MapPin, Users, Loader2 } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/api';
import type { Event } from '@autoguildx/shared';

const PAGE_SIZE = 20;

const TYPE_STYLES: Record<string, string> = {
  meetup: 'border-blue-700 text-blue-400',
  workshop: 'border-green-700 text-green-400',
  show: 'border-amber-700 text-amber-400',
  race: 'border-red-700 text-red-400',
  other: 'border-surface-border text-gray-400',
};

// ─── Event card ───────────────────────────────────────────────────────────────

function EventCard({ event }: { event: Event }) {
  const start = new Date(event.startDate);

  return (
    <Link
      href={`/events/${event.id}`}
      className="card block hover:border-brand-500 transition-colors group"
    >
      <div className="flex items-start gap-4">
        {/* Date block */}
        <div className="shrink-0 w-12 text-center">
          <p className="text-xs text-gray-500 uppercase leading-none">{format(start, 'MMM')}</p>
          <p className="text-2xl font-black text-white leading-tight">{format(start, 'd')}</p>
          <p className="text-xs text-gray-500">{format(start, 'EEE')}</p>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-white group-hover:text-brand-500 transition-colors leading-snug">
              {event.title}
            </h3>
            <span
              className={`shrink-0 text-xs px-2 py-0.5 rounded-full border capitalize ${TYPE_STYLES[event.type] ?? TYPE_STYLES.other}`}
            >
              {event.type}
            </span>
          </div>

          <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {event.location}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {event.rsvpCount} going
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Events page ──────────────────────────────────────────────────────────────

export default function EventsPage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery<Event[]>({
      queryKey: ['events'],
      queryFn: ({ pageParam }) =>
        api.get('/events', { params: { page: pageParam, limit: PAGE_SIZE } }).then((r) => r.data),
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined,
    });

  const events = data?.pages.flat() ?? [];

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-lg">Events</h1>
          <Link href="/events/new" className="btn-primary text-sm px-4 py-2">
            + Create Event
          </Link>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        )}

        {isError && (
          <p className="text-center text-sm text-red-400 py-10">
            Failed to load events. Please try again.
          </p>
        )}

        {!isLoading && events.length === 0 && !isError && (
          <p className="text-center text-sm text-gray-500 py-16">
            No upcoming events.{' '}
            <Link href="/events/new" className="text-brand-500 hover:underline">
              Create one.
            </Link>
          </p>
        )}

        <div className="space-y-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="btn-secondary w-full text-sm py-2.5 flex items-center justify-center gap-2"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </>
            ) : (
              'Load more'
            )}
          </button>
        )}
      </div>
    </AppShell>
  );
}
