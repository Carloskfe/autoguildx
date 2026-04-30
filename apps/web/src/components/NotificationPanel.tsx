'use client';

import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Loader2, Bell } from 'lucide-react';
import api from '@/lib/api';

interface Actor {
  id: string;
  email: string;
  profile?: { id: string; displayName?: string; name?: string };
}

interface Notification {
  id: string;
  type: string;
  actorId: string;
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

function actorInitial(actor?: Actor): string {
  const name = actorName(actor);
  return name[0]?.toUpperCase() ?? '?';
}

interface Props {
  onClose: () => void;
}

export default function NotificationPanel({ onClose }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications?limit=30').then((r) => r.data),
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

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  function handleClick(n: Notification) {
    if (!n.isRead) markRead.mutate(n.id);
    onClose();
    router.push(notifLink(n));
  }

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 max-h-[480px] flex flex-col bg-surface-card border border-surface-border rounded-xl shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border shrink-0">
        <h2 className="text-sm font-semibold text-white">Notifications</h2>
        {unread > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="text-xs text-brand-500 hover:text-brand-400 transition-colors disabled:opacity-50"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-500">
            <Bell className="w-8 h-8" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-surface-border">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => handleClick(n)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-border ${!n.isRead ? 'bg-brand-500/5' : ''}`}
                >
                  {/* Actor avatar */}
                  <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {actorInitial(n.actor)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 leading-snug">{notifText(n)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
