export type ListingType = 'part' | 'service';
export type ListingStatus = 'active' | 'sold' | 'expired';

export interface Listing {
  id: string;
  userId: string;
  type: ListingType;
  title: string;
  description: string;
  price?: number;
  category: string;
  vehicleTags: string[];
  location?: string;
  mediaUrls: string[];
  status: ListingStatus;
  isFeatured: boolean;
  featuredUntil?: string;
  createdAt: string;
}
