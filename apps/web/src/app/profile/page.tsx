import AppShell from '@/components/layout/AppShell';

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="font-bold text-lg">Your Profile</h1>
        <p className="text-gray-400 text-sm mt-2">
          Profile details will load here after onboarding.
        </p>
      </div>
    </AppShell>
  );
}
