'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Search, Star, MapPin, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/api';
import type { Listing } from '@autoguildx/shared';

const PAGE_SIZE = 20;

// ─── Listing card ─────────────────────────────────────────────────────────────

function ListingCard({ listing }: { listing: Listing }) {
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
      className="card block hover:border-brand-500 transition-colors group"
    >
      {listing.isFeatured && (
        <div className="flex items-center gap-1 text-xs text-brand-500 font-medium mb-2">
          <Star className="w-3.5 h-3.5 fill-brand-500" />
          Featured
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm leading-snug group-hover:text-brand-500 transition-colors truncate">
            {listing.title}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">{listing.category}</p>
          {reviewSummary && reviewSummary.total > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs text-amber-400 font-medium">{reviewSummary.avgRating}</span>
              <span className="text-xs text-gray-500">· {reviewSummary.total}</span>
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-white">{price}</p>
          <span
            className={clsx(
              'text-xs px-2 py-0.5 rounded-full border',
              listing.type === 'part'
                ? 'border-blue-700 text-blue-400'
                : 'border-purple-700 text-purple-400',
            )}
          >
            {listing.type === 'part' ? 'Part' : 'Service'}
          </span>
        </div>
      </div>

      {listing.vehicleTags?.filter(Boolean).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {listing.vehicleTags
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
          {listing.vehicleTags.filter(Boolean).length > 4 && (
            <span className="text-xs text-gray-500">
              +{listing.vehicleTags.filter(Boolean).length - 4}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
        {listing.location ? (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {listing.location}
          </span>
        ) : (
          <span />
        )}
        <span>{formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true })}</span>
      </div>
    </Link>
  );
}

// ─── Marketplace page ─────────────────────────────────────────────────────────

type TypeFilter = '' | 'part' | 'service';

export default function MarketplacePage() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');

  const applySearch = () => setQ(search.trim());

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery<Listing[]>({
      queryKey: ['listings', { type: typeFilter, q }],
      queryFn: ({ pageParam }) =>
        api
          .get('/listings', {
            params: {
              ...(typeFilter && { type: typeFilter }),
              ...(q && { q }),
              page: pageParam,
              limit: PAGE_SIZE,
            },
          })
          .then((r) => r.data),
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined,
    });

  const listings = data?.pages.flat() ?? [];

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-lg">Marketplace</h1>
          <Link href="/marketplace/new" className="btn-primary text-sm px-4 py-2">
            + New Listing
          </Link>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              className="input w-full pl-9 text-sm"
              placeholder="Search listings…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            />
          </div>
          <button onClick={applySearch} className="btn-secondary text-sm px-4 py-2">
            Search
          </button>
        </div>

        {/* Type filter */}
        <div className="flex gap-2">
          {(['', 'part', 'service'] as TypeFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={clsx(
                'text-sm px-4 py-1.5 rounded-lg border transition-colors',
                typeFilter === t
                  ? 'bg-brand-500 border-brand-500 text-white'
                  : 'border-surface-border text-gray-400 hover:text-white hover:border-gray-500',
              )}
            >
              {t === '' ? 'All' : t === 'part' ? 'Parts' : 'Services'}
            </button>
          ))}
        </div>

        {/* Listings */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        )}

        {isError && (
          <p className="text-center text-sm text-red-400 py-10">
            Failed to load listings. Please try again.
          </p>
        )}

        {!isLoading && listings.length === 0 && !isError && (
          <p className="text-center text-sm text-gray-500 py-16">
            No listings found.{' '}
            <Link href="/marketplace/new" className="text-brand-500 hover:underline">
              Be the first to post one.
            </Link>
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
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
