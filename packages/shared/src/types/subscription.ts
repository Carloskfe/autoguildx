export type SubscriptionTier = 'free' | 'owner' | 'company';

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, { maxListings: number; featuredCampaigns: number }> = {
  free:    { maxListings: 5,         featuredCampaigns: 0 },
  owner:   { maxListings: 15,        featuredCampaigns: 1 },
  company: { maxListings: Infinity,  featuredCampaigns: 5 },
};

export const SUBSCRIPTION_PRICES: Record<SubscriptionTier, number> = {
  free:    0,
  owner:   9.99,
  company: 99.99,
};

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  startDate: string;
  endDate?: string;
  active: boolean;
}
