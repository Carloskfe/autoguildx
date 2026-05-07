'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 gap-6 bg-surface">
      <p className="text-5xl font-black text-brand-500">Oops</p>
      <p className="text-xl font-bold text-white">Something went wrong</p>
      <p className="text-gray-400 text-sm max-w-sm">
        An unexpected error occurred. Try refreshing, or head back to the feed.
      </p>
      <div className="flex gap-3">
        <button onClick={reset} className="btn-primary text-sm px-6 py-2.5">
          Try again
        </button>
        <Link href="/feed" className="btn-secondary text-sm px-6 py-2.5">
          Go to Feed
        </Link>
      </div>
    </div>
  );
}
