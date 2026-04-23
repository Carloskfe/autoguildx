'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface AuthState {
  token: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  login: (token: string, userId: string) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      isAuthenticated: false,
      login: (token, userId) => {
        localStorage.setItem('agx_token', token);
        set({ token, userId, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('agx_token');
        set({ token: null, userId: null, isAuthenticated: false });
      },
    }),
    {
      name: 'agx-auth',
      partialize: (s) => ({ token: s.token, userId: s.userId, isAuthenticated: s.isAuthenticated }),
    },
  ),
);

export async function loginWithEmail(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function signupWithEmail(email: string, password: string, role?: string) {
  const { data } = await api.post('/auth/signup', { email, password, role });
  return data;
}

export async function loginWithFirebaseToken(idToken: string) {
  const { data } = await api.post('/auth/firebase', { idToken });
  return data;
}
