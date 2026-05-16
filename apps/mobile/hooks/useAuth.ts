import { create } from 'zustand';
import { getToken, setToken, setUserId, setRole, clearToken, getUserId, getRole } from '../lib/storage';

interface AuthState {
  token: string | null;
  userId: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoaded: boolean;
  login: (token: string, userId: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  load: () => Promise<void>;
}

function parseJwt(token: string): { sub?: string; role?: string } {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return {};
  }
}

export const useAuth = create<AuthState>((set) => ({
  token: null,
  userId: null,
  role: null,
  isAuthenticated: false,
  isLoaded: false,

  load: async () => {
    const token = await getToken();
    const userId = await getUserId();
    const role = await getRole();
    set({ token, userId, role, isAuthenticated: !!token, isLoaded: true });
  },

  login: async (token, userId, role) => {
    await setToken(token);
    await setUserId(userId);
    await setRole(role);
    set({ token, userId, role, isAuthenticated: true });
  },

  logout: async () => {
    await clearToken();
    set({ token: null, userId: null, role: null, isAuthenticated: false });
  },
}));
