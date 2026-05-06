'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap,
  BookOpen,
  Users,
  Clock,
  CheckCircle2,
  Circle,
  Award,
  Loader2,
  Play,
} from 'lucide-react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import VerifiedBadge from '@/components/VerifiedBadge';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { Course, Lesson, Enrollment, Certificate } from '@autoguildx/shared';

interface CourseDetail extends Course {
  lessons: Lesson[];
  enrollment: Enrollment | null;
  completedLessonIds: string[];
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="w-full bg-surface-card rounded-full h-2">
      <div className="bg-brand-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, userId } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: course, isLoading } = useQuery<CourseDetail>({
    queryKey: ['course', id],
    queryFn: () => api.get(`/courses/${id}`).then((r) => r.data),
  });

  const { data: progress } = useQuery<{ percentage: number; completed: number; total: number }>({
    queryKey: ['courseProgress', id],
    queryFn: () => api.get(`/courses/${id}/progress`).then((r) => r.data),
    enabled: isAuthenticated && !!course?.enrollment,
  });

  const { data: certificate } = useQuery<Certificate | null>({
    queryKey: ['courseCert', id],
    queryFn: () =>
      api
        .get(`/courses/${id}/certificate`)
        .then((r) => r.data)
        .catch(() => null),
    enabled: isAuthenticated && (progress?.percentage ?? 0) === 100,
  });

  const enroll = useMutation({
    mutationFn: () => api.post(`/courses/${id}/enroll`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course', id] });
      router.push(`/courses/${id}/learn`);
    },
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      </AppShell>
    );
  }

  if (!course) {
    return (
      <AppShell>
        <div className="text-center py-20 text-gray-400 text-sm">Course not found.</div>
      </AppShell>
    );
  }

  const instructorName =
    (course.instructor as any)?.profile?.name ?? course.instructor?.email ?? 'Instructor';
  const instructorVerified = (course.instructor as any)?.profile?.isVerified;
  const totalMinutes = course.lessons?.reduce((s, l) => s + (l.durationMinutes ?? 0), 0) ?? 0;
  const isOwner = userId === course.instructorId;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            {course.thumbnailUrl ? (
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-full h-56 object-cover rounded-xl"
              />
            ) : (
              <div className="w-full h-56 bg-surface-card rounded-xl flex items-center justify-center">
                <GraduationCap className="w-14 h-14 text-gray-600" />
              </div>
            )}

            <div>
              <h1 className="text-2xl font-bold text-white mb-1">{course.title}</h1>
              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <span>by</span>
                <span className="text-white font-medium">{instructorName}</span>
                {instructorVerified && <VerifiedBadge size="sm" />}
              </div>
            </div>

            {course.description && (
              <p className="text-sm text-gray-300 leading-relaxed">{course.description}</p>
            )}

            {course.tags?.filter(Boolean).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {course.tags.filter(Boolean).map((t) => (
                  <span
                    key={t}
                    className="text-xs bg-surface-card text-gray-400 px-2.5 py-1 rounded-full border border-surface-border"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* Lessons list */}
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Lessons ({course.lessonCount})
              </h2>
              {course.lessons?.length === 0 && (
                <p className="text-sm text-gray-500">No lessons added yet.</p>
              )}
              <div className="space-y-2">
                {course.lessons?.map((lesson, i) => {
                  const done = course.completedLessonIds?.includes(lesson.id);
                  return (
                    <div key={lesson.id} className="card flex items-center gap-3 py-3">
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-600 shrink-0" />
                      )}
                      <span className="text-xs text-gray-500 w-5 shrink-0">{i + 1}</span>
                      <span className="text-sm text-white flex-1">{lesson.title}</span>
                      {lesson.videoUrl && <Play className="w-3.5 h-3.5 text-gray-500 shrink-0" />}
                      {lesson.durationMinutes > 0 && (
                        <span className="text-xs text-gray-500 shrink-0">
                          {lesson.durationMinutes}m
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                {Number(course.price) > 0 ? (
                  <span className="text-2xl font-bold text-white">
                    ${Number(course.price).toFixed(2)}
                  </span>
                ) : (
                  <span className="text-2xl font-bold text-green-400">Free</span>
                )}
              </div>

              {certificate && (
                <div className="flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 rounded-lg px-3 py-2">
                  <Award className="w-4 h-4 text-brand-500 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-brand-500">Certificate Earned</p>
                    <p className="text-xs text-gray-400 font-mono">
                      {certificate.certificateNumber}
                    </p>
                  </div>
                </div>
              )}

              {course.enrollment && progress && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>
                      {progress.completed}/{progress.total} lessons
                    </span>
                    <span>{progress.percentage}%</span>
                  </div>
                  <ProgressBar pct={progress.percentage} />
                </div>
              )}

              {course.enrollment ? (
                <Link
                  href={`/courses/${id}/learn`}
                  className="btn-primary w-full py-2.5 text-sm text-center block"
                >
                  {(progress?.percentage ?? 0) === 100 ? 'Review Course' : 'Continue Learning'}
                </Link>
              ) : isAuthenticated ? (
                <button
                  onClick={() => enroll.mutate()}
                  disabled={enroll.isPending}
                  className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {enroll.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enroll Now
                </button>
              ) : (
                <Link href="/login" className="btn-primary w-full py-2.5 text-sm text-center block">
                  Log in to Enroll
                </Link>
              )}

              {isOwner && (
                <Link
                  href={`/courses/${id}/learn`}
                  className="btn-secondary w-full py-2 text-xs text-center block"
                >
                  Manage Course
                </Link>
              )}

              <div className="space-y-2 pt-1 border-t border-surface-border text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{course.lessonCount} lessons</span>
                </div>
                {totalMinutes > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{totalMinutes} min total</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{course.enrollmentCount} enrolled</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span>Certificate of completion</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
