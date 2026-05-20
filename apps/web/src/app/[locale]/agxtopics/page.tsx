'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Plus, MessageSquare } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { Forum } from '@autoguildx/shared';

const CATEGORIES = ['All', 'tech', 'classics', 'mods', 'racing', 'buying-selling', 'general'];

export default function AGXTopicsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [category, setCategory] = useState('All');
  const queryClient = useQueryClient();

  const { data: forums = [], isLoading } = useQuery<(Forum & { isMember: boolean })[]>({
    queryKey: ['forums', category],
    queryFn: async () => {
      const params = category !== 'All' ? `?category=${category}` : '';
      const res = await api.get(`/forums${params}`);
      return res.data;
    },
  });

  const joinMutation = useMutation({
    mutationFn: (slug: string) => api.post(`/forums/${slug}/join`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['forums'] }),
  });

  const leaveMutation = useMutation({
    mutationFn: (slug: string) => api.delete(`/forums/${slug}/join`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['forums'] }),
  });

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">AGXTopics</h1>
            <p className="text-gray-400 text-sm mt-1">
              Thematic communities for automotive experts
            </p>
          </div>
          <Link href="/agxtopics/new" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} />
            New Topic
          </Link>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                category === cat
                  ? 'bg-brand-500 text-white'
                  : 'bg-surface-800 text-gray-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center text-gray-500 py-12">Loading topics…</div>
        ) : forums.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            No topics yet.{' '}
            <Link href="/agxtopics/new" className="text-brand-500 hover:underline">
              Create the first one.
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {forums.map((forum) => (
              <div key={forum.id} className="card flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/agxtopics/${forum.slug}`}
                      className="text-white font-semibold hover:text-brand-400 transition-colors"
                    >
                      {forum.name}
                    </Link>
                    <span className="text-xs bg-surface-700 text-gray-400 px-2 py-0.5 rounded-full">
                      {forum.category}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-2">{forum.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {forum.memberCount.toLocaleString()} members
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={12} />
                      {forum.postCount.toLocaleString()} posts
                    </span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    forum.isMember
                      ? leaveMutation.mutate(forum.slug)
                      : joinMutation.mutate(forum.slug)
                  }
                  className={`shrink-0 text-sm px-4 py-1.5 rounded-lg transition-colors ${
                    forum.isMember
                      ? 'border border-gray-600 text-gray-400 hover:border-red-500 hover:text-red-400'
                      : 'bg-brand-500 text-white hover:bg-brand-600'
                  }`}
                >
                  {forum.isMember ? 'Joined' : 'Join'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
