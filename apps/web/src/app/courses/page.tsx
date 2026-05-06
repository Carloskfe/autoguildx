'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, Search, Plus, Users, BookOpen, Star, Loader2, Clock } from 'lucide-react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { Course } from '@autoguildx/shared';

interface CoursesResponse {
  courses: Course[];
  total: number;
}

const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced', 'All Levels'];

function CourseCard({ course }: { course: Course }) {
  const instructorName =
    (course.instructor as any)?.profile?.name ?? course.instructor?.email ?? 'Instructor';
  const isBestseller = course.enrollmentCount >= 50;

  return (
    <Link href={`/courses/${course.id}`} className="group block">
      <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden hover:border-gray-600 transition-colors">
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
          {isBestseller && (
            <span className="absolute top-2 left-2 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded">
              Bestseller
            </span>
          )}
          {Number(course.price) === 0 && (
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

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery<CoursesResponse>({
    queryKey: ['courses', debouncedSearch, level],
    queryFn: () =>
      api
        .get('/courses', {
          params: {
            search: debouncedSearch || undefined,
            tag: level !== 'All' ? undefined : undefined,
            limit: 50,
          },
        })
        .then((r) => r.data),
  });

  const filtered =
    level === 'All'
      ? (data?.courses ?? [])
      : (data?.courses ?? []).filter(
          (c) => c.level === level || (level === 'All Levels' && c.level === 'All Levels'),
        );

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
            <Link
              href="/courses/new"
              className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Create Course
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses…"
            className="input pl-11 w-full py-3 text-sm"
          />
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
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
