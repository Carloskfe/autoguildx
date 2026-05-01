'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

export default function NewForumPostPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const createMutation = useMutation({
    mutationFn: (body: object) => api.post(`/forums/${slug}/posts`, body),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts', slug] });
      router.push(`/agxtopics/${slug}/${res.data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ title, content });
  };

  if (!isAuthenticated) return null;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link
          href={`/agxtopics/${slug}`}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm"
        >
          <ArrowLeft size={16} />
          Back to topic
        </Link>

        <h1 className="text-2xl font-bold text-white mb-6">Create Post</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title</label>
            <input
              className="input w-full"
              placeholder="Post title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={300}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Content</label>
            <textarea
              className="input w-full resize-none"
              rows={8}
              placeholder="What do you want to share?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              maxLength={10000}
            />
          </div>

          {createMutation.isError && (
            <p className="text-red-400 text-sm">
              {(createMutation.error as any)?.response?.data?.message ?? 'Failed to post.'}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary flex-1"
            >
              {createMutation.isPending ? 'Posting…' : 'Post'}
            </button>
            <Link href={`/agxtopics/${slug}`} className="btn-secondary px-6 text-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
