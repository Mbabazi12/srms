'use client';

import { useState, useEffect, useCallback } from 'react';
import { Payment } from '@/types';

export type EnrichedPayment = Payment & { propertyTitle?: string; propertyAddress?: string };

export function usePayments() {
  const [payments, setPayments] = useState<EnrichedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payments');
      const json = await res.json();
      if (res.ok) {
        setPayments(json.data || []);
      } else {
        setError(json.error || 'Failed to load payments');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const updatePayment = async (id: string, status: string, notes?: string) => {
    const res = await fetch(`/api/payments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update payment');
    await fetchPayments();
    return json.data;
  };

  return { payments, loading, error, refetch: fetchPayments, updatePayment };
}
