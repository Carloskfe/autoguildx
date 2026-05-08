'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  MapPin,
  Users,
  Heart,
  Edit2,
  Check,
  X,
  Loader2,
  Camera,
  ShieldCheck,
  Bell,
  Award,
  GraduationCap,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import VerifiedBadge from '@/components/VerifiedBadge';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { uploadFile } from '@/lib/upload';
import type { Profile, Post, Certificate } from '@autoguildx/shared';

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

// ─── Profile header (banner + avatar) ────────────────────────────────────────

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

function ProfileHeader({ profile }: { profile: Profile }) {
  const [editing, setEditing] = useState(false);
  const qc = useQueryClient();
  const bannerRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const update = useMutation({
    mutationFn: (data: EditForm) => api.patch('/profiles/me', data).then((r) => r.data),
    onSuccess: (updated) => {
      qc.setQueryData(['profile', 'me'], updated);
      setEditing(false);
    },
  });

  async function handleBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const url = await uploadFile(file);
      const updated = await api
        .patch('/profiles/me', { profileBannerUrl: url })
        .then((r) => r.data);
      qc.setQueryData(['profile', 'me'], updated);
    } finally {
      setUploadingBanner(false);
      e.target.value = '';
    }
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadFile(file);
      const isVideo = file.type.startsWith('video/');
      const patch = isVideo ? { profileVideoUrl: url } : { profileImageUrl: url };
      const updated = await api.patch('/profiles/me', patch).then((r) => r.data);
      qc.setQueryData(['profile', 'me'], updated);
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
      {/* ── Banner ─────────────────────────────────────────────────────────── */}
      <div
        className="relative h-40 cursor-pointer group"
        onClick={() => bannerRef.current?.click()}
      >
        {profile.profileBannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.profileBannerUrl}
            alt="profile banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950" />
        )}
        {/* Desktop: hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors items-center justify-center opacity-0 group-hover:opacity-100 hidden md:flex">
          {uploadingBanner ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <div className="flex items-center gap-2 bg-black/60 rounded-lg px-3 py-2">
              <Camera className="w-4 h-4 text-white" />
              <span className="text-white text-xs font-medium">Change cover photo</span>
            </div>
          )}
        </div>
        {/* Mobile: persistent camera badge */}
        <div className="absolute bottom-2 right-2 md:hidden flex items-center gap-1.5 bg-black/70 rounded-lg px-2 py-1 pointer-events-none">
          {uploadingBanner ? (
            <Loader2 className="w-3 h-3 text-white animate-spin" />
          ) : (
            <>
              <Camera className="w-3 h-3 text-white" />
              <span className="text-white text-[10px] font-medium">Change</span>
            </>
          )}
        </div>
        <input
          ref={bannerRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleBanner}
        />
      </div>

      {/* ── Avatar + actions row ─────────────────────────────────────────── */}
      <div className="px-4 pb-5">
        <div className="flex items-end justify-between -mt-10 mb-4">
          {/* Avatar */}
          <button
            type="button"
            onClick={() => avatarRef.current?.click()}
            className="relative w-20 h-20 rounded-full group ring-4 ring-gray-900 shrink-0"
            aria-label="Change profile photo"
          >
            {(profile as any).profileVideoUrl ? (
              <video
                src={(profile as any).profileVideoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : profile.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.profileImageUrl}
                alt={profile.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-brand-500 flex items-center justify-center text-2xl font-black text-white">
                {initials(profile.name)}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center transition-opacity md:opacity-0 md:group-hover:opacity-100">
              {uploadingAvatar ? (
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </div>
            <input
              ref={avatarRef}
              type="file"
              accept="image/*,video/mp4,video/webm"
              className="sr-only"
              onChange={handleAvatar}
            />
          </button>

          {/* Edit button */}
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="btn-secondary text-xs px-4 py-1.5 flex items-center gap-1.5 mb-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit profile
            </button>
          )}
        </div>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        {editing ? (
          <EditProfileForm
            profile={profile}
            onSave={(data) => update.mutate(data)}
            onCancel={() => setEditing(false)}
            saving={update.isPending}
          />
        ) : (
          <div className="space-y-3">
            {/* Name + role */}
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

            {/* Location */}
            {profile.location && (
              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{profile.location}</span>
              </div>
            )}

            {/* Followers / following */}
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

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </p>
            )}

            {/* Tags */}
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
        )}
      </div>
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

// ─── Verification request section ─────────────────────────────────────────────

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  pending: { text: 'Verification pending review', className: 'text-yellow-400' },
  approved: { text: 'Verified', className: 'text-brand-500' },
  denied: { text: 'Verification denied', className: 'text-red-400' },
};

