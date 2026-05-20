'use client';

import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default function SubscriptionCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-sm text-center space-y-6">
        <XCircle className="w-14 h-14 text-gray-500 mx-auto" />
        <div>
          <h1 className="text-2xl font-bold text-white">Payment cancelled</h1>
          <p className="text-gray-400 text-sm mt-2">
            No charge was made. You can upgrade any time from your account.
          </p>
        </div>
        <Link href="/feed" className="btn-secondary w-full block text-center py-2">
          Back to Feed
        </Link>
      </div>
    </div>
  );
}
