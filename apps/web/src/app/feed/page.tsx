import AppShell from '@/components/layout/AppShell';

export default function FeedPage() {
  return (
    <AppShell>
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        <h1 className="font-bold text-lg">Feed</h1>
        <p className="text-gray-400 text-sm">Posts from people you follow will appear here.</p>
      </div>
    </AppShell>
  );
}
