'use client';

import { useState, useEffect, useCallback } from 'react';
import { Property } from '@/types';

export function useProperties() {
  const [properties, setProperties] = useState<(Property & { tenantName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/properties');
      const json = await res.json();
      if (res.ok) {
        setProperties(json.data || []);
      } else {
        setError(json.error || 'Failed to load properties');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const createProperty = async (data: Partial<Property>) => {
    const res = await fetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create property');
    await fetchProperties();
    return json.data;
  };

  const updateProperty = async (id: string, data: Partial<Property & { tenantId: string | null }>) => {
    const res = await fetch(`/api/properties/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update property');
    await fetchProperties();
    return json.data;
  };

  const deleteProperty = async (id: string) => {
    const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete property');
    await fetchProperties();
  };

  return { properties, loading, error, refetch: fetchProperties, createProperty, updateProperty, deleteProperty };
}
