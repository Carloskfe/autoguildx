import AppShell from '@/components/layout/AppShell';

export default function DiscoverPage() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <h1 className="font-bold text-lg">Discover</h1>
        <input className="input" placeholder="Search mechanics, parts, shops..." />
        <p className="text-gray-400 text-sm">Search results will appear here.</p>
      </div>
    </AppShell>
  );
}
