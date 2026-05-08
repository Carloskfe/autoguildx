'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap,
  BookOpen,
  Users,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Award,
} from 'lucide-react';
import { clsx } from 'clsx';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { Course, Enrollment, Certificate } from '@autoguildx/shared';

interface EnrolledCourse extends Enrollment {
  course?: Course;
}

export default function CoursesManagePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'teaching' | 'learning'>('teaching');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  // Teaching — own courses
  const { data: myCourses = [], isLoading: loadingCourses } = useQuery<Course[]>({
    queryKey: ['my-courses'],
    queryFn: () => api.get('/courses/my').then((r) => r.data),
    enabled: isAuthenticated,
  });

  // Learning — enrolled courses
  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery<EnrolledCourse[]>({
    queryKey: ['my-enrollments'],
    queryFn: () => api.get('/courses/enrollments').then((r) => r.data),
    enabled: isAuthenticated,
  });

  const togglePublish = useMutation({
    mutationFn: (id: string) => api.patch(`/courses/${id}/publish`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-courses'] }),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/courses/${id}`).then((r) => r.data),
    onSuccess: () => {
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ['my-courses'] });
      qc.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  if (!isAuthenticated) return null;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/courses" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">My Learning Hub</h1>
          </div>
          <Link href="/courses/new" className="btn-primary text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> New Course
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-surface-border gap-6">
          {(['teaching', 'learning'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                'pb-3 text-sm font-medium capitalize border-b-2 transition-colors',
                tab === t
                  ? 'border-brand-500 text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-300',
              )}
            >
              {t === 'teaching'
                ? `Teaching (${myCourses.length})`
                : `Learning (${enrollments.length})`}
            </button>
          ))}
        </div>

        {/* ── Teaching tab ─────────────────────────────────────────────────────── */}
        {tab === 'teaching' && (
          <div className="space-y-3">
            {loadingCourses && (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
              </div>
            )}

            {!loadingCourses && myCourses.length === 0 && (
              <div className="text-center py-16 space-y-3">
                <GraduationCap className="w-10 h-10 text-gray-700 mx-auto" />
                <p className="text-gray-400 text-sm">You haven&apos;t created any courses yet.</p>
                <Link href="/courses/new" className="btn-primary text-sm inline-block px-5">
                  Create your first course
                </Link>
              </div>
            )}

            {myCourses.map((course) => (
              <div key={course.id} className="card flex items-start gap-4">
                {/* Thumbnail */}
                {course.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={course.thumbnailUrl}
                    alt=""
                    className="w-20 h-14 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-20 h-14 rounded-lg bg-surface-border shrink-0 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-gray-600" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/courses/${course.id}`}
                      className="text-sm font-semibold text-white hover:text-brand-500 transition-colors truncate"
                    >
                      {course.title}
                    </Link>
                    <span
                      className={clsx(
                        'text-xs px-2 py-0.5 rounded-full shrink-0 border',
                        course.published
                          ? 'bg-green-500/20 text-green-400 border-green-500/40'
                          : 'bg-gray-500/20 text-gray-400 border-gray-600',
                      )}
                    >
                      {course.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {course.lessonCount} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {course.enrollmentCount} students
                    </span>
                    <span className="text-gray-500">{course.level}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/courses/${course.id}/edit`}
                    className="p-1.5 text-gray-400 hover:text-brand-500 transition-colors"
                    title="Edit course"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => togglePublish.mutate(course.id)}
                    disabled={togglePublish.isPending}
                    className={clsx(
                      'p-1.5 transition-colors',
                      course.published
                        ? 'text-gray-400 hover:text-yellow-400'
                        : 'text-gray-400 hover:text-green-400',
                    )}
                    title={course.published ? 'Unpublish' : 'Publish'}
                  >
                    {course.published ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => setDeleteId(course.id)}
                    className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Learning tab ─────────────────────────────────────────────────────── */}
        {tab === 'learning' && (
          <div className="space-y-3">
            {loadingEnrollments && (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
              </div>
            )}

            {!loadingEnrollments && enrollments.length === 0 && (
              <div className="text-center py-16 space-y-3">
                <BookOpen className="w-10 h-10 text-gray-700 mx-auto" />
                <p className="text-gray-400 text-sm">
                  You haven&apos;t enrolled in any courses yet.
                </p>
                <Link href="/courses" className="btn-primary text-sm inline-block px-5">
                  Browse courses
                </Link>
              </div>
            )}

            {enrollments.map((enrollment) => (
              <EnrolledCourseRow key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="card w-full max-w-sm space-y-4">
            <h2 className="font-semibold text-white">Delete course?</h2>
            <p className="text-sm text-gray-400">
              All lessons and enrollment data will be permanently deleted.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary text-sm px-4 py-2">
                Cancel
              </button>
              <button
                onClick={() => del.mutate(deleteId)}
                disabled={del.isPending}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {del.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function EnrolledCourseRow({ enrollment }: { enrollment: EnrolledCourse }) {
  const { data: progress } = useQuery<{
    completed: number;
    total: number;
    percentage: number;
  }>({
    queryKey: ['progress', enrollment.courseId],
    queryFn: () => api.get(`/courses/${enrollment.courseId}/progress`).then((r) => r.data),
    staleTime: 60000,
  });

  const { data: cert } = useQuery<{ certificateNumber?: string } | null>({
    queryKey: ['courseCert', enrollment.courseId],
    queryFn: () =>
      api
        .get(`/courses/${enrollment.courseId}/certificate`)
        .then((r) => r.data)
        .catch(() => null),
    staleTime: 60000,
  });

  const { data: courseDetail } = useQuery<Course>({
    queryKey: ['course-brief', enrollment.courseId],
    queryFn: () => api.get(`/courses/${enrollment.courseId}`).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const pct = progress?.percentage ?? 0;
  const done = pct === 100;

  return (
    <div className="card space-y-3">
      <div className="flex items-start gap-3">
        {courseDetail?.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={courseDetail.thumbnailUrl}
            alt=""
            className="w-16 h-12 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div className="w-16 h-12 rounded-lg bg-surface-border shrink-0 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-gray-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Link
            href={`/courses/${enrollment.courseId}`}
            className="text-sm font-semibold text-white hover:text-brand-500 transition-colors line-clamp-1"
          >
            {courseDetail?.title ?? 'Loading…'}
          </Link>
          {cert?.certificateNumber && (
            <p className="text-xs text-brand-500 flex items-center gap-1 mt-0.5">
              <Award className="w-3 h-3" />
              {cert.certificateNumber}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {done ? (
            <Link
              href={`/courses/${enrollment.courseId}/certificate`}
              className="text-xs text-brand-500 hover:underline flex items-center gap-1"
            >
              <Award className="w-3.5 h-3.5" /> Certificate
            </Link>
          ) : (
            <Link
              href={`/courses/${enrollment.courseId}/learn`}
              className="btn-primary text-xs px-3 py-1.5"
            >
              Continue
            </Link>
          )}
        </div>
      </div>

      {progress && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              {progress.completed}/{progress.total} lessons
            </span>
            <span className={done ? 'text-green-400 font-medium' : ''}>
              {done ? '✓ Complete' : `${pct}%`}
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${done ? 'bg-green-400' : 'bg-brand-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
