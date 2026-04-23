'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Star, Tag, ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { Listing } from '@autoguildx/shared';

interface ListingWithUser extends Listing {
  user?: { id: string; email: string };
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { userId } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const {
    data: listing,
    isLoading,
    isError,
  } = useQuery<ListingWithUser>({
    queryKey: ['listing', id],
    queryFn: () => api.get(`/listings/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const del = useMutation({
    mutationFn: () => api.delete(`/listings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listings'] });
      router.push('/marketplace');
    },
  });

  const isOwn = listing?.userId === userId;
  const price =
    listing?.price != null ? `$${Number(listing.price).toLocaleString()}` : 'Contact for price';

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      </AppShell>
    );
  }

  if (isError || !listing) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-400 text-sm">Listing not found.</p>
          <Link
            href="/marketplace"
            className="text-brand-500 text-sm hover:underline mt-2 inline-block"
          >
            ← Back to Marketplace
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Back */}
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>

        {/* Header card */}
        <div className="card space-y-4">
          {listing.isFeatured && (
            <div className="flex items-center gap-1 text-xs text-brand-500 font-medium">
              <Star className="w-3.5 h-3.5 fill-brand-500" /> Featured
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white leading-tight">{listing.title}</h1>
              <p className="text-sm text-gray-400 mt-0.5 capitalize">{listing.category}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-black text-white">{price}</p>
              <span className="text-xs text-gray-400 capitalize">{listing.type}</span>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            {listing.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {listing.location}
              </span>
            )}
            <span>{formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true })}</span>
          </div>

          {/* Tags */}
          {listing.vehicleTags?.filter(Boolean).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {listing.vehicleTags.filter(Boolean).map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-surface-card border border-surface-border text-gray-300"
                >
                  <Tag className="w-3 h-3" /> {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="card space-y-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Description
          </h2>
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
            {listing.description}
          </p>
        </div>

        {/* Contact / Actions */}
        <div className="card space-y-3">
          {isOwn ? (
            <>
              <p className="text-xs text-gray-500">This is your listing.</p>
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
                {del.isPending ? 'Deleting…' : 'Delete Listing'}
              </button>
            </>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                Contact Seller
              </h2>
              {listing.user?.email ? (
                <a
                  href={`mailto:${listing.user.email}?subject=Re: ${encodeURIComponent(listing.title)}`}
                  className="btn-primary w-full text-sm py-2.5 text-center block"
                >
                  Email Seller
                </a>
              ) : (
                <p className="text-sm text-gray-500">Seller contact not available.</p>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
