'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';

export function useAuth() {
  const { user, isLoading, fetchMe, logout } = useAuthStore();

  useEffect(() => {
    if (!user) {
      fetchMe();
    }
  }, [user, fetchMe]);

  return { user, isLoading, logout };
}
