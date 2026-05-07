import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 gap-6 bg-surface">
      <p className="text-8xl font-black text-brand-500">404</p>
      <p className="text-xl font-bold text-white">Page not found</p>
      <p className="text-gray-400 text-sm max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link href="/" className="btn-primary text-sm px-6 py-2.5">
          Go Home
        </Link>
        <Link href="/marketplace" className="btn-secondary text-sm px-6 py-2.5">
          Browse Marketplace
        </Link>
      </div>
    </div>
  );
}
