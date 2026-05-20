import type { Metadata } from 'next';
import EventClient from './PageClient';

const apiUrl = () =>
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const res = await fetch(`${apiUrl()}/events/${params.id}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('not found');
    const event = await res.json();
    const description = event.description?.slice(0, 155) ?? `Join ${event.title} on AutoGuildX.`;
    return {
      title: event.title,
      description,
      openGraph: { title: event.title, description },
    };
  } catch {
    return { title: 'Event' };
  }
}

export default function EventDetailPage() {
  return <EventClient />;
}
