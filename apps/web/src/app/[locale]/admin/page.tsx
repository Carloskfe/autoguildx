'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import {
  Loader2,
  Users,
  Package,
  Calendar,
  FileText,
  ShieldCheck,
  ShieldOff,
  Trash2,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  users: number;
  profiles: number;
  listings: number;
  events: number;
  posts: number;
}

interface AdminUser {
  id: string;
  email: string;
  role: string;
  provider: string;
  createdAt: string;
  profile?: { name?: string };
}

interface VerificationRequest {
  id: string;
  status: string;
  createdAt: string;
  note: string | null;
  user: { id: string; email: string };
  profile: { id: string; name: string };
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-brand-500" />
      </div>
      <div>
        <p className="text-2xl font-black text-white">{value.toLocaleString()}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  );
}

// ─── Verification tab ─────────────────────────────────────────────────────────

function VerificationTab() {
  const t = useTranslations('admin');
  const qc = useQueryClient();

  const { data: requests = [], isLoading } = useQuery<VerificationRequest[]>({
    queryKey: ['admin', 'verification'],
    queryFn: () => api.get('/verification/pending').then((r) => r.data),
  });

  const review = useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: 'approve' | 'deny'; note?: string }) =>
      api.patch(`/verification/${id}/review`, { action, note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'verification'] }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <ShieldCheck className="w-10 h-10 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400 text-sm">{t('no_pending')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <div key={req.id} className="card flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {req.profile?.name ?? 'Unknown'}
            </p>
            <p className="text-xs text-gray-400 truncate">{req.user?.email}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('requested_ago', {
                time: formatDistanceToNow(new Date(req.createdAt), { addSuffix: true }),
              })}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => review.mutate({ id: req.id, action: 'approve' })}
              disabled={review.isPending}
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50"
            >
              {review.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              {t('btn_approve')}
            </button>
            <button
              onClick={() => review.mutate({ id: req.id, action: 'deny' })}
              disabled={review.isPending}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 text-red-400 border-red-900 hover:border-red-700 disabled:opacity-50"
            >
              <ShieldOff className="w-3.5 h-3.5" />
              {t('btn_deny')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────

function DeleteUserModal({
  user,
  onClose,
  onConfirm,
  isPending,
}: {
  user: AdminUser;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const t = useTranslations('admin');
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-surface-card border border-red-900 rounded-2xl w-full max-w-sm p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-white">{t('delete_title')}</h2>
          <p className="text-sm text-gray-400 mt-1">
            {t('delete_body', { name: user.profile?.name ?? user.email })}
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-gray-400">{t('delete_type')}</label>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="DELETE"
            className="input w-full font-mono"
            onKeyDown={(e) => e.key === 'Enter' && input === 'DELETE' && onConfirm()}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm" disabled={isPending}>
            {t('btn_cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={input !== 'DELETE' || isPending}
            className="flex-1 text-sm px-4 py-2 rounded-xl font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {t('btn_delete_user')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Users tab ────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-brand-500/20 text-brand-500 border border-brand-500/40',
  mechanic: 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
  manufacturer: 'bg-purple-500/20 text-purple-400 border border-purple-500/40',
  collector: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
  enthusiast: 'bg-surface-card text-gray-400 border border-surface-border',
};

function UsersTab() {
  const t = useTranslations('admin');
  const qc = useQueryClient();
  const { userId: currentUserId } = useAuth();
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);

  const { data, isLoading } = useQuery<{
    items: AdminUser[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ['admin', 'users', page],
    queryFn: () => api.get(`/admin/users?page=${page}&limit=20`).then((r) => r.data),
  });

  const setRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setPendingDelete(null);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  const users = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / (data?.limit ?? 20));

  return (
    <>
      {pendingDelete && (
        <DeleteUserModal
          user={pendingDelete}
          onClose={() => setPendingDelete(null)}
          onConfirm={() => deleteUser.mutate(pendingDelete.id)}
          isPending={deleteUser.isPending}
        />
      )}
      <div className="space-y-3">
        <p className="text-xs text-gray-500 px-1">{t('users_total', { count: total })}</p>

        {users.map((user) => (
          <div key={user.id} className="card flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user.profile?.name ?? user.email}
              </p>
              {user.profile?.name && <p className="text-xs text-gray-500 truncate">{user.email}</p>}
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[user.role] ?? ROLE_COLORS.enthusiast}`}
                >
                  {user.role}
                </span>
                <span className="text-xs text-gray-600">{user.provider}</span>
                <span className="text-xs text-gray-600">
                  {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
            {user.id !== currentUserId && (
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={user.role}
                  onChange={(e) => setRole.mutate({ id: user.id, role: e.target.value })}
                  disabled={setRole.isPending}
                  className="input text-xs py-1 px-2 w-32 disabled:opacity-50"
                >
                  <option value="enthusiast">{t('role_enthusiast')}</option>
                  <option value="mechanic">{t('role_mechanic')}</option>
                  <option value="manufacturer">{t('role_manufacturer')}</option>
                  <option value="collector">{t('role_collector')}</option>
                  <option value="admin">{t('role_admin')}</option>
                </select>
                <button
                  onClick={() => setPendingDelete(user)}
                  title={t('btn_delete_user')}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
            >
              {t('btn_prev')}
            </button>
            <span className="text-xs text-gray-400">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
            >
              {t('btn_next')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Admin page ───────────────────────────────────────────────────────────────

type Tab = 'verification' | 'users';

export default function AdminPage() {
  const t = useTranslations('admin');
  const { isAuthenticated, role } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('verification');

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
    else if (role && role !== 'admin') router.replace('/feed');
  }, [isAuthenticated, role, router]);

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
    enabled: isAuthenticated && role === 'admin',
  });

  if (!isAuthenticated || role !== 'admin') return null;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white">{t('title')}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{t('subtitle')}</p>
        </div>

        {/* Stats */}
        {statsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card h-16 animate-pulse bg-surface-card" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label={t('stat_users')} value={stats.users} icon={Users} />
            <StatCard label={t('stat_listings')} value={stats.listings} icon={Package} />
            <StatCard label={t('stat_events')} value={stats.events} icon={Calendar} />
            <StatCard label={t('stat_posts')} value={stats.posts} icon={FileText} />
          </div>
        ) : null}

        {/* Tabs */}
        <div>
          <div className="flex border-b border-surface-border mb-4">
            {(['verification', 'users'] as Tab[]).map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  tab === tabKey
                    ? 'border-brand-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tabKey === 'verification' ? t('tab_verification') : t('tab_users')}
              </button>
            ))}
          </div>

          {tab === 'verification' ? <VerificationTab /> : <UsersTab />}
        </div>
      </div>
    </AppShell>
  );
}
