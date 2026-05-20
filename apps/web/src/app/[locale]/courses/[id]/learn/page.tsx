'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Award,
  Loader2,
  Plus,
  Trash2,
  Check,
  X,
  Play,
  FileText,
  ArrowLeft,
  Pencil,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { Course, Lesson, Enrollment } from '@autoguildx/shared';

interface CourseDetail extends Course {
  lessons: Lesson[];
  enrollment: Enrollment | null;
  completedLessonIds: string[];
}

function groupBySections(lessons: Lesson[]): { section: string; lessons: Lesson[] }[] {
  const map = new Map<string, Lesson[]>();
  for (const l of lessons) {
    const key = l.section || 'Course Content';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(l);
  }
  return Array.from(map.entries()).map(([section, lessons]) => ({ section, lessons }));
}

export default function LearnPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, userId } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  const { data: course, isLoading } = useQuery<CourseDetail>({
    queryKey: ['course', id],
    queryFn: () => api.get(`/courses/${id}`).then((r) => r.data),
    enabled: isAuthenticated,
  });

  const lessons = course?.lessons ?? [];
  const [activeLessonId, setActiveLessonId] = useState<string | null>(searchParams.get('lesson'));
  const [activeTab, setActiveTab] = useState<'overview' | 'resources'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    if (window.innerWidth >= 768) setSidebarOpen(true);
  }, []);

  useEffect(() => {
    if (!activeLessonId && lessons.length > 0) {
      const firstIncomplete = lessons.find(
        (l) => !(course?.completedLessonIds ?? []).includes(l.id),
      );
      setActiveLessonId(firstIncomplete?.id ?? lessons[0]?.id ?? null);
    }
  }, [lessons.length]);

  const activeLesson = lessons.find((l) => l.id === activeLessonId) ?? lessons[0] ?? null;
  const activeIdx = activeLesson ? lessons.indexOf(activeLesson) : -1;
  const isOwner = userId === course?.instructorId;
  const isEnrolled = !!course?.enrollment || isOwner;
  const sections = groupBySections(lessons);

  // Track open sections
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['Course Content']));
  useEffect(() => {
    if (sections.length > 0) {
      setOpenSections(new Set(sections.map((s) => s.section)));
    }
  }, [sections.length]);

  const toggleSection = (name: string) =>
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  // ── Complete lesson ──────────────────────────────────────────────────────────
  const complete = useMutation({
    mutationFn: (lessonId: string) =>
      api.post(`/courses/${id}/lessons/${lessonId}/complete`).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['course', id] });
      if (data.certificateIssued) qc.invalidateQueries({ queryKey: ['courseCert', id] });
    },
  });

  // ── Add / delete / edit lesson (instructor) ─────────────────────────────────
  const [addingLesson, setAddingLesson] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newVideo, setNewVideo] = useState('');
  const [newSection, setNewSection] = useState('');

  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editVideo, setEditVideo] = useState('');
  const [editDuration, setEditDuration] = useState('');

  function startEdit(lesson: {
    id: string;
    title: string;
    content?: string;
    videoUrl?: string;
    durationMinutes?: number;
  }) {
    setEditingLessonId(lesson.id);
    setEditTitle(lesson.title);
    setEditContent(lesson.content ?? '');
    setEditVideo(lesson.videoUrl ?? '');
    setEditDuration(String(lesson.durationMinutes ?? 0));
  }

  const editLesson = useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: string; data: object }) =>
      api.patch(`/courses/${id}/lessons/${lessonId}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course', id] });
      setEditingLessonId(null);
    },
  });

  const addLesson = useMutation({
    mutationFn: () =>
      api
        .post(`/courses/${id}/lessons`, {
          title: newTitle,
          content: newContent || undefined,
          videoUrl: newVideo || undefined,
          section: newSection || undefined,
        })
        .then((r) => r.data),
    onSuccess: (lesson) => {
      qc.invalidateQueries({ queryKey: ['course', id] });
      setAddingLesson(false);
      setNewTitle('');
      setNewContent('');
      setNewVideo('');
      setNewSection('');
      setActiveLessonId(lesson.id);
    },
  });

  const deleteLesson = useMutation({
    mutationFn: (lessonId: string) => api.delete(`/courses/${id}/lessons/${lessonId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course', id] });
      setActiveLessonId(lessons[0]?.id ?? null);
    },
  });

  // Progress
  const completedCount = (course?.completedLessonIds ?? []).length;
  const progressPct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
  const isDone = activeLesson
    ? (course?.completedLessonIds ?? []).includes(activeLesson.id)
    : false;

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!course || (!isEnrolled && !isOwner)) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-sm">
          {!course ? 'Course not found.' : 'Enroll to access this course.'}
        </p>
        <Link href={`/courses/${id}`} className="btn-primary text-sm px-6 py-2">
          Go to Course
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      {/* ── Top navbar ──────────────────────────────────────────────────────── */}
      <header className="h-14 bg-gray-950 border-b border-surface-border flex items-center px-4 gap-4 shrink-0 z-10">
        <Link
          href={`/courses/${id}`}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </Link>

        <div className="h-4 w-px bg-gray-700 shrink-0" />

        <p className="text-sm font-semibold text-white truncate flex-1 min-w-0">{course.title}</p>

        {/* Progress bar */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <div className="w-40 bg-gray-800 rounded-full h-1.5">
            <div
              className="bg-brand-500 h-1.5 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 w-8 text-right">{progressPct}%</span>
        </div>

        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="text-xs text-gray-400 hover:text-white border border-surface-border rounded px-2.5 py-1 transition-colors shrink-0"
        >
          <span className="md:hidden">Lessons</span>
          <span className="hidden md:inline">{sidebarOpen ? 'Hide' : 'Show'} lessons</span>
        </button>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Main content ──────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          {!activeLesson ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-500 text-sm">
              <p>No lessons yet.</p>
              {isOwner && (
                <button
                  onClick={() => setAddingLesson(true)}
                  className="btn-primary text-sm px-4 py-2"
                >
                  Add First Lesson
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Video / content area */}
              <div className="bg-black">
                {activeLesson.videoUrl ? (
                  <div className="aspect-video max-h-[65vh] w-full">
                    <iframe
                      src={activeLesson.videoUrl
                        .replace('watch?v=', 'embed/')
                        .replace('youtu.be/', 'www.youtube.com/embed/')}
                      className="w-full h-full"
                      allowFullScreen
                      title={activeLesson.title}
                    />
                  </div>
                ) : (
                  <div className="aspect-video max-h-[65vh] w-full flex items-center justify-center bg-gray-900">
                    <FileText className="w-12 h-12 text-gray-700" />
                  </div>
                )}
              </div>

              {/* Lesson header + actions */}
              <div className="px-6 py-5 border-b border-surface-border flex items-start justify-between gap-4">
                <h2 className="text-xl font-bold text-white">{activeLesson.title}</h2>
                <div className="flex items-center gap-2 shrink-0">
                  {isOwner && (
                    <button
                      onClick={() => deleteLesson.mutate(activeLesson.id)}
                      disabled={deleteLesson.isPending}
                      className="text-gray-600 hover:text-red-400 transition-colors p-1"
                      title="Delete lesson"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {isEnrolled && !isOwner && (
                    <button
                      onClick={() => !isDone && complete.mutate(activeLesson.id)}
                      disabled={isDone || complete.isPending}
                      className={`text-sm px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                        isDone ? 'bg-brand-500/20 text-brand-500 cursor-default' : 'btn-primary'
                      }`}
                    >
                      {complete.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isDone ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : null}
                      {isDone ? 'Completed' : 'Mark Complete'}
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-surface-border px-6 gap-6">
                {(['overview', 'resources'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                      activeTab === tab
                        ? 'border-white text-white'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="px-6 py-5 flex-1">
                {activeTab === 'overview' && (
                  <div className="max-w-3xl space-y-4">
                    {activeLesson.content ? (
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {activeLesson.content}
                      </p>
                    ) : (
                      <p className="text-gray-600 text-sm italic">
                        No description for this lesson.
                      </p>
                    )}
                    {activeLesson.durationMinutes > 0 && (
                      <p className="text-xs text-gray-500">
                        Duration: {activeLesson.durationMinutes} minutes
                      </p>
                    )}
                  </div>
                )}
                {activeTab === 'resources' && (
                  <p className="text-gray-600 text-sm italic">No resources attached.</p>
                )}
              </div>

              {/* Certificate banner */}
              {complete.data?.certificateIssued && (
                <div className="mx-6 mb-4 flex items-center gap-3 bg-brand-500/10 border border-brand-500/30 rounded-xl p-4">
                  <Award className="w-6 h-6 text-brand-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      🎉 Course complete — certificate issued!
                    </p>
                    <Link
                      href={`/courses/${id}`}
                      className="text-xs text-brand-500 hover:underline"
                    >
                      View your certificate →
                    </Link>
                  </div>
                </div>
              )}

              {/* Prev / Next */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-surface-border mt-auto">
                <button
                  onClick={() => setActiveLessonId(lessons[activeIdx - 1]?.id)}
                  disabled={activeIdx === 0}
                  className="btn-secondary text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="text-xs text-gray-500">
                  {activeIdx + 1} / {lessons.length}
                </span>
                <button
                  onClick={() => setActiveLessonId(lessons[activeIdx + 1]?.id)}
                  disabled={activeIdx === lessons.length - 1}
                  className="btn-secondary text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-40"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </main>

        {/* ── Curriculum sidebar ─────────────────────────────────────────────── */}
        {sidebarOpen && (
          <aside className="fixed inset-0 z-50 flex flex-col bg-gray-950 md:static md:inset-auto md:z-auto md:w-80 md:shrink-0 md:border-l md:border-surface-border overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border shrink-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Course Content
              </p>
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden p-1 text-gray-400 hover:text-white transition-colors"
                aria-label="Close lessons"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {sections.map((sec) => (
                <div key={sec.section} className="border-b border-surface-border">
                  <button
                    onClick={() => toggleSection(sec.section)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-900 transition-colors"
                  >
                    <span className="text-xs font-semibold text-white text-left line-clamp-2">
                      {sec.section}
                    </span>
                    {openSections.has(sec.section) ? (
                      <ChevronUp className="w-3.5 h-3.5 text-gray-500 shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0 ml-2" />
                    )}
                  </button>

                  {openSections.has(sec.section) && (
                    <ul>
                      {sec.lessons.map((lesson) => {
                        const done = (course.completedLessonIds ?? []).includes(lesson.id);
                        const active = lesson.id === activeLesson?.id;
                        return (
                          <li key={lesson.id}>
                            {editingLessonId === lesson.id ? (
                              <div className="px-3 py-2 space-y-2 bg-gray-900 border-l-2 border-brand-500">
                                <input
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  placeholder="Lesson title *"
                                  className="input w-full text-xs py-1.5"
                                  autoFocus
                                />
                                <textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  placeholder="Content (optional)"
                                  rows={2}
                                  className="input w-full text-xs py-1.5 resize-none"
                                />
                                <input
                                  value={editVideo}
                                  onChange={(e) => setEditVideo(e.target.value)}
                                  placeholder="Video URL (optional)"
                                  className="input w-full text-xs py-1.5"
                                />
                                <input
                                  type="number"
                                  min="0"
                                  value={editDuration}
                                  onChange={(e) => setEditDuration(e.target.value)}
                                  placeholder="Duration (min)"
                                  className="input w-full text-xs py-1.5"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      editTitle.trim() &&
                                      editLesson.mutate({
                                        lessonId: lesson.id,
                                        data: {
                                          title: editTitle.trim(),
                                          content: editContent || undefined,
                                          videoUrl: editVideo || undefined,
                                          durationMinutes: parseInt(editDuration) || 0,
                                        },
                                      })
                                    }
                                    disabled={!editTitle.trim() || editLesson.isPending}
                                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-50"
                                  >
                                    {editLesson.isPending ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Check className="w-3 h-3" />
                                    )}
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingLessonId(null)}
                                    className="btn-secondary text-xs px-2.5 py-1.5"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`flex items-start gap-1 border-l-2 transition-colors ${active ? 'bg-brand-500/10 border-brand-500' : 'hover:bg-gray-900 border-transparent'}`}
                              >
                                <button
                                  onClick={() => setActiveLessonId(lesson.id)}
                                  className="flex-1 text-left px-3 py-3 flex items-start gap-3"
                                >
                                  <span className="mt-0.5 shrink-0">
                                    {done ? (
                                      <CheckCircle2 className="w-4 h-4 text-brand-500" />
                                    ) : lesson.videoUrl ? (
                                      <Play className="w-4 h-4 text-gray-500" />
                                    ) : (
                                      <FileText className="w-4 h-4 text-gray-500" />
                                    )}
                                  </span>
                                  <span className="flex-1 min-w-0">
                                    <span
                                      className={`text-xs leading-snug line-clamp-2 ${active ? 'text-white font-medium' : 'text-gray-400'}`}
                                    >
                                      {lesson.title}
                                    </span>
                                    {lesson.durationMinutes > 0 && (
                                      <span className="block text-xs text-gray-600 mt-0.5">
                                        {lesson.durationMinutes}m
                                      </span>
                                    )}
                                  </span>
                                </button>
                                {isOwner && (
                                  <button
                                    onClick={() => startEdit(lesson)}
                                    className="p-2 mt-2 text-gray-600 hover:text-brand-400 transition-colors shrink-0"
                                    title="Edit lesson"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* Add lesson panel (instructor) */}
            {isOwner && (
              <div className="p-3 border-t border-surface-border shrink-0">
                {addingLesson ? (
                  <div className="space-y-2">
                    <input
                      value={newSection}
                      onChange={(e) => setNewSection(e.target.value)}
                      placeholder="Section name (optional)"
                      className="input w-full text-xs py-1.5"
                    />
                    <input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Lesson title *"
                      className="input w-full text-xs py-1.5"
                      autoFocus
                    />
                    <textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Content (optional)"
                      rows={2}
                      className="input w-full text-xs py-1.5 resize-none"
                    />
                    <input
                      value={newVideo}
                      onChange={(e) => setNewVideo(e.target.value)}
                      placeholder="Video URL (optional)"
                      className="input w-full text-xs py-1.5"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => newTitle.trim() && addLesson.mutate()}
                        disabled={!newTitle.trim() || addLesson.isPending}
                        className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-50"
                      >
                        {addLesson.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        Save
                      </button>
                      <button
                        onClick={() => setAddingLesson(false)}
                        className="btn-secondary text-xs px-2.5 py-1.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingLesson(true)}
                    className="btn-secondary w-full text-xs py-1.5 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Lesson
                  </button>
                )}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
