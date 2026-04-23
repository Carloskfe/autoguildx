import AppShell from '@/components/layout/AppShell';
import Link from 'next/link';

export default function EventsPage() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-lg">Events</h1>
          <Link href="/events/new" className="btn-primary text-sm">
            + Create Event
          </Link>
        </div>
        <p className="text-gray-400 text-sm">Upcoming events will appear here.</p>
      </div>
    </AppShell>
  );
}
