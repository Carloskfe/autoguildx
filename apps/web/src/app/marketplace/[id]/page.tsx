import type { Metadata } from 'next';
import ListingClient from './PageClient';

const apiUrl = () =>
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const res = await fetch(`${apiUrl()}/listings/${params.id}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('not found');
    const listing = await res.json();
    const price = listing.price != null ? ` — $${Number(listing.price).toLocaleString()}` : '';
    const description = listing.description?.slice(0, 155) ?? 'View this listing on AutoGuildX.';
    const image = listing.mediaUrls?.find(Boolean);
    return {
      title: `${listing.title}${price}`,
      description,
      openGraph: {
        title: `${listing.title}${price}`,
        description,
        ...(image ? { images: [{ url: image }] } : {}),
      },
    };
  } catch {
    return { title: 'Listing' };
  }
}

export default function ListingDetailPage() {
  return <ListingClient />;
}
