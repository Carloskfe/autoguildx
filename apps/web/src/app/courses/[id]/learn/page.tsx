'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Award,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { Course, Lesson, Enrollment, Certificate } from '@autoguildx/shared';

interface CourseDetail extends Course {
  lessons: Lesson[];
  enrollment: Enrollment | null;
  completedLessonIds: string[];
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

  // ── Complete lesson ──────────────────────────────────────────────────────────

  const complete = useMutation({
    mutationFn: (lessonId: string) =>
      api.post(`/courses/${id}/lessons/${lessonId}/complete`).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['course', id] });
      qc.invalidateQueries({ queryKey: ['courseProgress', id] });
      if (data.certificateIssued) qc.invalidateQueries({ queryKey: ['courseCert', id] });
    },
  });

  // ── Add lesson (instructor only) ─────────────────────────────────────────────

  const [addingLesson, setAddingLesson] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newVideo, setNewVideo] = useState('');

  const addLesson = useMutation({
    mutationFn: () =>
      api
        .post(`/courses/${id}/lessons`, {
          title: newTitle,
          content: newContent,
          videoUrl: newVideo || undefined,
        })
        .then((r) => r.data),
    onSuccess: (lesson) => {
      qc.invalidateQueries({ queryKey: ['course', id] });
      setAddingLesson(false);
      setNewTitle('');
      setNewContent('');
      setNewVideo('');
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

  if (!course || (!isEnrolled && !isOwner)) {
    return (
      <AppShell>
        <div className="text-center py-20 space-y-3">
          <p className="text-gray-400 text-sm">
            {!course ? 'Course not found.' : 'Enroll to access this course.'}
          </p>
          <Link href={`/courses/${id}`} className="btn-primary text-sm px-6 py-2 inline-block">
            Go to Course
          </Link>
        </div>
      </AppShell>
    );
  }

  const isDone = activeLesson ? (course.completedLessonIds ?? []).includes(activeLesson.id) : false;

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="w-72 shrink-0 border-r border-surface-border overflow-y-auto hidden md:flex flex-col">
          <div className="p-4 border-b border-surface-border">
            <Link href={`/courses/${id}`} className="text-xs text-brand-500 hover:underline">
              ← Back to course
            </Link>
            <p className="text-sm font-semibold text-white mt-1 line-clamp-2">{course.title}</p>
          </div>

          <div className="flex-1 p-2 space-y-1">
            {lessons.map((lesson, i) => {
              const done = (course.completedLessonIds ?? []).includes(lesson.id);
              const active = lesson.id === activeLesson?.id;
              return (
                <button
                  key={lesson.id}
                  onClick={() => setActiveLessonId(lesson.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 text-sm transition-colors ${
                    active
                      ? 'bg-brand-500/10 text-white'
                      : 'text-gray-400 hover:bg-surface-card hover:text-white'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-600 shrink-0" />
                  )}
                  <span className="flex-1 line-clamp-1">{lesson.title}</span>
                  <span className="text-xs text-gray-600 shrink-0">{i + 1}</span>
                </button>
              );
            })}
          </div>

          {isOwner && (
            <div className="p-3 border-t border-surface-border">
              {addingLesson ? (
                <div className="space-y-2">
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Lesson title"
                    className="input w-full text-xs py-1.5"
                    autoFocus
                  />
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Lesson content (optional)"
                    rows={3}
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
                      Add
                    </button>
                    <button
                      onClick={() => setAddingLesson(false)}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingLesson(true)}
                  className="btn-secondary w-full text-xs py-1.5 flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Lesson
                </button>
              )}
            </div>
          )}
        </aside>

        {/* Lesson content */}
        <main className="flex-1 overflow-y-auto">
          {!activeLesson ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm space-y-2">
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
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-bold text-white">{activeLesson.title}</h2>
                {isOwner && (
                  <button
                    onClick={() => deleteLesson.mutate(activeLesson.id)}
                    disabled={deleteLesson.isPending}
                    className="text-gray-500 hover:text-red-400 transition-colors shrink-0 mt-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {activeLesson.videoUrl && (
                <div className="aspect-video bg-black rounded-xl overflow-hidden">
                  <iframe
                    src={activeLesson.videoUrl.replace('watch?v=', 'embed/')}
                    className="w-full h-full"
                    allowFullScreen
                    title={activeLesson.title}
                  />
                </div>
              )}

              {activeLesson.content && (
                <div className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {activeLesson.content}
                </div>
              )}

              {!activeLesson.content && !activeLesson.videoUrl && (
                <p className="text-gray-500 text-sm italic">No content for this lesson yet.</p>
              )}

              {/* Navigation + complete */}
              <div className="flex items-center justify-between pt-4 border-t border-surface-border">
                <button
                  onClick={() => setActiveLessonId(lessons[activeIdx - 1]?.id)}
                  disabled={activeIdx === 0}
                  className="btn-secondary text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>

                {isEnrolled && !isOwner && (
                  <button
                    onClick={() => !isDone && complete.mutate(activeLesson.id)}
                    disabled={isDone || complete.isPending}
                    className={`text-sm px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
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

                <button
                  onClick={() => setActiveLessonId(lessons[activeIdx + 1]?.id)}
                  disabled={activeIdx === lessons.length - 1}
                  className="btn-secondary text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-40"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {complete.data?.certificateIssued && (
                <div className="flex items-center gap-3 bg-brand-500/10 border border-brand-500/30 rounded-xl p-4">
                  <Award className="w-6 h-6 text-brand-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      🎉 You&apos;ve completed the course!
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Your certificate has been issued. View it on the{' '}
                      <Link href={`/courses/${id}`} className="text-brand-500 hover:underline">
                        course page
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </AppShell>
  );
}
