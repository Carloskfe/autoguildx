import AppShell from '@/components/layout/AppShell';
import Link from 'next/link';

export default function MarketplacePage() {
  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-lg">Marketplace</h1>
          <Link href="/marketplace/new" className="btn-primary text-sm">
            + New Listing
          </Link>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['All', 'Parts', 'Services'].map((f) => (
            <button key={f} className="btn-secondary text-sm px-3 py-1">
              {f}
            </button>
          ))}
        </div>
        <p className="text-gray-400 text-sm">Listings will appear here.</p>
      </div>
    </AppShell>
  );
}
