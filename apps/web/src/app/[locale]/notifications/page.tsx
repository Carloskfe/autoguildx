'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Loader2 } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

interface Actor {
  id: string;
  email: string;
  profile?: { id: string; displayName?: string; name?: string };
}

interface Notification {
  id: string;
  type: string;
  actor?: Actor;
  targetId?: string;
  targetType?: string;
  data?: { emoji?: string; excerpt?: string; rating?: number };
  isRead: boolean;
  createdAt: string;
}

function actorName(actor?: Actor): string {
  return actor?.profile?.displayName ?? actor?.profile?.name ?? actor?.email ?? 'Someone';
}

function notifText(n: Notification): string {
  const name = actorName(n.actor);
  switch (n.type) {
    case 'follow':
      return `${name} started following you`;
    case 'reaction':
      return `${name} reacted ${n.data?.emoji ?? '👍'} to your post`;
    case 'comment':
      return n.data?.excerpt
        ? `${name} commented: "${n.data.excerpt}"`
        : `${name} commented on your post`;
    case 'share':
      return `${name} shared your post`;
    case 'review':
      return `${name} left you a ${n.data?.rating ?? 5}★ review`;
    default:
      return `${name} interacted with you`;
  }
}

function notifLink(n: Notification): string {
  switch (n.type) {
    case 'follow':
      return '/profile';
    case 'reaction':
    case 'comment':
    case 'share':
      return '/feed';
    case 'review':
      return n.targetType === 'listing' ? `/marketplace/${n.targetId}` : '/profile';
    default:
      return '/feed';
  }
}

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications?limit=50').then((r) => r.data),
    enabled: isAuthenticated,
  });

  const markAllRead = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifUnread'] });
    },
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifUnread'] });
    },
  });

  function handleClick(n: Notification) {
    if (!n.isRead) markRead.mutate(n.id);
    router.push(notifLink(n));
  }

  const unread = notifications.filter((n) => !n.isRead).length;

  if (!isAuthenticated) return null;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">Notifications</h1>
          {unread > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="text-sm text-brand-500 hover:text-brand-400 transition-colors disabled:opacity-50"
            >
              Mark all as read
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
            <Bell className="w-12 h-12" />
            <p className="text-sm">No notifications yet</p>
            <p className="text-xs text-gray-600">
              You&apos;ll see activity from followers, reactions, and reviews here.
            </p>
          </div>
        ) : (
          <div className="card divide-y divide-surface-border overflow-hidden p-0">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full flex items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-surface-border ${!n.isRead ? 'bg-brand-500/5' : ''}`}
              >
                <div className="w-9 h-9 rounded-full bg-brand-500/20 text-brand-500 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                  {actorName(n.actor)[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 leading-snug">{notifText(n)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!n.isRead && <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-2" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
