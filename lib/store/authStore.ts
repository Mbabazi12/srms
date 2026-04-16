'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,

      setUser: (user) => set({ user }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        set({ user: null });
      },

      fetchMe: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/auth/me');
          if (res.ok) {
            const { data } = await res.json();
            set({ user: data });
          } else {
            set({ user: null });
          }
        } catch {
          set({ user: null });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

export function isLandlord(role?: UserRole): boolean {
  return role === 'landlord';
}

export function isTenant(role?: UserRole): boolean {
  return role === 'tenant';
}
