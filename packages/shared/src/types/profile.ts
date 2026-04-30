export type ProfileRoleType = 'mechanic' | 'manufacturer' | 'collector' | 'enthusiast';

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
  profileVideoUrl?: string;
  followersCount: number;
  followingCount: number;
  createdAt: string;
}
