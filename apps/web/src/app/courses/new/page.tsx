'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Loader2, X } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { uploadFile } from '@/lib/upload';

const SPECIALTY_TAGS = [
  'Engine',
  'Suspension',
  'Brakes',
  'Electrical',
  'Bodywork',
  'Fabrication',
  'Restoration',
  'Performance',
  'Diagnostics',
  'Transmission',
  'Exhaust',
  'Turbo/Supercharger',
  'Welding',
  'Paint',
  'Interior',
];

export default function NewCoursePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [tags, setTags] = useState<string[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const create = useMutation({
    mutationFn: (data: object) => api.post('/courses', data).then((r) => r.data),
    onSuccess: (course) => router.push(`/courses/${course.id}`),
  });

  async function handleThumbnail(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setThumbnailUrl(url);
    } finally {
      setUploading(false);
    }
  }

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    create.mutate({
      title,
      description,
      price: parseFloat(price) || 0,
      tags,
      thumbnailUrl: thumbnailUrl || undefined,
    });
  }

  if (!isAuthenticated) return null;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-white mb-6">Create Course</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Engine Rebuild Fundamentals"
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="What will students learn?"
              className="input w-full resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Thumbnail</label>
            {thumbnailUrl ? (
              <div className="relative inline-block">
                <img
                  src={thumbnailUrl}
                  alt="thumbnail"
                  className="w-40 h-28 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setThumbnailUrl('')}
                  className="absolute -top-2 -right-2 bg-surface-card border border-surface-border rounded-full p-0.5"
                >
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <div className="border border-dashed border-surface-border rounded-lg px-4 py-6 text-center text-sm text-gray-400 hover:border-gray-500">
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    'Click to upload thumbnail'
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleThumbnail} />
              </label>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Price (USD)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input w-40"
            />
            <p className="text-xs text-gray-500 mt-1">Set to 0 for a free course.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {SPECIALTY_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    tags.includes(tag)
                      ? 'bg-brand-500 border-brand-500 text-white'
                      : 'border-surface-border text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!title.trim() || create.isPending}
              className="btn-primary px-6 py-2 flex items-center gap-2 disabled:opacity-50"
            >
              {create.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Course
            </button>
            <button type="button" onClick={() => router.back()} className="btn-secondary px-6 py-2">
              Cancel
            </button>
          </div>

          {create.isError && (
            <p className="text-red-400 text-sm">Failed to create course. Please try again.</p>
          )}
        </form>
      </div>
    </AppShell>
  );
}
