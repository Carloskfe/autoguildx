'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Loader2, X, Plus, GraduationCap } from 'lucide-react';
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

const LEVELS = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

function ListEditor({
  label,
  placeholder,
  items,
  onChange,
}: {
  label: string;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  function add() {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft('');
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <ul className="space-y-2 mb-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
            <span className="text-brand-500">✓</span>
            <span className="flex-1">{item}</span>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="text-gray-600 hover:text-red-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="input flex-1 text-sm"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="btn-secondary px-3 py-2 disabled:opacity-40"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function NewCoursePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [level, setLevel] = useState('All Levels');
  const [tags, setTags] = useState<string[]>([]);
  const [objectives, setObjectives] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [previewVideoUrl, setPreviewVideoUrl] = useState('');
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
      level,
      tags,
      objectives,
      requirements,
      thumbnailUrl: thumbnailUrl || undefined,
      previewVideoUrl: previewVideoUrl || undefined,
    });
  }

  if (!isAuthenticated) return null;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Create a New Course</h1>
            <p className="text-xs text-gray-400">
              Share your expertise with the AutoGuildX community
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ── Section: Basics ─────────────────────────────────────────────── */}
          <section className="space-y-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide border-b border-surface-border pb-2">
              Course Basics
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Engine Rebuild Fundamentals"
                className="input w-full"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Use a clear, specific title that describes what students will learn.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Describe what this course covers, who it's for, and what students will be able to do after completing it."
                className="input w-full resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Level</label>
                <div className="flex flex-wrap gap-2">
                  {LEVELS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLevel(l)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        level === l
                          ? 'bg-brand-500 border-brand-500 text-white font-medium'
                          : 'border-surface-border text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Price (USD)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="input w-32"
                  />
                  {parseFloat(price) === 0 && (
                    <span className="text-xs text-green-400 font-medium">Free</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ── Section: Thumbnail ──────────────────────────────────────────── */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide border-b border-surface-border pb-2">
              Course Thumbnail
            </h2>
            {thumbnailUrl ? (
              <div className="relative inline-block">
                <img
                  src={thumbnailUrl}
                  alt="thumbnail"
                  className="w-64 aspect-video object-cover rounded-xl border border-surface-border"
                />
                <button
                  type="button"
                  onClick={() => setThumbnailUrl('')}
                  className="absolute -top-2 -right-2 bg-gray-800 border border-surface-border rounded-full p-1 hover:bg-gray-700"
                >
                  <X className="w-3.5 h-3.5 text-gray-300" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer block w-64">
                <div className="aspect-video border-2 border-dashed border-surface-border rounded-xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-gray-500 hover:text-gray-400 transition-colors">
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <GraduationCap className="w-8 h-8" />
                      <span className="text-xs">Upload thumbnail</span>
                      <span className="text-xs text-gray-600">16:9 recommended</span>
                    </>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleThumbnail} />
              </label>
            )}
          </section>

          {/* ── Section: Preview video ─────────────────────────────────────── */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide border-b border-surface-border pb-2">
              Preview Video{' '}
              <span className="text-gray-600 font-normal normal-case">(optional)</span>
            </h2>
            <p className="text-xs text-gray-500">
              A short preview video shown on the course detail page before enrollment.
            </p>
            <input
              className="input text-sm"
              placeholder="Video URL (MP4 or YouTube embed)"
              value={previewVideoUrl}
              onChange={(e) => setPreviewVideoUrl(e.target.value)}
            />
          </section>

          {/* ── Section: Learning outcomes ──────────────────────────────────── */}
          <section className="space-y-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide border-b border-surface-border pb-2">
              Learning Outcomes
            </h2>
            <ListEditor
              label="What students will learn"
              placeholder="e.g. Disassemble and reassemble a complete engine block"
              items={objectives}
              onChange={setObjectives}
            />
            <ListEditor
              label="Requirements / prerequisites"
              placeholder="e.g. Basic understanding of internal combustion engines"
              items={requirements}
              onChange={setRequirements}
            />
          </section>

          {/* ── Section: Tags ───────────────────────────────────────────────── */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide border-b border-surface-border pb-2">
              Category Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {SPECIALTY_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    tags.includes(tag)
                      ? 'bg-brand-500 border-brand-500 text-white font-medium'
                      : 'border-surface-border text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>

          {/* ── Submit ──────────────────────────────────────────────────────── */}
          <div className="flex gap-3 pt-2 border-t border-surface-border">
            <button
              type="submit"
              disabled={!title.trim() || create.isPending}
              className="btn-primary px-8 py-2.5 flex items-center gap-2 disabled:opacity-50 font-semibold"
            >
              {create.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Course
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary px-6 py-2.5"
            >
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
