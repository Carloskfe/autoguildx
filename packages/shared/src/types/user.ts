export type UserRole = 'mechanic' | 'manufacturer' | 'collector' | 'enthusiast' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  provider: 'email' | 'google' | 'facebook';
  createdAt: string;
}
