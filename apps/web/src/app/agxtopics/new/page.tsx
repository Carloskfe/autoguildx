'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

const CATEGORIES = ['tech', 'classics', 'mods', 'racing', 'buying-selling', 'general'];

export default function NewTopicPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [rules, setRules] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!slugTouched && name) {
      setSlug(
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
      );
    }
  }, [name, slugTouched]);

  const createMutation = useMutation({
    mutationFn: (body: object) => api.post('/forums', body),
    onSuccess: (res) => router.push(`/agxtopics/${res.data.slug}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ name, slug, description, category, rules: rules || undefined });
  };

  if (!isAuthenticated) return null;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link
          href="/agxtopics"
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm"
        >
          <ArrowLeft size={16} />
          Back to AGXTopics
        </Link>

        <h1 className="text-2xl font-bold text-white mb-6">Create a Topic</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input
              className="input w-full"
              placeholder="e.g. Classic Car Collectors"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Slug (URL-safe)</label>
            <input
              className="input w-full font-mono text-sm"
              placeholder="classic-car-collectors"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
              }}
              required
              pattern="[a-z0-9-]+"
            />
            <p className="text-xs text-gray-500 mt-1">/agxtopics/{slug || '...'}</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              className="input w-full resize-none"
              rows={3}
              placeholder="What is this topic about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              maxLength={2000}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Category</label>
            <select
              className="input w-full"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Rules (optional)</label>
            <textarea
              className="input w-full resize-none"
              rows={4}
              placeholder="Community guidelines…"
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              maxLength={5000}
            />
          </div>

          {createMutation.isError && (
            <p className="text-red-400 text-sm">
              {(createMutation.error as any)?.response?.data?.message ?? 'Failed to create topic.'}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary flex-1"
            >
              {createMutation.isPending ? 'Creating…' : 'Create Topic'}
            </button>
            <Link href="/agxtopics" className="btn-secondary px-6 text-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
