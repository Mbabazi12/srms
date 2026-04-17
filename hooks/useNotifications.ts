'use client';

import { useState, useCallback } from 'react';

export interface NotificationItem {
  id: string;
  type: 'message' | 'maintenance';
  title: string;
  body: string;
  href: string;
  messageType?: string;
  priority?: string;
  createdAt: string;
  messageIds?: string[];
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const { data } = await res.json();
        setNotifications(data ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  const markMessageRead = useCallback(async (messageIds: string[]) => {
    if (!messageIds.length) return;
    await fetch('/api/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageIds }),
    });
    setNotifications(prev =>
      prev.filter(n => !(n.type === 'message' && n.messageIds?.some(id => messageIds.includes(id))))
    );
  }, []);

  const markAllRead = useCallback(async () => {
    const allMessageIds = notifications
      .filter(n => n.type === 'message')
      .flatMap(n => n.messageIds ?? []);
    if (!allMessageIds.length) return;
    await fetch('/api/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageIds: allMessageIds }),
    });
    setNotifications(prev => prev.filter(n => n.type !== 'message'));
  }, [notifications]);

  return { notifications, loading, fetchNotifications, markMessageRead, markAllRead };
}
