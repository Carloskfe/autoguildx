'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Users, Heart, Edit2, Check, X, Loader2, Camera } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { uploadFile } from '@/lib/upload';
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

const ROLE_LABELS: Record<string, string> = {
  mechanic: 'Mechanic / Shop',
  manufacturer: 'Manufacturer',
  collector: 'Collector',
  enthusiast: 'Enthusiast',
};

// ─── Avatar with upload ────────────────────────────────────────────────────────

function AvatarUpload({ profile }: { profile: Profile }) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      const isVideo = file.type.startsWith('video/');
      const patch = isVideo ? { profileVideoUrl: url } : { profileImageUrl: url };
      const updated = await api.patch('/profiles/me', patch).then((r) => r.data);
      qc.setQueryData(['profile', 'me'], updated);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={uploading}
      className="relative w-16 h-16 rounded-full shrink-0 group"
      aria-label="Change profile photo or video"
    >
      {profile.profileVideoUrl ? (
        <video
          src={profile.profileVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="w-16 h-16 rounded-full object-cover"
        />
      ) : profile.profileImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.profileImageUrl}
          alt={profile.name}
          className="w-16 h-16 rounded-full object-cover"
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-brand-500 flex items-center justify-center text-xl font-black text-white">
          {initials(profile.name)}
        </div>
      )}
      <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin text-white" />
        ) : (
          <Camera className="w-5 h-5 text-white" />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/mp4,video/webm"
        className="sr-only"
        onChange={handleFile}
      />
    </button>
  );
}

// ─── Inline edit form ─────────────────────────────────────────────────────────

const ROLE_CARDS = [
  { value: 'mechanic', emoji: '🔧', label: 'Mechanic / Shop' },
  { value: 'manufacturer', emoji: '🏭', label: 'Manufacturer' },
  { value: 'collector', emoji: '🏎️', label: 'Collector' },
  { value: 'enthusiast', emoji: '🛠️', label: 'Enthusiast' },
] as const;

