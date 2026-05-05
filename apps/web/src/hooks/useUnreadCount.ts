'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useSocket } from './useSocket';
import api from '@/lib/api';

export function useUnreadCount(): number {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const socket = useSocket();

  const { data } = useQuery<{ count: number }>({
    queryKey: ['unreadCount'],
    queryFn: () => api.get('/messages/unread-count').then((r) => r.data),
    enabled: isAuthenticated,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!socket) return;
    const handler = (payload: { count: number }) => {
      qc.setQueryData(['unreadCount'], { count: payload.count });
    };
    socket.on('unread_count_changed', handler);
    return () => {
      socket.off('unread_count_changed', handler);
    };
  }, [socket, qc]);

  return data?.count ?? 0;
}