function VerificationSection() {
  const qc = useQueryClient();

  const { data: status, isLoading } = useQuery<{ status: string } | null>({
    queryKey: ['verificationStatus'],
    queryFn: () =>
      api
        .get('/verification/my-status')
        .then((r) => r.data)
        .catch(() => null),
  });

  const request = useMutation({
    mutationFn: () => api.post('/verification/request'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['verificationStatus'] }),
  });

  if (isLoading) return null;

  const info = status ? STATUS_LABEL[status.status] : null;

  return (
    <div className="card flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-gray-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-white">Verified Badge</p>
          {info ? (
            <p className={`text-xs ${info.className}`}>{info.text}</p>
          ) : (
            <p className="text-xs text-gray-400">
              Get a badge to show you&apos;re a trusted member
            </p>
          )}
        </div>
      </div>
      {!status && (
        <button
          onClick={() => request.mutate()}
          disabled={request.isPending}
          className="btn-secondary text-xs px-3 py-1.5 shrink-0 flex items-center gap-1.5 disabled:opacity-50"
        >
          {request.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Request Verification
        </button>
      )}
    </div>
  );
}

// ─── Email notification toggle ────────────────────────────────────────────────

function EmailNotificationsSection() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ emailNotificationsEnabled: boolean }>({
    queryKey: ['emailSettings'],
    queryFn: () => api.get('/notifications/email-settings').then((r) => r.data),
  });

  const toggle = useMutation({
    mutationFn: (enabled: boolean) =>
      api.patch('/notifications/email-settings', { emailNotificationsEnabled: enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['emailSettings'] }),
  });

  const enabled = data?.emailNotificationsEnabled ?? true;

  return (
    <div id="notifications" className="card flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-gray-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-white">Email Notifications</p>
          <p className="text-xs text-gray-400">
            {enabled
              ? 'Emails for messages, reviews, follows, and badges'
              : 'Email notifications are off'}
          </p>
        </div>
      </div>
      <button
        onClick={() => toggle.mutate(!enabled)}
        disabled={isLoading || toggle.isPending}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-colors duration-200 focus:outline-none disabled:opacity-50
          ${enabled ? 'bg-brand-500' : 'bg-gray-600'}`}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow
            transform transition duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}

// ─── Certificates section ─────────────────────────────────────────────────────

function CertificatesSection() {
  const { data: certs, isLoading } = useQuery<Certificate[]>({
    queryKey: ['myCertificates'],
    queryFn: () => api.get('/courses/certificates').then((r) => r.data),
  });

  if (isLoading || !certs?.length) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide px-1">
        Certificates
      </h2>
      <div className="space-y-2">
        {certs.map((cert) => (
          <div key={cert.id} className="card flex items-center gap-3">
            <Award className="w-5 h-5 text-brand-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {(cert.course as any)?.title ?? 'Course'}
              </p>
              <p className="text-xs text-gray-500 font-mono">{cert.certificateNumber}</p>
            </div>
            <GraduationCap className="w-4 h-4 text-gray-500 shrink-0" />
          </div>
        ))}
      </div>
    </div>
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

        {profile && !profile.isVerified && <VerificationSection />}

        <EmailNotificationsSection />

        <CertificatesSection />

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
