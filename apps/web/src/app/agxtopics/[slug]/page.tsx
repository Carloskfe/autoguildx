'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowUp, ArrowDown, MessageSquare, Plus, Users } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { Forum, ForumPost } from '@autoguildx/shared';

type Sort = 'hot' | 'top' | 'new';

export default function ForumPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [sort, setSort] = useState<Sort>('hot');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const { data: forum } = useQuery<Forum & { isMember: boolean }>({
    queryKey: ['forum', slug],
    queryFn: async () => (await api.get(`/forums/${slug}`)).data,
    enabled: isAuthenticated,
  });

  const { data: posts = [], isLoading } = useQuery<(ForumPost & { myVote: number | null })[]>({
    queryKey: ['forum-posts', slug, sort, page],
    queryFn: async () => (await api.get(`/forums/${slug}/posts?sort=${sort}&page=${page}`)).data,
    enabled: isAuthenticated,
  });

  const joinMutation = useMutation({
    mutationFn: () => api.post(`/forums/${slug}/join`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['forum', slug] }),
  });

  const leaveMutation = useMutation({
    mutationFn: () => api.delete(`/forums/${slug}/join`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['forum', slug] }),
  });

  const voteMutation = useMutation({
    mutationFn: ({ postId, value }: { postId: string; value: 1 | -1 }) =>
      api.post(`/forums/${slug}/posts/${postId}/vote`, { value }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['forum-posts', slug] }),
  });

  const removeVoteMutation = useMutation({
    mutationFn: (postId: string) => api.delete(`/forums/${slug}/posts/${postId}/vote`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['forum-posts', slug] }),
  });

  const handleVote = (post: ForumPost & { myVote: number | null }, value: 1 | -1) => {
    if (post.myVote === value) {
      removeVoteMutation.mutate(post.id);
    } else {
      voteMutation.mutate({ postId: post.id, value });
    }
  };

  if (!isAuthenticated) return null;

  const SORTS: Sort[] = ['hot', 'top', 'new'];

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link
          href="/agxtopics"
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 text-sm"
        >
          <ArrowLeft size={16} />
          AGXTopics
        </Link>

        {forum && (
          <div className="card mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-white">{forum.name}</h1>
                  <span className="text-xs bg-surface-700 text-gray-400 px-2 py-0.5 rounded-full">
                    {forum.category}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-3">{forum.description}</p>
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
                onClick={() => (forum.isMember ? leaveMutation.mutate() : joinMutation.mutate())}
                className={`shrink-0 text-sm px-4 py-1.5 rounded-lg transition-colors ${
                  forum.isMember
                    ? 'border border-gray-600 text-gray-400 hover:border-red-500 hover:text-red-400'
                    : 'bg-brand-500 text-white hover:bg-brand-600'
                }`}
              >
                {forum.isMember ? 'Joined' : 'Join'}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 bg-surface-800 rounded-lg p-1">
            {SORTS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSort(s);
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                  sort === s ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <Link
            href={`/agxtopics/${slug}/new`}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            New Post
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center text-gray-500 py-12">Loading…</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            No posts yet.{' '}
            <Link href={`/agxtopics/${slug}/new`} className="text-brand-500 hover:underline">
              Be the first.
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="card flex gap-3">
                <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                  <button
                    onClick={() => handleVote(post, 1)}
                    className={`p-1 rounded transition-colors ${
                      post.myVote === 1 ? 'text-brand-500' : 'text-gray-500 hover:text-brand-400'
                    }`}
                  >
                    <ArrowUp size={18} />
                  </button>
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      post.voteScore > 0
                        ? 'text-brand-400'
                        : post.voteScore < 0
                          ? 'text-red-400'
                          : 'text-gray-400'
                    }`}
                  >
                    {post.voteScore}
                  </span>
                  <button
                    onClick={() => handleVote(post, -1)}
                    className={`p-1 rounded transition-colors ${
                      post.myVote === -1 ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
                    }`}
                  >
                    <ArrowDown size={18} />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  {post.isPinned && (
                    <span className="text-xs text-brand-500 font-medium mr-2">📌 Pinned</span>
                  )}
                  <Link
                    href={`/agxtopics/${slug}/${post.id}`}
                    className="text-white font-semibold hover:text-brand-400 transition-colors block mb-1"
                  >
                    {post.title}
                  </Link>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-2">{post.content}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MessageSquare size={12} />
                      {post.commentCount} comments
                    </span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    {post.isLocked && <span className="text-yellow-500">🔒 Locked</span>}
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-center gap-3 pt-4">
              {page > 1 && (
                <button
                  onClick={() => setPage((p) => p - 1)}
                  className="btn-secondary text-sm px-4"
                >
                  Previous
                </button>
              )}
              {posts.length === 20 && (
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-secondary text-sm px-4"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
