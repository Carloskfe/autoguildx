export type ProfileRoleType = 'mechanic' | 'manufacturer' | 'collector' | 'enthusiast';

export type ProfileSectionType =
  | 'expertise'
  | 'experience'
  | 'build'
  | 'certification'
  | 'equipment';

export interface ProfileSection {
  id: string;
  profileId: string;
  type: ProfileSectionType;
  data: Record<string, unknown>;
  sortOrder: number;
  createdAt: string;
}

// Typed data shapes per section type
export interface ExpertiseData { skill: string; level: 'beginner' | 'intermediate' | 'expert' }
export interface ExperienceData { shopName: string; role: string; startYear: number; endYear?: number; current?: boolean; description?: string }
export interface BuildData { title: string; year: number; make: string; model: string; description?: string; photoUrl?: string }
export interface CertificationData { name: string; issuer: string; year?: number; courseId?: string }
export interface EquipmentData { name: string; brand?: string; category?: string }

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
  profileBannerUrl?: string;
  followersCount: number;
  followingCount: number;
  isVerified: boolean;
  verificationStatus?: 'none' | 'pending' | 'approved' | 'denied';
  createdAt: string;
}
