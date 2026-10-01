import { create } from 'zustand';
import { api } from '@/lib/api';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: AdminUser | null;
  status: 'idle' | 'loading' | 'ready';
  check: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  expire: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  check: async () => {
    set({ status: 'loading' });
    try {
      const { user } = await api<{ user: AdminUser }>('/auth/me');
      set({ user, status: 'ready' });
    } catch {
      set({ user: null, status: 'ready' });
    }
  },
  login: async (email, password) => {
    const { user } = await api<{ user: AdminUser }>('/auth/login', { method: 'POST', body: { email, password } });
    set({ user, status: 'ready' });
  },
  logout: async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    set({ user: null });
  },
  expire: () => set({ user: null }),
}));
