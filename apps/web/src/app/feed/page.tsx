'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Trash2, Send, Loader2, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { Post, Comment } from '@autoguildx/shared';

interface PostWithUser extends Post {
  user?: {
    id: string;
    email: string;
    role: string;
    profile?: { id: string; name: string };
  };
}

interface CommentWithUser extends Comment {
  user?: { id: string; email: string };
}

type FeedPage = PostWithUser[];

const PAGE_SIZE = 20;

function initials(name?: string) {
  if (!name) return '?';
  return name[0].toUpperCase();
}

// ─── Comment thread ────────────────────────────────────────────────────────────

function CommentThread({ postId }: { postId: string }) {
  const [text, setText] = useState('');
  const qc = useQueryClient();

  const { data: comments = [], isLoading } = useQuery<CommentWithUser[]>({
    queryKey: ['comments', postId],
    queryFn: () => api.get(`/posts/${postId}/comments?limit=50`).then((r) => r.data),
  });

  const add = useMutation({
    mutationFn: (content: string) => api.post(`/posts/${postId}/comments`, { content }),
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: ['comments', postId] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    add.mutate(trimmed);
  };

  return (
    <div className="mt-3 pt-3 border-t border-surface-border space-y-3">
      {isLoading && (
        <div className="flex justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
        </div>
      )}

      {comments.map((c) => (
        <div key={c.id} className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-full bg-surface-card border border-surface-border flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">
            {initials(c.user?.email)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium">{c.user?.email ?? 'Unknown'}</p>
            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
              {c.content}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="input flex-1 text-sm py-1.5"
          placeholder="Write a comment…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={!text.trim() || add.isPending}
          className="btn-primary text-sm px-3 py-1.5 disabled:opacity-50"
        >
          {add.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post, currentUserId }: { post: PostWithUser; currentUserId: string | null }) {
  const [showComments, setShowComments] = useState(false);
  const qc = useQueryClient();
  const isOwn = currentUserId === post.userId;
  const profileId = post.user?.profile?.id;
  const displayName = post.user?.profile?.name ?? post.user?.email ?? 'Unknown';

  const like = useMutation({
    mutationFn: () => api.post(`/posts/${post.id}/like`),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['feed'] });
      const prev = qc.getQueryData<InfiniteData<FeedPage>>(['feed']);
      qc.setQueryData<InfiniteData<FeedPage>>(['feed'], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) =>
            page.map((p) => (p.id === post.id ? { ...p, likesCount: p.likesCount + 1 } : p)),
          ),
        };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['feed'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });

  const del = useMutation({
    mutationFn: () => api.delete(`/posts/${post.id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });

  return (
    <article className="card">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
          {initials(displayName)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            {profileId ? (
              <Link
                href={`/profile/${profileId}`}
                className="text-sm font-medium text-white truncate hover:text-brand-500 transition-colors"
              >
                {displayName}
              </Link>
            ) : (
              <span className="text-sm font-medium text-white truncate">{displayName}</span>
            )}
            <span className="text-xs text-gray-500 shrink-0">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Content */}
          <p className="mt-2 text-sm text-gray-200 whitespace-pre-wrap break-words leading-relaxed">
            {post.content}
          </p>

          {/* Actions */}
          <div className="mt-3 flex items-center gap-4">
            <button
              onClick={() => like.mutate()}
              disabled={like.isPending}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-500 transition-colors disabled:opacity-50"
            >
              <Heart className="w-4 h-4" />
              <span>{post.likesCount}</span>
            </button>

            <button
              onClick={() => setShowComments((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-500 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{post.commentsCount}</span>
              {showComments ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            {isOwn && (
              <button
                onClick={() => del.mutate()}
                disabled={del.isPending}
                className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
              >
                {del.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {showComments && <CommentThread postId={post.id} />}
        </div>
      </div>
    </article>
  );
}

// ─── Create post form ─────────────────────────────────────────────────────────

function CreatePostForm() {
  const [content, setContent] = useState('');
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (body: { content: string }) => api.post('/posts', body),
    onSuccess: () => {
      setContent('');
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    create.mutate({ content: trimmed });
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <textarea
        className="input w-full resize-none h-20 text-sm"
        placeholder="Share something with the community…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={2000}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{content.length} / 2000</span>
        <button
          type="submit"
          disabled={!content.trim() || create.isPending}
          className="btn-primary text-sm flex items-center gap-2 px-4 py-2 disabled:opacity-50"
        >
          {create.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {create.isPending ? 'Posting…' : 'Post'}
        </button>
      </div>
    </form>
  );
}

// ─── Feed page ────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const { isAuthenticated, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery<FeedPage>({
      queryKey: ['feed'],
      queryFn: ({ pageParam }) =>
        api.get(`/feed?page=${pageParam}&limit=${PAGE_SIZE}`).then((r) => r.data),
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined,
      enabled: isAuthenticated,
    });

  if (!isAuthenticated) return null;

  const posts = data?.pages.flat() ?? [];

  return (
    <AppShell>
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        <CreatePostForm />

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        )}

        {isError && (
          <p className="text-center text-sm text-red-400 py-8">
            Failed to load posts. Please try again.
          </p>
        )}

        {!isLoading && posts.length === 0 && !isError && (
          <p className="text-center text-sm text-gray-500 py-12">
            No posts yet. Be the first to share something.
          </p>
        )}

        {posts.map((post) => (
          <PostCard key={post.id} post={post} currentUserId={userId} />
        ))}

        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="btn-secondary w-full text-sm py-2.5 flex items-center justify-center gap-2"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </>
            ) : (
              'Load more'
            )}
          </button>
        )}
      </div>
    </AppShell>
  );
}
