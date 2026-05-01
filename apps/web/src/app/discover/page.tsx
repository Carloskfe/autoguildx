'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Search, MapPin, Calendar, Package, User, Loader2, Star, X } from 'lucide-react';
import { clsx } from 'clsx';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/api';
import type { Profile, Listing, Event } from '@autoguildx/shared';

type SectionFilter = 'all' | 'profiles' | 'listings' | 'events';

interface SearchResults {
  profiles?: Profile[];
  listings?: Listing[];
  events?: Event[];
}

// ─── Result cards ─────────────────────────────────────────────────────────────

function ProfileResult({ profile }: { profile: Profile }) {
  const { data: reviewSummary } = useQuery<{ avgRating: number | null; total: number }>({
    queryKey: ['review-summary', 'profile', profile.id],
    queryFn: () => api.get(`/reviews/profile/${profile.id}/summary`).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Link
      href={`/profile/${profile.id}`}
      className="card flex items-start gap-3 hover:border-brand-500 transition-colors group"
    >
      <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
        {profile.name?.[0]?.toUpperCase() ?? '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white group-hover:text-brand-500 transition-colors">
            {profile.name}
          </p>
          {reviewSummary && reviewSummary.total > 0 && (
            <span className="flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs text-amber-400 font-medium">{reviewSummary.avgRating}</span>
              <span className="text-xs text-gray-500">· {reviewSummary.total}</span>
            </span>
          )}
        </div>
        {profile.businessName && <p className="text-xs text-gray-400">{profile.businessName}</p>}
        {profile.location && (
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" /> {profile.location}
          </p>
        )}
        {profile.tags?.filter(Boolean).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {profile.tags
              .filter(Boolean)
              .slice(0, 4)
              .map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-1.5 py-0.5 rounded bg-surface-card border border-surface-border text-gray-400"
                >
                  {tag}
                </span>
              ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function ListingResult({ listing }: { listing: Listing }) {
  const price =
    listing.price != null ? `$${Number(listing.price).toLocaleString()}` : 'Contact for price';

  const { data: reviewSummary } = useQuery<{ avgRating: number | null; total: number }>({
    queryKey: ['review-summary', 'listing', listing.id],
    queryFn: () => api.get(`/reviews/listing/${listing.id}/summary`).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Link
      href={`/marketplace/${listing.id}`}
      className="card flex items-start gap-3 hover:border-brand-500 transition-colors group"
    >
      <div className="w-10 h-10 rounded-lg bg-surface-card border border-surface-border flex items-center justify-center shrink-0">
        <Package className="w-5 h-5 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white group-hover:text-brand-500 transition-colors truncate">
          {listing.title}
        </p>
        <p className="text-xs text-gray-400 capitalize mt-0.5">{listing.category}</p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-xs font-medium text-white">{price}</span>
          {listing.location && (
            <span className="text-xs text-gray-500 flex items-center gap-0.5">
              <MapPin className="w-3 h-3" /> {listing.location}
            </span>
          )}
          {reviewSummary && reviewSummary.total > 0 && (
            <span className="flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs text-amber-400 font-medium">{reviewSummary.avgRating}</span>
              <span className="text-xs text-gray-500">· {reviewSummary.total}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function EventResult({ event }: { event: Event }) {
  return (
    <div className="card flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-surface-card border border-surface-border flex items-center justify-center shrink-0">
        <Calendar className="w-5 h-5 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{event.title}</p>
        <p className="text-xs text-gray-400 capitalize mt-0.5">{event.type}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          {event.location && (
            <span className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3" /> {event.location}
            </span>
          )}
          <span>{formatDistanceToNow(new Date(event.startDate), { addSuffix: true })}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: React.ElementType;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Icon className="w-4 h-4 text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">{title}</h2>
        <span className="text-xs text-gray-600">({count})</span>
      </div>
      {children}
    </div>
  );
}

// ─── Discover page ────────────────────────────────────────────────────────────

const FILTERS: { value: SectionFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'profiles', label: 'People' },
  { value: 'listings', label: 'Listings' },
  { value: 'events', label: 'Events' },
];

const TAG_CHIPS = [
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

export default function DiscoverPage() {
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const [section, setSection] = useState<SectionFilter>('all');
  const [locationInput, setLocationInput] = useState('');
  const [location, setLocation] = useState('');
  const [activeTag, setActiveTag] = useState('');

  const applySearch = () => {
    const trimmed = input.trim();
    if (trimmed) {
      setQ(trimmed);
      setLocation(locationInput.trim());
    }
  };

  const { data, isLoading, isError } = useQuery<SearchResults>({
    queryKey: ['search', q, section, location, activeTag],
    queryFn: () =>
      api
        .get('/search', {
          params: {
            q,
            ...(section !== 'all' && { type: section }),
            ...(location && { location }),
            ...(activeTag && { tag: activeTag }),
          },
        })
        .then((r) => r.data),
    enabled: q.length > 0,
  });

  const profiles = data?.profiles ?? [];
  const listings = data?.listings ?? [];
  const events = data?.events ?? [];
  const totalCount = profiles.length + listings.length + events.length;
  const hasResults = totalCount > 0;
  const searched = q.length > 0;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <h1 className="font-bold text-lg">Discover</h1>

        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              className="input w-full pl-9 text-sm"
              placeholder="Search people, parts, events…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            />
          </div>
          <button onClick={applySearch} className="btn-primary text-sm px-4 py-2">
            Search
          </button>
        </div>

        {/* Location + section filters */}
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              className="input text-sm pl-8 pr-3 py-1.5 w-40"
              placeholder="Location…"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            />
          </div>
          <div className="w-px h-5 bg-surface-border" />
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSection(value)}
              className={clsx(
                'text-sm px-4 py-1.5 rounded-lg border transition-colors',
                section === value
                  ? 'bg-brand-500 border-brand-500 text-white'
                  : 'border-surface-border text-gray-400 hover:text-white hover:border-gray-500',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tag chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TAG_CHIPS.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
              className={clsx(
                'shrink-0 text-xs px-3 py-1 rounded-full border transition-colors whitespace-nowrap',
                activeTag === tag
                  ? 'bg-brand-500 border-brand-500 text-white'
                  : 'border-surface-border text-gray-400 hover:text-white hover:border-gray-500',
              )}
            >
              {tag}
            </button>
          ))}
          {activeTag && (
            <button
              onClick={() => setActiveTag('')}
              className="shrink-0 flex items-center gap-1 text-xs px-2 py-1 rounded-full text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* States */}
        {!searched && (
          <p className="text-center text-sm text-gray-500 py-16">
            Search for mechanics, listings, events, and more.
          </p>
        )}

        {searched && isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        )}

        {searched && isError && (
          <p className="text-center text-sm text-red-400 py-10">Search failed. Please try again.</p>
        )}

        {searched && !isLoading && !isError && !hasResults && (
          <p className="text-center text-sm text-gray-500 py-16">
            No results for <span className="text-white">&quot;{q}&quot;</span>.
          </p>
        )}

        {/* Results */}
        {hasResults && (
          <div className="space-y-6">
            <Section title="People" icon={User} count={profiles.length}>
              {profiles.map((p) => (
                <ProfileResult key={p.id} profile={p} />
              ))}
            </Section>

            <Section title="Listings" icon={Package} count={listings.length}>
              {listings.map((l) => (
                <ListingResult key={l.id} listing={l} />
              ))}
            </Section>

            <Section title="Events" icon={Calendar} count={events.length}>
              {events.map((e) => (
                <EventResult key={e.id} event={e} />
              ))}
            </Section>
          </div>
        )}
      </div>
    </AppShell>
  );
}