const SPECIALTY_TAGS = [
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

interface EditForm {
  name: string;
  bio: string;
  location: string;
  roleType: string;
  tags: string[];
}

function EditProfileForm({
  profile,
  onSave,
  onCancel,
  saving,
}: {
  profile: Profile;
  onSave: (data: EditForm) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<EditForm>({
    name: profile.name,
    bio: profile.bio ?? '',
    location: profile.location ?? '',
    roleType: profile.roleType ?? 'enthusiast',
    tags: profile.tags?.filter(Boolean) ?? [],
  });

  const set =
    (field: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const toggleTag = (tag: string) =>
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Name</label>
        <input
          className="input w-full text-sm"
          value={form.name}
          onChange={set('name')}
          maxLength={80}
        />
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Location</label>
        <input
          className="input w-full text-sm"
          placeholder="City, State"
          value={form.location}
          onChange={set('location')}
          maxLength={100}
        />
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Bio</label>
        <textarea
          className="input w-full text-sm resize-none h-20"
          placeholder="Tell people about yourself…"
          value={form.bio}
          onChange={set('bio')}
          maxLength={500}
        />
        <p className="text-xs text-gray-500 mt-1">{form.bio.length} / 500</p>
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-1 block">What best describes you?</label>
        <div className="grid grid-cols-2 gap-2">
          {ROLE_CARDS.map((card) => (
            <button
              key={card.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, roleType: card.value }))}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-colors text-sm ${
                form.roleType === card.value
                  ? 'border-brand-500 bg-brand-500/10 text-white'
                  : 'border-surface-border text-gray-400 hover:border-gray-500'
              }`}
            >
              <span>{card.emoji}</span>
              <span className="truncate">{card.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Specialty tags</label>
        <div className="flex flex-wrap gap-2">
          {SPECIALTY_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                form.tags.includes(tag)
                  ? 'bg-brand-500 border-brand-500 text-white'
                  : 'border-surface-border text-gray-400 hover:border-gray-500 hover:text-white'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave(form)}
          disabled={!form.name.trim() || saving}
          className="btn-primary text-sm flex items-center gap-2 px-4 py-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save
        </button>
        <button onClick={onCancel} disabled={saving} className="btn-secondary text-sm px-4 py-2">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Profile header ───────────────────────────────────────────────────────────

function ProfileHeader({ profile }: { profile: Profile }) {
  const [editing, setEditing] = useState(false);
  const qc = useQueryClient();

  const update = useMutation({
    mutationFn: (data: EditForm) => api.patch('/profiles/me', data).then((r) => r.data),
    onSuccess: (updated) => {
      qc.setQueryData(['profile', 'me'], updated);
      setEditing(false);
    },
  });

  return (
    <div className="card space-y-4">
      <div className="flex items-start gap-4">
        <AvatarUpload profile={profile} />

        <div className="flex-1 min-w-0">
          {editing ? null : (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h1 className="text-lg font-bold text-white leading-tight">{profile.name}</h1>
                  {profile.businessName && (
                    <p className="text-sm text-gray-400">{profile.businessName}</p>
                  )}
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-card transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-surface-card border border-surface-border text-gray-300">
                {ROLE_LABELS[profile.roleType] ?? profile.roleType}
              </span>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <EditProfileForm
          profile={profile}
          onSave={(data) => update.mutate(data)}
          onCancel={() => setEditing(false)}
          saving={update.isPending}
        />
      ) : (
        <>
          {profile.location && (
            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{profile.location}</span>
            </div>
          )}

          {profile.bio && (
            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
              {profile.bio}
            </p>
          )}

          {profile.tags?.filter(Boolean).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.tags.filter(Boolean).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 rounded-full bg-surface-card border border-surface-border text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-6 pt-1 border-t border-surface-border">
            <div className="flex items-center gap-1.5 text-sm">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="font-semibold text-white">{profile.followersCount}</span>
              <span className="text-gray-400">followers</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="font-semibold text-white">{profile.followingCount}</span>
              <span className="text-gray-400">following</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Post card (own posts) ────────────────────────────────────────────────────

function OwnPostCard({ post }: { post: PostWithUser }) {
  const qc = useQueryClient();

  const del = useMutation({
    mutationFn: () => api.delete(`/posts/${post.id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['userPosts'] }),
  });

  return (
    <article className="card space-y-2">
      <p className="text-sm text-gray-200 whitespace-pre-wrap break-words leading-relaxed">
        {post.content}
      </p>
      {post.mediaUrls?.[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.mediaUrls[0]} alt="" className="w-full rounded-lg object-cover max-h-64" />
      )}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Heart className="w-3.5 h-3.5" />
          <span>{post.likesCount}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
          <button
            onClick={() => del.mutate()}
            disabled={del.isPending}
            className="text-gray-600 hover:text-red-400 transition-colors disabled:opacity-50"
          >
            {del.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete'}
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Profile page ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { isAuthenticated, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = useQuery<Profile>({
    queryKey: ['profile', 'me'],
    queryFn: () => api.get('/profiles/me').then((r) => r.data),
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: posts, isLoading: postsLoading } = useQuery<PostWithUser[]>({
    queryKey: ['userPosts', userId],
    queryFn: () => api.get(`/users/${userId}/posts?limit=50`).then((r) => r.data),
    enabled: isAuthenticated && !!userId && !!profile,
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

  if (profileError) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
          <p className="text-gray-400 text-sm">Profile not found. Complete onboarding first.</p>
          <button
            onClick={() => router.push('/onboarding')}
            className="btn-primary text-sm px-6 py-2"
          >
            Set up your profile
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {profile && <ProfileHeader profile={profile} />}

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide px-1">
            Posts
          </h2>

          {postsLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
            </div>
          )}

          {!postsLoading && posts?.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-8">No posts yet.</p>
          )}

          {posts?.map((post) => (
            <OwnPostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
