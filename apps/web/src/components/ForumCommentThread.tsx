'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowUp, ArrowDown, Reply, SmilePlus } from 'lucide-react';
import api from '@/lib/api';
import type { ForumComment } from '@autoguildx/shared';

const EMOJIS: { key: string; label: string }[] = [
  { key: 'fire', label: '🔥' },
  { key: 'love', label: '❤️' },
  { key: 'respect', label: '🔧' },
  { key: 'wild', label: '😮' },
  { key: 'like', label: '👍' },
];

interface CommentRowProps {
  comment: ForumComment;
  depth?: number;
  isAuthenticated: boolean;
  forumPostId: string;
  invalidateKey: string[];
}

function CommentRow({
  comment,
  depth = 0,
  isAuthenticated,
  forumPostId,
  invalidateKey,
}: CommentRowProps) {
  const queryClient = useQueryClient();
  const [showReply, setShowReply] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [replyText, setReplyText] = useState('');

  const voteMutation = useMutation({
    mutationFn: ({ value }: { value: 1 | -1 }) =>
      api.post(`/comments/${comment.id}/vote`, { value }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invalidateKey }),
  });

  const removeVoteMutation = useMutation({
    mutationFn: () => api.delete(`/comments/${comment.id}/vote`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invalidateKey }),
  });

  const reactMutation = useMutation({
    mutationFn: (emoji: string) => api.post(`/comments/${comment.id}/react`, { emoji }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateKey });
      setShowReactions(false);
    },
  });

  const replyMutation = useMutation({
    mutationFn: (content: string) =>
      api.post(`/forums/_/posts/${forumPostId}/comments`, {
        content,
        parentId: comment.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateKey });
      setReplyText('');
      setShowReply(false);
    },
  });

  const handleVote = (value: 1 | -1) => {
    if ((comment as any).myVote === value) {
      removeVoteMutation.mutate();
    } else {
      voteMutation.mutate({ value });
    }
  };

  const myVote = (comment as any).myVote ?? null;

  return (
    <div className={`flex gap-3 ${depth > 0 ? 'ml-8 border-l border-surface-700 pl-4' : ''}`}>
      <div className="flex flex-col items-center gap-0.5 shrink-0 pt-1">
        <button
          onClick={() => isAuthenticated && handleVote(1)}
          className={`p-0.5 rounded transition-colors ${
            myVote === 1 ? 'text-brand-500' : 'text-gray-600 hover:text-brand-400'
          }`}
        >
          <ArrowUp size={14} />
        </button>
        <span
          className={`text-xs font-bold tabular-nums ${
            comment.voteScore > 0
              ? 'text-brand-400'
              : comment.voteScore < 0
                ? 'text-red-400'
                : 'text-gray-500'
          }`}
        >
          {comment.voteScore}
        </span>
        <button
          onClick={() => isAuthenticated && handleVote(-1)}
          className={`p-0.5 rounded transition-colors ${
            myVote === -1 ? 'text-red-400' : 'text-gray-600 hover:text-red-400'
          }`}
        >
          <ArrowDown size={14} />
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-brand-400">
            {(comment as any).user?.name ?? 'User'}
          </span>
          <span className="text-xs text-gray-600">
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
        </div>
        <p className="text-gray-300 text-sm mb-2">{comment.content}</p>

        <div className="flex items-center gap-3">
          {isAuthenticated && depth === 0 && (
            <button
              onClick={() => setShowReply((v) => !v)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <Reply size={12} />
              Reply
            </button>
          )}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setShowReactions((v) => !v)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                <SmilePlus size={12} />
                React
              </button>
              {showReactions && (
                <div className="absolute bottom-6 left-0 bg-surface-800 border border-surface-600 rounded-lg p-2 flex gap-2 z-10 shadow-xl">
                  {EMOJIS.map((e) => (
                    <button
                      key={e.key}
                      onClick={() => reactMutation.mutate(e.key)}
                      className="text-lg hover:scale-125 transition-transform"
                      title={e.key}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {showReply && (
          <div className="mt-3 flex gap-2">
            <input
              className="input flex-1 text-sm py-1.5"
              placeholder="Write a reply…"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && replyText.trim()) {
                  e.preventDefault();
                  replyMutation.mutate(replyText.trim());
                }
              }}
            />
            <button
              onClick={() => replyText.trim() && replyMutation.mutate(replyText.trim())}
              disabled={replyMutation.isPending}
              className="btn-primary text-sm px-3 py-1.5"
            >
              Reply
            </button>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <CommentRow
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                isAuthenticated={isAuthenticated}
                forumPostId={forumPostId}
                invalidateKey={invalidateKey}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ForumCommentThreadProps {
  comments: ForumComment[];
  isAuthenticated: boolean;
  forumPostId: string;
  forumSlug: string;
  isLocked?: boolean;
  invalidateKey: string[];
}

export default function ForumCommentThread({
  comments,
  isAuthenticated,
  forumPostId,
  forumSlug,
  isLocked,
  invalidateKey,
}: ForumCommentThreadProps) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');

  const createMutation = useMutation({
    mutationFn: (content: string) =>
      api.post(`/forums/${forumSlug}/posts/${forumPostId}/comments`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateKey });
      setNewComment('');
    },
  });

  return (
    <div>
      <h3 className="text-white font-semibold mb-4">
        {comments.length} Comment{comments.length !== 1 ? 's' : ''}
      </h3>

      {isAuthenticated && !isLocked && (
        <div className="flex gap-3 mb-6">
          <input
            className="input flex-1 text-sm"
            placeholder="Add a comment…"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && newComment.trim()) {
                e.preventDefault();
                createMutation.mutate(newComment.trim());
              }
            }}
          />
          <button
            onClick={() => newComment.trim() && createMutation.mutate(newComment.trim())}
            disabled={createMutation.isPending || !newComment.trim()}
            className="btn-primary text-sm px-4"
          >
            Post
          </button>
        </div>
      )}

      {isLocked && (
        <p className="text-yellow-500 text-sm mb-4">🔒 This post is locked. No new comments.</p>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentRow
            key={comment.id}
            comment={comment}
            isAuthenticated={isAuthenticated}
            forumPostId={forumPostId}
            invalidateKey={invalidateKey}
          />
        ))}
      </div>
    </div>
  );
}
