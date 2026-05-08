'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Award, Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { Course, Certificate } from '@autoguildx/shared';

interface CertificateWithCourse extends Certificate {
  course?: Course;
}

export default function CertificatePage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  const {
    data: cert,
    isLoading,
    isError,
  } = useQuery<CertificateWithCourse | null>({
    queryKey: ['courseCert', id],
    queryFn: () =>
      api
        .get(`/courses/${id}/certificate`)
        .then((r) => r.data)
        .catch(() => null),
    enabled: isAuthenticated && !!id,
  });

  const { data: courseData } = useQuery<{ title: string; instructor?: any }>({
    queryKey: ['course', id],
    queryFn: () => api.get(`/courses/${id}`).then((r) => r.data),
    enabled: !!id,
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

  if (isError || !cert) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-4">
          <Award className="w-12 h-12 text-gray-600 mx-auto" />
          <p className="text-gray-400 text-sm">
            No certificate found for this course. Complete all lessons to earn it.
          </p>
          <Link href={`/courses/${id}/learn`} className="btn-primary text-sm inline-block px-5">
            Go to course
          </Link>
        </div>
      </AppShell>
    );
  }

  const courseTitle = cert.course?.title ?? courseData?.title ?? 'Automotive Course';
  const instructorName =
    (courseData?.instructor as any)?.profile?.name ??
    (courseData?.instructor as any)?.email ??
    'AutoGuildX Instructor';
  const issueDate = cert.issuedAt
    ? new Date(cert.issuedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between print:hidden">
          <Link
            href={`/courses/${id}`}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to course
          </Link>
          <button
            onClick={() => window.print()}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>

        {/* Certificate card */}
        <div
          id="certificate"
          className="bg-[#0c0c0c] border-2 border-brand-500/60 rounded-2xl p-6 sm:p-10 text-center space-y-6 print:border-gray-400 print:text-black print:bg-white"
        >
          {/* Logo / brand */}
          <div className="flex flex-col items-center gap-1">
            <Award className="w-12 h-12 text-brand-500" />
            <p className="text-brand-500 font-black text-xl tracking-tight">AutoGuildX</p>
          </div>

          <div className="space-y-1">
            <p className="text-gray-400 text-sm uppercase tracking-widest font-medium">
              Certificate of Completion
            </p>
            <div className="w-24 h-0.5 bg-brand-500/40 mx-auto" />
          </div>

          <div className="space-y-3">
            <p className="text-gray-400 text-sm">This is to certify that</p>
            <p className="text-3xl font-black text-white print:text-black">
              {(cert as any)?.userName ?? 'Student'}
            </p>
            <p className="text-gray-400 text-sm">has successfully completed</p>
            <p className="text-2xl font-bold text-white leading-tight print:text-black">
              {courseTitle}
            </p>
            <p className="text-gray-400 text-sm">
              instructed by{' '}
              <span className="text-white font-medium print:text-black">{instructorName}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-surface-border print:border-gray-300">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date Issued</p>
              <p className="text-sm font-semibold text-white print:text-black">{issueDate}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Certificate ID</p>
              <p className="text-sm font-mono font-semibold text-brand-400 print:text-gray-700">
                {cert.certificateNumber}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-xs text-gray-600 print:text-gray-400">
              Verify at autoguildx.com · Certificate #{cert.certificateNumber}
            </p>
          </div>
        </div>

        {/* Share nudge */}
        <div className="text-center text-xs text-gray-500 print:hidden">
          Use <strong className="text-gray-400">Print / Save PDF</strong> to download or share your
          certificate.
        </div>
      </div>
    </AppShell>
  );
}
