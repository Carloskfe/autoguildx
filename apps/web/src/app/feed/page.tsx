'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  Trash2,
  Send,
  Loader2,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  X,
  Repeat2,
  Globe,
  Users,
  Lock,
  LayoutGrid,
  GalleryHorizontal,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { uploadFile } from '@/lib/upload';
import type { Post, Comment } from '@autoguildx/shared';

interface PostWithUser extends Post {
  user?: {
    id: string;
    email: string;
    role: string;
    profile?: { id: string; name: string };
  };
  sharedPost?: PostWithUser;
  sharesCount?: number;
  visibility?: string;
  mediaMode?: string;
  linkUrl?: string;
  linkPreviewType?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

function countUrls(text: string): number {
  return (text.match(/https?:\/\/[^\s]+/g) ?? []).length;
}

function Linkified({ text }: { text: string }) {
  const urlRegex = /https?:\/\/[^\s]+/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = urlRegex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    nodes.push(
      <a
        key={m.index}
        href={m[0]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand-500 hover:underline break-all"
      >
        {m[0]}
      </a>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

function MediaCarousel({ urls }: { urls: string[] }) {
  const [idx, setIdx] = useState(0);
  if (!urls.length) return null;
  return (
    <div className="relative mt-2 rounded-lg overflow-hidden bg-black select-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={urls[idx]} alt="" className="w-full object-cover max-h-80" />
      {urls.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + urls.length) % urls.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % urls.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {urls.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MediaGrid({ urls }: { urls: string[] }) {
  const shown = urls.slice(0, 4);
  const extra = urls.length - 4;
  return (
    <div
      className={`mt-2 grid gap-1 rounded-lg overflow-hidden ${shown.length === 1 ? '' : shown.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}
    >
      {shown.map((url, i) => (
        <div key={i} className={`relative ${shown.length === 3 && i === 0 ? 'row-span-2' : ''}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="w-full h-40 object-cover" />
          {i === 3 && extra > 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xl">
              +{extra}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const REACTIONS = [
  { key: 'fire', emoji: '🔥', label: 'Fire' },
  { key: 'love', emoji: '❤️', label: 'Love' },
  { key: 'respect', emoji: '🔧', label: 'Respect' },
  { key: 'wild', emoji: '😮', label: 'Wild' },
  { key: 'like', emoji: '👍', label: 'Like' },
] as const;

const VISIBILITY_OPTIONS = [
  { key: 'public', label: 'Public', Icon: Globe },
  { key: 'followers', label: 'Followers', Icon: Users },
  { key: 'private', label: 'Only me', Icon: Lock },
] as const;

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
  const [showReactions, setShowReactions] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareComment, setShareComment] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const qc = useQueryClient();
  const isOwn = currentUserId === post.userId;
  const profileId = post.user?.profile?.id;
  const displayName = post.user?.profile?.name ?? post.user?.email ?? 'Unknown';

  // Load reactions on mount
  useEffect(() => {
    api.get(`/posts/${post.id}/reactions`).then((r) => setReactionCounts(r.data.counts ?? {}));
    if (currentUserId) {
      api
        .get(`/posts/${post.id}/my-reaction`)
        .then((r) => setMyReaction(r.data?.emoji ?? null))
        .catch(() => {});
    }
  }, [post.id, currentUserId]);

  const handleReact = async (emoji: string) => {
    setShowReactions(false);
    if (myReaction === emoji) {
      setMyReaction(null);
      setReactionCounts((c) => ({ ...c, [emoji]: Math.max(0, (c[emoji] ?? 1) - 1) }));
      await api.delete(`/posts/${post.id}/react`);
    } else {
      if (myReaction) {
        setReactionCounts((c) => ({ ...c, [myReaction]: Math.max(0, (c[myReaction] ?? 1) - 1) }));
      }
      setMyReaction(emoji);
      setReactionCounts((c) => ({ ...c, [emoji]: (c[emoji] ?? 0) + 1 }));
      await api.post(`/posts/${post.id}/react`, { emoji });
    }
  };

  const handleQuickShare = async () => {
    setShowShareMenu(false);
    await api.post(`/posts/${post.id}/share`);
    qc.invalidateQueries({ queryKey: ['feed'] });
  };

  const handleShareWithComment = async () => {
    if (!shareComment.trim()) return;
    await api.post(`/posts/${post.id}/share`, { content: shareComment.trim() });
    setShareComment('');
    setShowShareModal(false);
    qc.invalidateQueries({ queryKey: ['feed'] });
  };

  const del = useMutation({
    mutationFn: () => api.delete(`/posts/${post.id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });

  const topReactions = Object.entries(reactionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);
  const totalReactions = Object.values(reactionCounts).reduce((s, c) => s + c, 0);
  const myReactionObj = REACTIONS.find((r) => r.key === myReaction);

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
            <Linkified text={post.content} />
          </p>

          {/* Media */}
          {post.mediaUrls?.filter(Boolean).length > 0 &&
            (post.mediaMode === 'carousel' ? (
              <MediaCarousel urls={post.mediaUrls.filter(Boolean)} />
            ) : post.mediaMode === 'multi' ? (
              <MediaGrid urls={post.mediaUrls.filter(Boolean)} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.mediaUrls[0]}
                alt=""
                className="mt-2 w-full rounded-lg object-cover max-h-80"
              />
            ))}

          {/* YouTube / link preview */}
          {post.linkUrl &&
            !post.sharedPostId &&
            (post.linkPreviewType === 'youtube' && extractYouTubeId(post.linkUrl) ? (
              <a
                href={post.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block rounded-lg overflow-hidden border border-surface-border hover:border-brand-500 transition-colors group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.youtube.com/vi/${extractYouTubeId(post.linkUrl)}/hqdefault.jpg`}
                  alt="YouTube preview"
                  className="w-full object-cover max-h-48"
                />
                <div className="flex items-center gap-2 px-3 py-2 bg-surface-card">
                  <span className="text-red-500 text-xs font-bold">▶ YouTube</span>
                  <span className="text-xs text-gray-400 truncate flex-1">{post.linkUrl}</span>
                  <ExternalLink className="w-3 h-3 text-gray-500 shrink-0" />
                </div>
              </a>
            ) : (
              <a
                href={post.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg border border-surface-border bg-surface-card hover:border-brand-500 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-xs text-brand-400 truncate">{post.linkUrl}</span>
              </a>
            ))}

          {/* Shared post preview */}
          {post.sharedPost && (
            <div className="mt-2 border border-surface-border rounded-lg p-3 bg-surface-card text-sm">
              <p className="text-xs text-gray-500 mb-1">
                {post.sharedPost.user?.profile?.name ?? post.sharedPost.user?.email ?? 'Unknown'}
              </p>
              <p className="text-gray-300 line-clamp-3">{post.sharedPost.content}</p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center gap-3 relative">
            {/* Reaction button */}
            <div className="relative">
              {showReactions && (
                <div className="absolute bottom-8 left-0 flex items-center gap-1 bg-surface-card border border-surface-border rounded-full px-2 py-1 shadow-lg z-10">
                  {REACTIONS.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => handleReact(r.key)}
                      title={r.label}
                      className="text-lg hover:scale-125 transition-transform"
                    >
                      {r.emoji}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowReactions((v) => !v)}
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
                className={`flex items-center gap-1.5 text-xs transition-colors ${myReaction ? 'text-brand-500' : 'text-gray-400 hover:text-brand-500'}`}
              >
                <span className="text-sm">{myReactionObj ? myReactionObj.emoji : '👍'}</span>
                <span className="flex items-center gap-0.5">
                  {topReactions.map(([key]) => {
                    const r = REACTIONS.find((x) => x.key === key);
                    return r ? (
                      <span key={key} className="text-xs">
                        {r.emoji}
                      </span>
                    ) : null;
                  })}
                  {totalReactions > 0 && <span>{totalReactions}</span>}
                </span>
              </button>
            </div>

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

            {/* Share */}
            {post.visibility !== 'private' && (
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu((v) => !v)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-500 transition-colors"
                >
                  <Repeat2 className="w-4 h-4" />
                  <span>{post.sharesCount ?? 0}</span>
                </button>
                {showShareMenu && (
                  <div className="absolute bottom-7 left-0 bg-surface-card border border-surface-border rounded-lg shadow-lg z-10 min-w-[160px] py-1">
                    <button
                      onClick={handleQuickShare}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-surface-border hover:text-white transition-colors"
                    >
                      Quick Share
                    </button>
                    <button
                      onClick={() => {
                        setShowShareMenu(false);
                        setShowShareModal(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-surface-border hover:text-white transition-colors"
                    >
                      Share with comment
                    </button>
                  </div>
                )}
              </div>
            )}

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

          {/* Share with comment modal */}
          {showShareModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
              <div className="card w-full max-w-md space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-white">Share with comment</h2>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="border border-surface-border rounded-lg p-3 text-sm text-gray-400 line-clamp-2">
                  {post.content}
                </div>
                <textarea
                  value={shareComment}
                  onChange={(e) => setShareComment(e.target.value)}
                  placeholder="Add your take…"
                  rows={3}
                  className="input w-full text-sm resize-none"
                  maxLength={2000}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="btn-secondary text-sm px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleShareWithComment}
                    disabled={!shareComment.trim()}
                    className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
                  >
                    Share
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Create post form ─────────────────────────────────────────────────────────

type MediaMode = 'single' | 'multi' | 'carousel';

function CreatePostForm() {
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaMode, setMediaMode] = useState<MediaMode>('single');
  const [uploading, setUploading] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const urlCount = countUrls(content);
  const tooManyLinks = urlCount > 1;
  const detectedYtId =
    urlCount === 1 && content.match(/https?:\/\/[^\s]+/)
      ? extractYouTubeId(content.match(/https?:\/\/[^\s]+/)![0])
      : null;

  const maxImages = mediaMode === 'single' ? 1 : 9;

  const create = useMutation({
    mutationFn: (body: {
      content: string;
      mediaUrls?: string[];
      visibility: string;
      mediaMode: string;
    }) => api.post('/posts', body),
    onSuccess: () => {
      setContent('');
      setMediaUrls([]);
      setMediaMode('single');
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, maxImages - mediaUrls.length);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map((f) => uploadFile(f)));
      setMediaUrls((prev) => [...prev, ...urls].slice(0, maxImages));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  const removeImage = (i: number) => setMediaUrls((prev) => prev.filter((_, idx) => idx !== i));

  const switchMode = (mode: MediaMode) => {
    setMediaMode(mode);
    if (mode === 'single') setMediaUrls((prev) => prev.slice(0, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || tooManyLinks) return;
    create.mutate({
      content: trimmed,
      visibility,
      mediaMode,
      ...(mediaUrls.length ? { mediaUrls } : {}),
    });
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

      {/* YouTube preview (compose) */}
      {detectedYtId && (
        <div className="rounded-lg overflow-hidden border border-surface-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://img.youtube.com/vi/${detectedYtId}/hqdefault.jpg`}
            alt="YouTube preview"
            className="w-full object-cover max-h-36"
          />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-card">
            <span className="text-red-500 text-xs font-bold">▶ YouTube</span>
            <span className="text-xs text-gray-500 truncate">Preview</span>
          </div>
        </div>
      )}

      {tooManyLinks && <p className="text-xs text-red-400">Only 1 link per post is allowed.</p>}

      {/* Image previews */}
      {mediaUrls.length > 0 && (
        <div className={`grid gap-1 ${mediaUrls.length > 1 ? 'grid-cols-3' : ''}`}>
          {mediaUrls.map((url, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-24 object-cover rounded-lg" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center hover:bg-black/90"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {/* Media mode toolbar */}
        <div className="flex items-center gap-1 border border-surface-border rounded-lg p-0.5">
          {(
            [
              { mode: 'single' as MediaMode, Icon: ImageIcon, title: 'Single photo' },
              { mode: 'multi' as MediaMode, Icon: LayoutGrid, title: 'Photo grid' },
              { mode: 'carousel' as MediaMode, Icon: GalleryHorizontal, title: 'Carousel' },
            ] as const
          ).map(({ mode, Icon, title }) => (
            <button
              key={mode}
              type="button"
              title={title}
              onClick={() => switchMode(mode)}
              className={`p-1.5 rounded transition-colors ${
                mediaMode === mode ? 'bg-brand-500 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={uploading || mediaUrls.length >= maxImages}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-500 transition-colors disabled:opacity-40"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ImageIcon className="w-4 h-4" />
          )}
          {uploading
            ? 'Uploading…'
            : mediaUrls.length > 0
              ? `Add photo (${mediaUrls.length}/${maxImages})`
              : 'Photo'}
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple={mediaMode !== 'single'}
          className="sr-only"
          onChange={handleImagePick}
        />

        <span className="text-xs text-gray-500">{content.length} / 2000</span>

        {/* Visibility picker */}
        <div className="flex items-center ml-auto">
          {VISIBILITY_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setVisibility(opt.key)}
              title={opt.label}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
                visibility === opt.key
                  ? 'bg-brand-500/20 text-brand-500 border border-brand-500/40'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <opt.Icon className="w-3 h-3" />
              {visibility === opt.key && <span>{opt.label}</span>}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={!content.trim() || tooManyLinks || create.isPending || uploading}
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
