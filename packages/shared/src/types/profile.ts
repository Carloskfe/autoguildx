export type ProfileRoleType = 'individual' | 'business';

export interface Profile {
  id: string;
  userId: string;
  name: string;
  businessName?: string;
  location?: string;
  bio?: string;
  roleType: ProfileRoleType;
  tags: string[];
  profileImageUrl?: string;
  followersCount: number;
  followingCount: number;
  createdAt: string;
}
