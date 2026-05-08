'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Loader2,
  PlusSquare,
  MapPin,
} from 'lucide-react';
import { clsx } from 'clsx';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { Listing } from '@autoguildx/shared';

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border border-green-500/40',
  sold: 'bg-gray-500/20 text-gray-400 border border-gray-600',
  draft: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
};

export default function ManageListingsPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  const { data: listings = [], isLoading } = useQuery<Listing[]>({
    queryKey: ['my-listings'],
    queryFn: () => api.get('/listings/my').then((r) => r.data),
    enabled: isAuthenticated,
  });

  const statusToggle = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/listings/${id}`, { status }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-listings'] }),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/listings/${id}`).then((r) => r.data),
    onSuccess: () => {
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ['my-listings'] });
      qc.invalidateQueries({ queryKey: ['listings'] });
    },
  });

  if (!isAuthenticated) return null;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/marketplace" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">My Listings</h1>
          </div>
          <Link href="/marketplace/new" className="btn-primary text-sm flex items-center gap-1.5">
            <PlusSquare className="w-4 h-4" /> New Listing
          </Link>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        )}

        {!isLoading && listings.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <p className="text-gray-400 text-sm">You haven&apos;t posted any listings yet.</p>
            <Link href="/marketplace/new" className="btn-primary text-sm inline-block px-5">
              Post your first listing
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {listings.map((listing) => {
            const price =
              listing.price != null
                ? `$${Number(listing.price).toLocaleString()}`
                : 'Contact for price';

            return (
              <div key={listing.id} className="card flex items-start gap-4">
                {/* Thumbnail */}
                {listing.mediaUrls?.filter(Boolean)[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.mediaUrls.filter(Boolean)[0]}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-surface-border shrink-0 flex items-center justify-center text-gray-600 text-xs">
                    No img
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/marketplace/${listing.id}`}
                      className="text-sm font-semibold text-white hover:text-brand-500 transition-colors truncate"
                    >
                      {listing.title}
                    </Link>
                    <span
                      className={clsx(
                        'text-xs px-2 py-0.5 rounded-full shrink-0',
                        STATUS_BADGE[listing.status] ?? STATUS_BADGE.active,
                      )}
                    >
                      {listing.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="font-medium text-white">{price}</span>
                    <span className="capitalize">{listing.category}</span>
                    {listing.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {listing.location}
                      </span>
                    )}
                    <span>
                      {formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/marketplace/${listing.id}/edit`}
                    className="p-1.5 text-gray-400 hover:text-brand-500 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>

                  {listing.status === 'active' ? (
                    <button
                      onClick={() => statusToggle.mutate({ id: listing.id, status: 'sold' })}
                      disabled={statusToggle.isPending}
                      className="p-1.5 text-gray-400 hover:text-green-400 transition-colors"
                      title="Mark as Sold"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => statusToggle.mutate({ id: listing.id, status: 'active' })}
                      disabled={statusToggle.isPending}
                      className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
                      title="Mark as Active"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => setDeleteId(listing.id)}
                    className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="card w-full max-w-sm space-y-4">
            <h2 className="font-semibold text-white">Delete listing?</h2>
            <p className="text-sm text-gray-400">This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary text-sm px-4 py-2">
                Cancel
              </button>
              <button
                onClick={() => del.mutate(deleteId)}
                disabled={del.isPending}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {del.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
