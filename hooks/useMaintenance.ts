'use client';

import { useState, useEffect, useCallback } from 'react';
import { MaintenanceRequest } from '@/types';

export type EnrichedMaintenance = MaintenanceRequest & { propertyTitle?: string };

export function useMaintenance() {
  const [requests, setRequests] = useState<EnrichedMaintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/maintenance');
      const json = await res.json();
      if (res.ok) {
        setRequests(json.data || []);
      } else {
        setError(json.error || 'Failed to load maintenance requests');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const submitRequest = async (data: { title: string; issue: string; priority: string }) => {
    const res = await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to submit request');
    await fetchRequests();
    return json.data;
  };

  const updateRequest = async (id: string, status: string, notes?: string) => {
    const res = await fetch(`/api/maintenance/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update request');
    await fetchRequests();
    return json.data;
  };

  return { requests, loading, error, refetch: fetchRequests, submitRequest, updateRequest };
}
