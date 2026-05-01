'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import ForumCommentThread from '@/components/ForumCommentThread';
import api from '@/lib/api';
import type { ForumPost, ForumComment } from '@autoguildx/shared';

export default function ForumPostPage() {
  const router = useRouter();
  const { slug, postId } = useParams<{ slug: string; postId: string }>();
  const { isAuthenticated, userId } = useAuth();
  const queryClient = useQueryClient();
  const commentsKey = ['forum-comments', postId];

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const { data: post } = useQuery<
    ForumPost & { myVote: number | null; user?: { id: string; name: string } }
  >({
    queryKey: ['forum-post', slug, postId],
    queryFn: async () => (await api.get(`/forums/${slug}/posts/${postId}`)).data,
    enabled: isAuthenticated,
  });

  const { data: comments = [] } = useQuery<ForumComment[]>({
    queryKey: commentsKey,
    queryFn: async () => (await api.get(`/forums/${slug}/posts/${postId}/comments`)).data,
    enabled: isAuthenticated,
  });

  const voteMutation = useMutation({
    mutationFn: (value: 1 | -1) => api.post(`/forums/${slug}/posts/${postId}/vote`, { value }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['forum-post', slug, postId] }),
  });

  const removeVoteMutation = useMutation({
    mutationFn: () => api.delete(`/forums/${slug}/posts/${postId}/vote`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['forum-post', slug, postId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/forums/${slug}/posts/${postId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts', slug] });
      router.push(`/agxtopics/${slug}`);
    },
  });

  const handleVote = (value: 1 | -1) => {
    if (post?.myVote === value) {
      removeVoteMutation.mutate();
    } else {
      voteMutation.mutate(value);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Link
          href={`/agxtopics/${slug}`}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm"
        >
          <ArrowLeft size={16} />
          Back to topic
        </Link>

        {post && (
          <div className="card mb-6">
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <button
                  onClick={() => handleVote(1)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    post.myVote === 1
                      ? 'text-brand-500 bg-brand-500/10'
                      : 'text-gray-500 hover:text-brand-400'
                  }`}
                >
                  <ArrowUp size={20} />
                </button>
                <span
                  className={`text-base font-bold tabular-nums ${
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
                  onClick={() => handleVote(-1)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    post.myVote === -1
                      ? 'text-red-400 bg-red-500/10'
                      : 'text-gray-500 hover:text-red-400'
                  }`}
                >
                  <ArrowDown size={20} />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    {post.isPinned && (
                      <span className="text-xs text-brand-500 font-medium mr-2">📌 Pinned</span>
                    )}
                    {post.isLocked && (
                      <span className="text-xs text-yellow-500 mr-2">🔒 Locked</span>
                    )}
                    <h1 className="text-xl font-bold text-white">{post.title}</h1>
                  </div>
                  {post.user?.id === userId && (
                    <button
                      onClick={() => {
                        if (confirm('Delete this post?')) deleteMutation.mutate();
                      }}
                      className="text-gray-500 hover:text-red-400 transition-colors shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                  <span className="text-brand-400">{post.user?.name ?? 'User'}</span>
                  <span>·</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>

                <p className="text-gray-300 whitespace-pre-wrap">{post.content}</p>

                {post.mediaUrls && post.mediaUrls.filter(Boolean).length > 0 && (
                  <div
                    className={`mt-4 grid gap-2 ${post.mediaUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
                  >
                    {post.mediaUrls.filter(Boolean).map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt=""
                        className="w-full rounded-lg object-cover max-h-80"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <ForumCommentThread
            comments={comments}
            isAuthenticated={isAuthenticated}
            forumPostId={postId}
            forumSlug={slug}
            isLocked={post?.isLocked}
            invalidateKey={commentsKey}
          />
        </div>
      </div>
    </AppShell>
  );
}
