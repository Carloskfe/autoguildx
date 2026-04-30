'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function SubscriptionSuccessPage() {
  const qc = useQueryClient();

  useEffect(() => {
    qc.invalidateQueries({ queryKey: ['subscription'] });
  }, [qc]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-sm text-center space-y-6">
        <CheckCircle className="w-14 h-14 text-green-400 mx-auto" />
        <div>
          <h1 className="text-2xl font-bold text-white">You&apos;re upgraded!</h1>
          <p className="text-gray-400 text-sm mt-2">
            Your subscription is now active. Your new limits take effect immediately.
          </p>
        </div>
        <div className="space-y-2">
          <Link href="/marketplace/new" className="btn-primary w-full block text-center py-2">
            Post a Listing
          </Link>
          <Link href="/feed" className="btn-secondary w-full block text-center py-2">
            Go to Feed
          </Link>
        </div>
      </div>
    </div>
  );
}
