export type SubscriptionTier = 'free' | 'owner' | 'company';

export const SUBSCRIPTION_LIMITS: Record<
  SubscriptionTier,
  { maxListings: number; featuredCampaigns: number }
> = {
  free: { maxListings: 5, featuredCampaigns: 0 },
  owner: { maxListings: 15, featuredCampaigns: 1 },
  company: { maxListings: Infinity, featuredCampaigns: 5 },
};
