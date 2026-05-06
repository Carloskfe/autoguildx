'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, Search, Plus, Users, BookOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { Course } from '@autoguildx/shared';

interface CoursesResponse {
  courses: Course[];
  total: number;
}

function CourseCard({ course }: { course: Course }) {
  const instructorName =
    (course.instructor as any)?.profile?.name ?? course.instructor?.email ?? 'Instructor';

  return (
    <Link
      href={`/courses/${course.id}`}
      className="card hover:border-brand-500/40 transition-colors block"
    >
      {course.thumbnailUrl ? (
        <img
          src={course.thumbnailUrl}
          alt={course.title}
          className="w-full h-40 object-cover rounded-lg mb-3"
        />
      ) : (
        <div className="w-full h-40 bg-surface-card rounded-lg mb-3 flex items-center justify-center">
          <GraduationCap className="w-10 h-10 text-gray-600" />
        </div>
      )}
      <h3 className="font-semibold text-white text-sm leading-snug mb-1 line-clamp-2">
        {course.title}
      </h3>
      <p className="text-xs text-gray-400 mb-2">{instructorName}</p>
      {course.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{course.description}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5" />
          {course.lessonCount} {course.lessonCount === 1 ? 'lesson' : 'lessons'}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {course.enrollmentCount}
        </span>
        {Number(course.price) > 0 ? (
          <span className="ml-auto font-semibold text-brand-500">
            ${Number(course.price).toFixed(2)}
          </span>
        ) : (
          <span className="ml-auto text-green-400 font-medium">Free</span>
        )}
      </div>
      {course.tags?.filter(Boolean).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {course.tags
            .filter(Boolean)
            .slice(0, 3)
            .map((t) => (
              <span
                key={t}
                className="text-xs bg-surface-card text-gray-400 px-2 py-0.5 rounded-full border border-surface-border"
              >
                {t}
              </span>
            ))}
        </div>
      )}
    </Link>
  );
}

export default function CoursesPage() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery<CoursesResponse>({
    queryKey: ['courses', debouncedSearch],
    queryFn: () =>
      api
        .get('/courses', { params: { search: debouncedSearch || undefined, limit: 50 } })
        .then((r) => r.data),
  });

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Courses</h1>
            <p className="text-sm text-gray-400 mt-0.5">Learn from automotive experts</p>
          </div>
          {isAuthenticated && (
            <Link
              href="/courses/new"
              className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Course
            </Link>
          )}
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses…"
            className="input pl-9 w-full"
          />
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        )}

        {!isLoading && data?.courses.length === 0 && (
          <div className="text-center py-16 space-y-2">
            <GraduationCap className="w-10 h-10 text-gray-600 mx-auto" />
            <p className="text-gray-400 text-sm">No courses yet. Be the first to create one.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
