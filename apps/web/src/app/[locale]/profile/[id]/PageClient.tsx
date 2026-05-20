'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Heart, UserPlus, UserMinus, Loader2, MessageSquare, Link2 } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import ReviewSection from '@/components/ReviewSection';
import VerifiedBadge from '@/components/VerifiedBadge';
import ProfileSections from '@/components/ProfileSections';
import { useAuth } from '@/hooks/useAuth';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import type { Profile, Post } from '@autoguildx/shared';

interface PostWithUser extends Post {
  user?: { id: string; email: string };
}

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
  const tp = useTranslations('profile');

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
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
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
              <div className="w-full h-full bg-gradient-to-br from-gray-900 via-[#111] to-black">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_theme(colors.brand.500/8),_transparent_60%)]" />
              </div>
            )}
          </div>

          {/* Avatar + actions */}
          <div className="px-4 pb-5">
            <div className="flex items-end justify-between -mt-10 mb-4">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full ring-4 ring-surface shrink-0 overflow-hidden">
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
                    {tp('edit_profile')}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCopyLink}
                      className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      {copied ? tp('copied') : tp('share')}
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
                      {tp('message')}
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
                          <UserMinus className="w-3.5 h-3.5" /> {tp('unfollow')}
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" /> {tp('follow')}
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
                <h1 className="font-heading font-black text-2xl tracking-tight text-white flex items-center gap-2">
                  {profile.name}
                  {profile.isVerified && <VerifiedBadge size="md" />}
                </h1>
                {profile.businessName && (
                  <p className="text-sm text-gray-400 mt-0.5">{profile.businessName}</p>
                )}
                <span className="inline-block mt-2 text-xs px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/25 text-brand-400 font-medium">
                  {tp(`role_${profile.roleType}` as any) ?? profile.roleType}
                </span>
              </div>

              {profile.location && (
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>{profile.location}</span>
                </div>
              )}

              <div className="flex items-center gap-6 text-sm border-t border-surface-border pt-3">
                <div className="text-center">
                  <p className="font-heading font-black text-lg text-white leading-none">
                    {profile.followersCount}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">{tp('followers_count')}</p>
                </div>
                <div className="w-px h-8 bg-surface-border" />
                <div className="text-center">
                  <p className="font-heading font-black text-lg text-white leading-none">
                    {profile.followingCount}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">{tp('following_count')}</p>
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
                    <span key={tag} className="section-chip">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile sections */}
        {profile && <ProfileSections profileId={profile.id} isOwner={isOwnProfile} />}

        {/* Posts */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold tracking-[0.1em] uppercase text-gray-500 px-1">
            {tp('posts')}
          </h2>

          {postsLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
            </div>
          )}

          {!postsLoading && posts.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-8">{tp('no_posts')}</p>
          )}

          {posts.map((post) => (
            <article
              key={post.id}
              className="card hover:border-silver-500/20 transition-all duration-200 space-y-2"
            >
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
          <ReviewSection targetId={profile.userId} targetType="profile" showDimensions />
        )}
      </div>
    </AppShell>
  );
}
