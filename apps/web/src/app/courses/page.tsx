'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  GraduationCap,
  Search,
  Plus,
  Users,
  BookOpen,
  Star,
  Loader2,
  LayoutList,
  TrendingUp,
  Clock,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { Course } from '@autoguildx/shared';

interface CoursesResponse {
  courses: Course[];
  total: number;
}
type SortOption = 'newest' | 'popular' | 'rating';

const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced', 'All Levels'];
const SORT_OPTIONS: { value: SortOption; label: string; icon: React.ElementType }[] = [
  { value: 'newest', label: 'Newest', icon: Clock },
  { value: 'popular', label: 'Most Popular', icon: TrendingUp },
  { value: 'rating', label: 'Top Rated', icon: Star },
];

function StarRating({ avg, total }: { avg: number | null; total: number }) {
  if (!avg || total === 0) return null;
  return (
    <div className="flex items-center gap-1">
      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
      <span className="text-xs font-semibold text-yellow-400">{avg.toFixed(1)}</span>
      <span className="text-xs text-gray-500">({total})</span>
    </div>
  );
}

function ProgressBar({ percentage }: { percentage: number }) {
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>Progress</span>
        <span className="font-medium text-brand-400">{percentage}%</span>
      </div>
      <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function CourseCard({
  course,
  rating,
  progress,
}: {
  course: Course;
  rating?: { avgRating: number | null; total: number };
  progress?: number;
}) {
  const instructorName =
    (course.instructor as any)?.profile?.name ?? course.instructor?.email ?? 'Instructor';
  const isBestseller = course.enrollmentCount >= 50;
  const isEnrolled = progress !== undefined;

  return (
    <Link href={`/courses/${course.id}`} className="group block">
      <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden hover:border-silver-600/30 transition-colors">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-900 overflow-hidden">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <GraduationCap className="w-12 h-12 text-gray-700" />
            </div>
          )}
          {isBestseller && !isEnrolled && (
            <span className="absolute top-2 left-2 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded">
              Bestseller
            </span>
          )}
          {isEnrolled && (
            <span className="absolute top-2 left-2 bg-brand-500/90 text-white text-xs font-semibold px-2 py-0.5 rounded">
              {progress === 100 ? 'Completed' : 'Enrolled'}
            </span>
          )}
          {Number(course.price) === 0 && !isEnrolled && (
            <span className="absolute top-2 right-2 bg-green-500/90 text-white text-xs font-semibold px-2 py-0.5 rounded">
              Free
            </span>
          )}
        </div>

        {/* Card body */}
        <div className="p-4">
          <h3 className="font-bold text-white text-sm leading-snug line-clamp-2 mb-1 group-hover:text-brand-400 transition-colors">
            {course.title}
          </h3>
          <p className="text-xs text-gray-400 mb-2 truncate">{instructorName}</p>

          {/* Rating */}
          {rating && (
            <div className="mb-2">
              <StarRating avg={rating.avgRating} total={rating.total} />
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {course.lessonCount} {course.lessonCount === 1 ? 'lesson' : 'lessons'}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {course.enrollmentCount.toLocaleString()}
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${
                course.level === 'Beginner'
                  ? 'border-green-600/40 text-green-400 bg-green-500/10'
                  : course.level === 'Intermediate'
                    ? 'border-yellow-600/40 text-yellow-400 bg-yellow-500/10'
                    : course.level === 'Advanced'
                      ? 'border-red-600/40 text-red-400 bg-red-500/10'
                      : 'border-surface-border text-gray-500'
              }`}
            >
              {course.level || 'All Levels'}
            </span>
            {Number(course.price) > 0 ? (
              <span className="font-bold text-white text-sm">
                ${Number(course.price).toFixed(2)}
              </span>
            ) : (
              <span className="font-bold text-green-400 text-sm">Free</span>
            )}
          </div>

          {/* Progress bar for enrolled users */}
          {isEnrolled && progress !== undefined && <ProgressBar percentage={progress} />}
        </div>
      </div>
    </Link>
  );
}

export default function CoursesPage() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [level, setLevel] = useState('All');
  const [sort, setSort] = useState<SortOption>('newest');
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery<CoursesResponse>({
    queryKey: ['courses', debouncedSearch, level, sort],
    queryFn: () =>
      api
        .get('/courses', { params: { search: debouncedSearch || undefined, sort, limit: 50 } })
        .then((r) => r.data),
  });

  const { data: ratingsMap } = useQuery<
    Record<string, { avgRating: number | null; total: number }>
  >({
    queryKey: ['courseRatings', data?.courses?.map((c) => c.id).join(',')],
    queryFn: async () => {
      if (!data?.courses?.length) return {};
      const results = await Promise.all(
        data.courses.map((c) =>
          api.get(`/reviews/course/${c.id}/summary`).then((r) => ({ id: c.id, ...r.data })),
        ),
      );
      return Object.fromEntries(
        results.map((r) => [r.id, { avgRating: r.avgRating, total: r.total }]),
      );
    },
    enabled: !!data?.courses?.length,
    staleTime: 60_000,
  });

  const { data: progressList } = useQuery<{ courseId: string; percentage: number }[]>({
    queryKey: ['myProgress'],
    queryFn: () => api.get('/courses/my-progress').then((r) => r.data),
    enabled: isAuthenticated,
  });

  const progressMap = Object.fromEntries(
    (progressList ?? []).map((p) => [p.courseId, p.percentage]),
  );

  const filtered =
    level === 'All'
      ? (data?.courses ?? [])
      : (data?.courses ?? []).filter((c) => c.level === level);

  const currentSort = SORT_OPTIONS.find((s) => s.value === sort)!;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Courses</h1>
            <p className="text-gray-400 text-sm mt-1">
              Expand your skills with courses from automotive experts
            </p>
          </div>
          {isAuthenticated && (
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/courses/manage"
                className="btn-secondary text-sm px-4 py-2.5 flex items-center gap-2"
              >
                <LayoutList className="w-4 h-4" /> My Hub
              </Link>
              <Link
                href="/courses/new"
                className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create Course
              </Link>
            </div>
          )}
        </div>

        {/* Search + Sort row */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses…"
              className="input pl-11 w-full py-3 text-sm"
            />
          </div>
          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen((v) => !v)}
              className="btn-secondary text-sm px-4 py-3 flex items-center gap-2 whitespace-nowrap"
            >
              <currentSort.icon className="w-4 h-4" />
              {currentSort.label}
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-surface-card border border-surface-border rounded-xl shadow-xl overflow-hidden min-w-[160px]">
                  {SORT_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSort(opt.value);
                          setSortOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                          sort === opt.value
                            ? 'text-brand-400 bg-brand-500/10'
                            : 'text-gray-300 hover:bg-surface-border'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Level filter chips */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
                level === l
                  ? 'bg-brand-500 border-brand-500 text-white font-medium'
                  : 'border-surface-border text-gray-400 hover:border-gray-500 hover:text-white'
              }`}
            >
              {l}
            </button>
          ))}
          {data && (
            <span className="text-xs text-gray-500 ml-auto">
              {filtered.length} {filtered.length === 1 ? 'course' : 'courses'}
            </span>
          )}
        </div>

        {/* Grid */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20 space-y-3">
            <GraduationCap className="w-12 h-12 text-gray-700 mx-auto" />
            <p className="text-gray-400 text-sm">No courses found.</p>
            {isAuthenticated && (
              <Link href="/courses/new" className="btn-primary text-sm px-5 py-2 inline-block">
                Create the first one
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              rating={ratingsMap?.[c.id]}
              progress={progressMap[c.id]}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
