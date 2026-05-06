'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  MapPin,
  Users,
  Heart,
  UserPlus,
  UserMinus,
  Loader2,
  MessageSquare,
  Link2,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import ReviewSection from '@/components/ReviewSection';
import VerifiedBadge from '@/components/VerifiedBadge';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { Profile, Post } from '@autoguildx/shared';

interface PostWithUser extends Post {
  user?: { id: string; email: string };
}

const ROLE_LABELS: Record<string, string> = {
  mechanic: 'Mechanic / Shop',
  manufacturer: 'Manufacturer',
  collector: 'Collector',
  enthusiast: 'Enthusiast',
};

function initials(name?: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function PublicProfilePage() {
  const { id: profileId } = useParams<{ id: string }>();
  const { isAuthenticated, userId } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  const { data: profile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ['profile', profileId],
    queryFn: () => api.get(`/profiles/${profileId}`).then((r) => r.data),
    enabled: isAuthenticated && !!profileId,
  });

  const { data: following = [] } = useQuery<Profile[]>({
    queryKey: ['following', 'me'],
    queryFn: () => api.get('/profiles/me/following').then((r) => r.data),
    enabled: isAuthenticated,
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery<PostWithUser[]>({
    queryKey: ['userPosts', profile?.userId],
    queryFn: () => api.get(`/users/${profile!.userId}/posts?limit=50`).then((r) => r.data),
    enabled: !!profile?.userId,
  });

  const isOwnProfile = profile?.userId === userId;
  const isFollowing = following.some((p) => p.id === profileId);
  const [messagePending, setMessagePending] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMessage = async () => {
    if (!profile?.userId) return;
    setMessagePending(true);
    try {
      const { data } = await api.post('/messages/conversations', { recipientId: profile.userId });
      router.push(`/messages?conversation=${data.id}`);
    } finally {
      setMessagePending(false);
    }
  };

  const followMutation = useMutation({
    mutationFn: () => api.post(`/profiles/${profileId}/follow`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['following', 'me'] }),
  });

  const unfollowMutation = useMutation({
    mutationFn: () => api.post(`/profiles/${profileId}/unfollow`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['following', 'me'] }),
  });

  if (!isAuthenticated) return null;

  if (profileLoading) {
    return (
      <AppShell>
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-400 text-sm">Profile not found.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* ── Profile banner card ───────────────────────────────────────────── */}
        <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
          {/* Banner */}
          <div className="relative h-40">
            {(profile as any).profileBannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={(profile as any).profileBannerUrl}
                alt="profile banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950" />
            )}
          </div>

          {/* Avatar + actions */}
          <div className="px-4 pb-5">
            <div className="flex items-end justify-between -mt-10 mb-4">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full ring-4 ring-gray-900 shrink-0 overflow-hidden">
                {(profile as any).profileVideoUrl ? (
                  <video
                    src={(profile as any).profileVideoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-20 h-20 object-cover"
                  />
                ) : profile.profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.profileImageUrl}
                    alt={profile.name}
                    className="w-20 h-20 object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-brand-500 flex items-center justify-center text-2xl font-black text-white">
                    {initials(profile.name)}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mb-1">
                {isOwnProfile ? (
                  <button
                    onClick={() => router.push('/profile')}
                    className="btn-secondary text-xs px-4 py-1.5"
                  >
                    Edit profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCopyLink}
                      className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      {copied ? 'Copied!' : 'Share'}
                    </button>
                    <button
                      onClick={handleMessage}
                      disabled={messagePending}
                      className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {messagePending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <MessageSquare className="w-3.5 h-3.5" />
                      )}
                      Message
                    </button>
                    <button
                      onClick={() =>
                        isFollowing ? unfollowMutation.mutate() : followMutation.mutate()
                      }
                      disabled={followMutation.isPending || unfollowMutation.isPending}
                      className={`text-xs px-4 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 ${
                        isFollowing
                          ? 'bg-surface-card border border-surface-border text-gray-300 hover:text-red-400 hover:border-red-400'
                          : 'btn-primary'
                      }`}
                    >
                      {followMutation.isPending || unfollowMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isFollowing ? (
                        <>
                          <UserMinus className="w-3.5 h-3.5" /> Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" /> Follow
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Profile info */}
            <div className="space-y-3">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  {profile.name}
                  {profile.isVerified && <VerifiedBadge size="md" />}
                </h1>
                {profile.businessName && (
                  <p className="text-sm text-gray-400 mt-0.5">{profile.businessName}</p>
                )}
                <span className="inline-block mt-2 text-xs px-2.5 py-1 rounded-full bg-surface-card border border-surface-border text-gray-300">
                  {ROLE_LABELS[profile.roleType] ?? profile.roleType}
                </span>
              </div>

              {profile.location && (
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>{profile.location}</span>
                </div>
              )}

              <div className="flex items-center gap-5 text-sm">
                <div>
                  <span className="font-bold text-white">{profile.followersCount}</span>
                  <span className="text-gray-400 ml-1.5">followers</span>
                </div>
                <div>
                  <span className="font-bold text-white">{profile.followingCount}</span>
                  <span className="text-gray-400 ml-1.5">following</span>
                </div>
              </div>

              {profile.bio && (
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {profile.bio}
                </p>
              )}

              {profile.tags?.filter(Boolean).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.tags.filter(Boolean).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-full bg-surface-card border border-surface-border text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide px-1">
            Posts
          </h2>

          {postsLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
            </div>
          )}

          {!postsLoading && posts.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-8">No posts yet.</p>
          )}

          {posts.map((post) => (
            <article key={post.id} className="card space-y-2">
              <p className="text-sm text-gray-200 whitespace-pre-wrap break-words leading-relaxed">
                {post.content}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" />
                  <span>{post.likesCount}</span>
                </div>
                <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
              </div>
            </article>
          ))}
        </div>

        {/* Reviews */}
        {!isOwnProfile && profile && (
          <div className="max-w-2xl mx-auto px-4 pb-10">
            <ReviewSection targetId={profile.userId} targetType="profile" showDimensions />
          </div>
        )}
      </div>
    </AppShell>
  );
}
