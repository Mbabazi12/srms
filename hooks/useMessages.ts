'use client';

import { useState, useEffect, useCallback } from 'react';
import { Message, MessageType } from '@/types';

interface SendMessageParams {
  receiverIds: string[];
  messageText: string;
  messageType: MessageType;
}

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/messages');
      const json = await res.json();
      if (res.ok) {
        setMessages(json.data || []);
      } else {
        setError(json.error || 'Failed to load messages');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = async (params: SendMessageParams): Promise<Message> => {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to send message');
    await fetchMessages();
    return json.data as Message;
  };

  const markAsRead = async (messageIds: string[]) => {
    if (messageIds.length === 0) return;
    await fetch('/api/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageIds }),
    });
  };

  return { messages, loading, error, refetch: fetchMessages, sendMessage, markAsRead };
}
