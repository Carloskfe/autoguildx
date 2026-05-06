'use client';

import { useState } from 'react';
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
  ChevronDown,
  ChevronUp,
  MonitorPlay,
  FileText,
  Globe,
  BarChart2,
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

function groupBySections(lessons: Lesson[]): { section: string; lessons: Lesson[] }[] {
  const map = new Map<string, Lesson[]>();
  for (const l of lessons) {
    const key = l.section || 'Course Content';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(l);
  }
  return Array.from(map.entries()).map(([section, lessons]) => ({ section, lessons }));
}

function CurriculumSection({
  section,
  lessons,
  completedIds,
  defaultOpen,
}: {
  section: string;
  lessons: Lesson[];
  completedIds: string[];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const totalMin = lessons.reduce((s, l) => s + (l.durationMinutes ?? 0), 0);

  return (
    <div className="border border-surface-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-card hover:bg-gray-800/60 transition-colors"
      >
        <div className="flex items-center gap-2 text-left">
          {open ? (
            <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
          )}
          <span className="text-sm font-semibold text-white">{section}</span>
        </div>
        <span className="text-xs text-gray-500 shrink-0 ml-4">
          {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
          {totalMin > 0 ? ` · ${totalMin}m` : ''}
        </span>
      </button>
      {open && (
        <ul className="divide-y divide-surface-border">
          {lessons.map((l, i) => {
            const done = completedIds.includes(l.id);
            return (
              <li key={l.id} className="flex items-center gap-3 px-4 py-2.5 bg-[#0f0f0f]">
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                ) : l.videoUrl ? (
                  <Play className="w-4 h-4 text-gray-500 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                )}
                <span className="text-sm text-gray-300 flex-1 line-clamp-1">{l.title}</span>
                {l.durationMinutes > 0 && (
                  <span className="text-xs text-gray-500 shrink-0">{l.durationMinutes}m</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
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
        <div className="flex justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      </AppShell>
    );
  }

  if (!course) {
    return (
      <AppShell>
        <div className="text-center py-24 text-gray-400 text-sm">Course not found.</div>
      </AppShell>
    );
  }

  const instructorProfile = (course.instructor as any)?.profile;
  const instructorName = instructorProfile?.name ?? course.instructor?.email ?? 'Instructor';
  const instructorVerified = instructorProfile?.isVerified;
  const totalMinutes = course.lessons?.reduce((s, l) => s + (l.durationMinutes ?? 0), 0) ?? 0;
  const isOwner = userId === course.instructorId;
  const sections = groupBySections(course.lessons ?? []);
  const objectives = course.objectives?.filter(Boolean) ?? [];
  const requirements = course.requirements?.filter(Boolean) ?? [];

  return (
    <AppShell>
      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <div className="bg-gray-950 border-b border-surface-border">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="max-w-3xl">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
              <Link href="/courses" className="hover:text-brand-500 transition-colors">
                Courses
              </Link>
              {course.tags?.filter(Boolean)[0] && (
                <>
                  <span>/</span>
                  <span className="text-gray-400">{course.tags.filter(Boolean)[0]}</span>
                </>
              )}
            </nav>

            <h1 className="text-3xl font-extrabold text-white leading-tight mb-3">
              {course.title}
            </h1>

            {course.description && (
              <p className="text-gray-300 text-base leading-relaxed mb-4 line-clamp-3">
                {course.description}
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded ${
                  course.level === 'Beginner'
                    ? 'bg-green-500/20 text-green-400'
                    : course.level === 'Intermediate'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : course.level === 'Advanced'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-gray-700 text-gray-300'
                }`}
              >
                {course.level || 'All Levels'}
              </span>
              <span className="flex items-center gap-1.5 text-gray-400">
                <Users className="w-4 h-4" />
                {course.enrollmentCount.toLocaleString()} students
              </span>
              <span className="flex items-center gap-1.5 text-gray-400">
                <BookOpen className="w-4 h-4" />
                {course.lessonCount} {course.lessonCount === 1 ? 'lesson' : 'lessons'}
              </span>
              {totalMinutes > 0 && (
                <span className="flex items-center gap-1.5 text-gray-400">
                  <Clock className="w-4 h-4" />
                  {totalMinutes}m total
                </span>
              )}
            </div>

            {/* Instructor line */}
            <div className="flex items-center gap-2 mt-4 text-sm text-gray-400">
              <span>Created by</span>
              <span className="font-medium text-brand-400 flex items-center gap-1">
                {instructorName}
                {instructorVerified && <VerifiedBadge size="sm" />}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Page body ─────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8 items-start">
          {/* ── Left content ─────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* What you'll learn */}
            {objectives.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-white mb-4">What you&apos;ll learn</h2>
                <div className="border border-surface-border rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  {objectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Requirements */}
            {requirements.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-white mb-3">Requirements</h2>
                <ul className="space-y-2">
                  {requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-gray-500 mt-1">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Curriculum */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Course Content</h2>
                <span className="text-xs text-gray-500">
                  {course.lessonCount} {course.lessonCount === 1 ? 'lesson' : 'lessons'}
                  {totalMinutes > 0 ? ` · ${totalMinutes} min` : ''}
                </span>
              </div>
              {sections.length === 0 ? (
                <p className="text-sm text-gray-500">No lessons added yet.</p>
              ) : (
                <div className="space-y-2">
                  {sections.map((s, i) => (
                    <CurriculumSection
                      key={s.section}
                      section={s.section}
                      lessons={s.lessons}
                      completedIds={course.completedLessonIds ?? []}
                      defaultOpen={i === 0}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Instructor */}
            <section>
              <h2 className="text-lg font-bold text-white mb-4">Instructor</h2>
              <div className="flex items-start gap-4">
                {instructorProfile?.profileImageUrl ? (
                  <img
                    src={instructorProfile.profileImageUrl}
                    alt={instructorName}
                    className="w-16 h-16 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-surface-card border border-surface-border flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-gray-400">
                      {instructorName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${course.instructorId}`}
                      className="font-bold text-white hover:text-brand-400 transition-colors"
                    >
                      {instructorName}
                    </Link>
                    {instructorVerified && <VerifiedBadge size="sm" />}
                  </div>
                  {instructorProfile?.bio && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-3">
                      {instructorProfile.bio}
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* ── Sticky sidebar ─────────────────────────────────────────────── */}
          <aside className="w-80 shrink-0 hidden lg:block">
            <div className="sticky top-6 border border-surface-border rounded-xl overflow-hidden shadow-xl">
              {/* Preview thumbnail */}
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full aspect-video object-cover"
                />
              ) : (
                <div className="w-full aspect-video bg-gray-900 flex items-center justify-center">
                  <GraduationCap className="w-12 h-12 text-gray-700" />
                </div>
              )}

              <div className="p-5 space-y-4 bg-surface-card">
                {/* Certificate earned */}
                {certificate && (
                  <div className="flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 rounded-lg px-3 py-2.5">
                    <Award className="w-4 h-4 text-brand-500 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-brand-500">Certificate Earned</p>
                      <p className="text-xs text-gray-400 font-mono">
                        {certificate.certificateNumber}
                      </p>
                    </div>
                  </div>
                )}

                {/* Progress */}
                {course.enrollment && progress && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>
                        {progress.completed}/{progress.total} lessons complete
                      </span>
                      <span className="font-semibold text-white">{progress.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-brand-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Price */}
                <div>
                  {Number(course.price) > 0 ? (
                    <p className="text-3xl font-extrabold text-white">
                      ${Number(course.price).toFixed(2)}
                    </p>
                  ) : (
                    <p className="text-3xl font-extrabold text-green-400">Free</p>
                  )}
                </div>

                {/* CTA */}
                {course.enrollment ? (
                  <Link
                    href={`/courses/${id}/learn`}
                    className="btn-primary w-full py-3 text-sm text-center block font-semibold"
                  >
                    {(progress?.percentage ?? 0) === 100 ? 'Review Course' : 'Continue Learning'}
                  </Link>
                ) : isAuthenticated ? (
                  <button
                    onClick={() => enroll.mutate()}
                    disabled={enroll.isPending}
                    className="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {enroll.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Enroll Now
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="btn-primary w-full py-3 text-sm text-center block font-semibold"
                  >
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

                {/* Course includes */}
                <div className="pt-2 border-t border-surface-border space-y-2.5 text-sm text-gray-400">
                  <p className="text-xs font-semibold text-white uppercase tracking-wide">
                    This course includes:
                  </p>
                  <div className="flex items-center gap-2">
                    <MonitorPlay className="w-4 h-4 shrink-0" />
                    <span>{course.lessonCount} on-demand lessons</span>
                  </div>
                  {totalMinutes > 0 && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>{totalMinutes} minutes of content</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 shrink-0" />
                    <span>Full lifetime access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 shrink-0" />
                    <span>Certificate of completion</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Mobile CTA (shown below lg) */}
        <div className="mt-8 lg:hidden">
          {course.enrollment ? (
            <Link
              href={`/courses/${id}/learn`}
              className="btn-primary w-full py-3 text-sm text-center block font-semibold"
            >
              {(progress?.percentage ?? 0) === 100 ? 'Review Course' : 'Continue Learning'}
            </Link>
          ) : isAuthenticated ? (
            <button
              onClick={() => enroll.mutate()}
              disabled={enroll.isPending}
              className="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
            >
              {enroll.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Enroll Now
              {Number(course.price) === 0 ? ' — Free' : ` — $${Number(course.price).toFixed(2)}`}
            </button>
          ) : (
            <Link
              href="/login"
              className="btn-primary w-full py-3 text-sm text-center block font-semibold"
            >
              Log in to Enroll
            </Link>
          )}
        </div>
      </div>
    </AppShell>
  );
}
