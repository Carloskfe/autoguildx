'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, X, Plus, GraduationCap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { uploadFile } from '@/lib/upload';
import type { Course } from '@autoguildx/shared';

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

interface CourseDetail extends Course {
  lessons: any[];
  enrollment: any;
  completedLessonIds: string[];
}

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, userId } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  const [initialized, setInitialized] = useState(false);
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

  const {
    data: course,
    isLoading,
    isError,
  } = useQuery<CourseDetail>({
    queryKey: ['course', id],
    queryFn: () => api.get(`/courses/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  useEffect(() => {
    if (course && !initialized) {
      setTitle(course.title ?? '');
      setDescription(course.description ?? '');
      setPrice(String(course.price ?? 0));
      setLevel(course.level ?? 'All Levels');
      setTags(course.tags?.filter(Boolean) ?? []);
      setObjectives(course.objectives?.filter(Boolean) ?? []);
      setRequirements(course.requirements?.filter(Boolean) ?? []);
      setThumbnailUrl(course.thumbnailUrl ?? '');
      setPreviewVideoUrl(course.previewVideoUrl ?? '');
      setInitialized(true);
    }
  }, [course, initialized]);

  useEffect(() => {
    if (course && userId && course.instructorId !== userId) {
      router.replace(`/courses/${id}`);
    }
  }, [course, userId, id, router]);

  async function handleThumbnail(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      setThumbnailUrl(await uploadFile(file));
    } finally {
      setUploading(false);
    }
  }

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  const update = useMutation({
    mutationFn: (data: object) => api.patch(`/courses/${id}`, data).then((r) => r.data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['course', id] });
      qc.invalidateQueries({ queryKey: ['my-courses'] });
      qc.invalidateQueries({ queryKey: ['courses'] });
      router.push(`/courses/${updated.id}`);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    update.mutate({
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

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      </AppShell>
    );
  }

  if (isError || !course) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto px-4 py-12 text-center text-gray-400 text-sm">
          Course not found.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href={`/courses/${id}`}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Edit Course</h1>
            <p className="text-xs text-gray-400">Update your course details and content</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basics */}
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
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
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
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${level === l ? 'bg-brand-500 border-brand-500 text-white font-medium' : 'border-surface-border text-gray-400 hover:border-gray-500'}`}
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

          {/* Thumbnail */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide border-b border-surface-border pb-2">
              Course Thumbnail
            </h2>
            {thumbnailUrl ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
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
                    </>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleThumbnail} />
              </label>
            )}
          </section>

          {/* Preview video */}
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

          {/* Learning outcomes */}
          <section className="space-y-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide border-b border-surface-border pb-2">
              Learning Outcomes
            </h2>
            <ListEditor
              label="What students will learn"
              placeholder="e.g. Disassemble and reassemble an engine"
              items={objectives}
              onChange={setObjectives}
            />
            <ListEditor
              label="Requirements / prerequisites"
              placeholder="e.g. Basic mechanical knowledge"
              items={requirements}
              onChange={setRequirements}
            />
          </section>

          {/* Tags */}
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
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${tags.includes(tag) ? 'bg-brand-500 border-brand-500 text-white font-medium' : 'border-surface-border text-gray-400 hover:border-gray-500'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>

          {/* Submit */}
          <div className="flex gap-3 pt-2 border-t border-surface-border">
            <button
              type="submit"
              disabled={!title.trim() || update.isPending}
              className="btn-primary px-8 py-2.5 flex items-center gap-2 disabled:opacity-50 font-semibold"
            >
              {update.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary px-6 py-2.5"
            >
              Cancel
            </button>
          </div>
          {update.isError && (
            <p className="text-red-400 text-sm">Failed to save. Please try again.</p>
          )}
        </form>
      </div>
    </AppShell>
  );
}
