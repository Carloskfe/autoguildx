'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Star, Tag, ArrowLeft, Trash2, Loader2, Zap, MessageSquare, Share2, Link2, X } from 'lucide-react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import UpgradeModal from '@/components/UpgradeModal';
import ReviewSection from '@/components/ReviewSection';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { Listing, SubscriptionTier } from '@autoguildx/shared';

interface ListingWithUser extends Listing {
  user?: { id: string; email: string };
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { userId, isAuthenticated } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [boostError, setBoostError] = useState<string | null>(null);
  const [messagePending, setMessagePending] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareComment, setShareComment] = useState('');
  const [sharePosting, setSharePosting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareToFeed = async () => {
    if (!listing) return;
    setSharePosting(true);
    try {
      const snapshot = JSON.stringify({
        type: 'listing',
        id: listing.id,
        title: listing.title,
        subtitle: listing.category,
        price: listing.price != null ? `$${Number(listing.price).toLocaleString()}` : 'Contact for price',
        location: listing.location,
        imageUrl: listing.mediaUrls?.filter(Boolean)[0] ?? null,
      });
      await api.post('/posts', {
        content: shareComment.trim(),
        sharedContentType: 'listing',
        sharedContentId: listing.id,
        sharedContent: snapshot,
      });
      setShareComment('');
      setShowShareModal(false);
    } finally {
      setSharePosting(false);
    }
  };

  const handleMessageSeller = async (sellerId: string) => {
    setMessagePending(true);
    try {
      const { data } = await api.post('/messages/conversations', { recipientId: sellerId });
      router.push(`/messages?conversation=${data.id}`);
    } finally {
      setMessagePending(false);
    }
  };

  const {
    data: listing,
    isLoading,
    isError,
  } = useQuery<ListingWithUser>({
    queryKey: ['listing', id],
    queryFn: () => api.get(`/listings/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const { data: subscription } = useQuery<{ tier: SubscriptionTier }>({
    queryKey: ['subscription'],
    queryFn: () => api.get('/subscriptions/me').then((r) => r.data),
    enabled: isAuthenticated,
  });

  const del = useMutation({
    mutationFn: () => api.delete(`/listings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listings'] });
      router.push('/marketplace');
    },
  });

  const boost = useMutation({
    mutationFn: () => api.post(`/listings/${id}/feature`, { days: 7 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listing', id] }),
    onError: (err: unknown) => {
      const e = err as { response?: { status?: number; data?: { message?: string } } };
      const msg = e?.response?.data?.message ?? '';
      if (e?.response?.status === 403) {
        setBoostError(msg);
        setShowUpgrade(true);
      }
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
        {/* Back + actions row */}
        <div className="flex items-center justify-between">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Marketplace
          </Link>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-500 transition-colors"
              >
                <Share2 className="w-4 h-4" /> Share to Feed
              </button>
            )}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <Link2 className="w-4 h-4" />
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

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

        {/* Images */}
        {listing.mediaUrls?.filter(Boolean).length > 0 && (
          <div
            className={`grid gap-2 ${listing.mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}
          >
            {listing.mediaUrls.filter(Boolean).map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt=""
                className={`w-full rounded-xl object-cover ${listing.mediaUrls.length === 1 ? 'max-h-80' : 'aspect-square'}`}
              />
            ))}
          </div>
        )}

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

              {!listing.isFeatured && (
                <>
                  {boostError && (
                    <p className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-lg px-3 py-2">
                      {boostError}
                    </p>
                  )}
                  <button
                    onClick={() => {
                      setBoostError(null);
                      boost.mutate();
                    }}
                    disabled={boost.isPending}
                    className="btn-secondary w-full text-sm py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {boost.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 text-brand-500" />
                    )}
                    {boost.isPending ? 'Boosting…' : 'Boost Listing (7 days)'}
                  </button>
                </>
              )}

              {listing.isFeatured && (
                <p className="text-xs text-brand-500 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-brand-500" /> This listing is currently
                  featured.
                </p>
              )}

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
              {listing.user?.id && isAuthenticated ? (
                <button
                  onClick={() => handleMessageSeller(listing.user!.id)}
                  disabled={messagePending}
                  className="btn-primary w-full text-sm py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {messagePending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                  Message Seller
                </button>
              ) : listing.user?.email ? (
                <a
                  href={`mailto:${listing.user.email}?subject=Re: ${encodeURIComponent(listing.title)}`}
                  className="btn-secondary w-full text-sm py-2.5 text-center block"
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

      {/* Reviews */}
      {listing && (
        <div className="max-w-4xl mx-auto px-4 pb-10">
          <ReviewSection targetId={listing.id} targetType="listing" />
        </div>
      )}

      {showShareModal && listing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="card w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Share to Feed</h2>
              <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="border border-surface-border rounded-lg p-3 space-y-1">
              <p className="text-sm font-semibold text-white truncate">{listing.title}</p>
              <p className="text-xs text-gray-400 capitalize">{listing.category}</p>
              <p className="text-sm font-bold text-white">
                {listing.price != null ? `$${Number(listing.price).toLocaleString()}` : 'Contact for price'}
              </p>
            </div>
            <textarea
              value={shareComment}
              onChange={(e) => setShareComment(e.target.value)}
              placeholder="Add your take… (optional)"
              rows={3}
              className="input w-full text-sm resize-none"
              maxLength={2000}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowShareModal(false)} className="btn-secondary text-sm px-4 py-2">
                Cancel
              </button>
              <button
                onClick={handleShareToFeed}
                disabled={sharePosting}
                className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
              >
                {sharePosting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Share'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpgrade && (
        <UpgradeModal currentTier={subscription?.tier} onClose={() => setShowUpgrade(false)} />
      )}
    </AppShell>
  );
}
