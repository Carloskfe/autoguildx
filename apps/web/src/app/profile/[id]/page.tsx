import type { Metadata } from 'next';
import ProfileClient from './PageClient';

const apiUrl = () =>
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const res = await fetch(`${apiUrl()}/profiles/${params.id}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('not found');
    const profile = await res.json();
    const description = profile.bio?.slice(0, 155) ?? `${profile.name}'s profile on AutoGuildX.`;
    return {
      title: profile.name,
      description,
      openGraph: {
        title: profile.name,
        description,
        ...(profile.profileImageUrl ? { images: [{ url: profile.profileImageUrl }] } : {}),
      },
    };
  } catch {
    return { title: 'Profile' };
  }
}

export default function PublicProfilePage() {
  return <ProfileClient />;
}
