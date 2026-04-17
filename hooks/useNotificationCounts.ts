'use client';

import { useState, useEffect, useCallback } from 'react';

export interface NotificationCounts {
  unreadMessages: number;
  pendingMaintenance: number;
}

export function useNotificationCounts() {
  const [counts, setCounts] = useState<NotificationCounts>({
    unreadMessages: 0,
    pendingMaintenance: 0,
  });

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/counts');
      if (res.ok) {
        const { data } = await res.json();
        setCounts(data);
      }
    } catch {
      // silently fail — sidebar badges are non-critical
    }
  }, []);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 30_000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  return { counts, refetch: fetchCounts };
}
