'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Building2, MapPin, BedDouble, Bath, Ruler,
  Pencil, Trash2, UserPlus, UserMinus, Search,
  DoorOpen, Users,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { useProperties } from '@/hooks/useProperties';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Property, PropertyUnit } from '@/types';
import { cn } from '@/lib/cn';

type Tenant = { id: string; name: string; email: string; phone?: string };

const AMENITY_OPTIONS = [
  'WiFi', 'Parking', 'Gym', 'Laundry', 'Air Conditioning',
  'Garden', 'Garage', 'Rooftop', 'Storage', 'Concierge',
];

// ─── Property Form ─────────────────────────────────────────────────────────────

interface PropertyFormData extends Partial<Property> {
  propertyType?: 'single' | 'apartment';
  unitNames?: string[];
}

function PropertyForm({
  initial,
  onSave,
  onCancel,
  loading,
}: {
  initial?: PropertyFormData;
  onSave: (data: PropertyFormData) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    location: initial?.location || '',
    address: initial?.address || '',
    rent: String(initial?.rent || ''),
    bedrooms: String(initial?.bedrooms ?? ''),
    bathrooms: String(initial?.bathrooms ?? '1'),
    area: String(initial?.area || ''),
    amenities: initial?.amenities || [] as string[],
    propertyType: (initial?.propertyType || 'single') as 'single' | 'apartment',
    unitNames: initial?.units?.map(u => u.unitName) || ['', ''],
  });
  const [error, setError] = useState('');
  const isEdit = !!initial?.id;

  const toggleAmenity = (a: string) =>
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
    }));

  const addUnit = () => setForm(f => ({ ...f, unitNames: [...f.unitNames, ''] }));

  const removeUnit = (idx: number) =>
    setForm(f => ({ ...f, unitNames: f.unitNames.filter((_, i) => i !== idx) }));

  const setUnitName = (idx: number, val: string) =>
    setForm(f => ({ ...f, unitNames: f.unitNames.map((n, i) => (i === idx ? val : n)) }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.location || !form.address || !form.rent) {
      setError('Title, location, address, and rent are required');
      return;
    }
    if (form.propertyType === 'apartment') {
      const validUnits = form.unitNames.filter(n => n.trim());
      if (validUnits.length < 1) {
        setError('Add at least one unit name for an apartment');
        return;
      }
    }
    setError('');
    onSave({
      ...form,
      rent: Number(form.rent),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      area: Number(form.area),
      unitNames: form.unitNames.filter(n => n.trim()),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert type="error" message={error} />}

      <Input
        label="Property title"
        value={form.title}
        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        placeholder="Sunset Apartments Unit 4B"
        required
      />

      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
          Description
        </label>
        <textarea
          className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Describe the property..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="City / Area"
          value={form.location}
          onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
          placeholder="Downtown, New York"
          required
        />
        <Input
          label="Monthly rent ($)"
          type="number"
          value={form.rent}
          onChange={e => setForm(f => ({ ...f, rent: e.target.value }))}
          placeholder="2400"
          required
          min="0"
        />
      </div>

      <Input
        label="Full address"
        value={form.address}
        onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
        placeholder="123 Main St, Apt 2B, New York, NY 10001"
        required
      />

      {/* Property type — only available on create */}
      {!isEdit && (
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
            Property Type
          </label>
          <div className="flex gap-3">
            {(['single', 'apartment'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setForm(f => ({ ...f, propertyType: type }))}
                className={cn(
                  'flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-colors',
                  form.propertyType === type
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-300'
                )}
              >
                {type === 'single' ? '🏠 Single House' : '🏢 Apartment / Multi-unit'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Unit names — only for apartment type on create */}
      {!isEdit && form.propertyType === 'apartment' && (
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
            <DoorOpen className="h-4 w-4 inline mr-1" />
            Units
          </label>
          <div className="space-y-2">
            {form.unitNames.map((name, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`e.g. Door ${String.fromCharCode(65 + idx)}, Room ${idx + 1}`}
                  value={name}
                  onChange={e => setUnitName(idx, e.target.value)}
                />
                {form.unitNames.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeUnit(idx)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addUnit}
              className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              + Add Unit
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Select
          label="Bedrooms"
          options={[
            { value: '0', label: 'Studio' },
            ...Array.from({ length: 6 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })),
          ]}
          value={form.bedrooms}
          onChange={e => setForm(f => ({ ...f, bedrooms: e.target.value }))}
        />
        <Select
          label="Bathrooms"
          options={Array.from({ length: 4 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
          value={form.bathrooms}
          onChange={e => setForm(f => ({ ...f, bathrooms: e.target.value }))}
        />
        <Input
          label="Area (sqft)"
          type="number"
          value={form.area}
          onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
          placeholder="950"
          min="0"
        />
      </div>

      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Amenities</p>
        <div className="flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map(a => (
            <button
              key={a}
              type="button"
              onClick={() => toggleAmenity(a)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full border transition-colors',
                form.amenities.includes(a)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-400'
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} fullWidth>
          Cancel
        </Button>
        <Button type="submit" fullWidth loading={loading}>
          {isEdit ? 'Save changes' : 'Add property'}
        </Button>
      </div>
    </form>
  );
}

// ─── Unit Management Modal ─────────────────────────────────────────────────────

function UnitsModal({
  property,
  tenants,
  onAssign,
  onUnassign,
  onClose,
  loading,
}: {
  property: Property & { units: (PropertyUnit & { tenantName?: string })[] };
  tenants: Tenant[];
  onAssign: (unitId: string, tenantId: string) => Promise<void>;
  onUnassign: (unitId: string) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}) {
  const [selectedTenants, setSelectedTenants] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState('');
  const [activeUnit, setActiveUnit] = useState<string | null>(null);

  const handleAssign = async (unitId: string) => {
    const tenantId = selectedTenants[unitId];
    if (!tenantId) return;
    setActiveUnit(unitId);
    setActionError('');
    try {
      await onAssign(unitId, tenantId);
      setSelectedTenants(prev => { const next = { ...prev }; delete next[unitId]; return next; });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setActiveUnit(null);
    }
  };

  const handleUnassign = async (unitId: string) => {
    setActiveUnit(unitId);
    setActionError('');
    try {
      await onUnassign(unitId);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setActiveUnit(null);
    }
  };

  // Only offer unassigned tenants as options for a given unit
  const assignedTenantIds = property.units.map(u => u.tenantId).filter(Boolean) as string[];
  const availableTenants = tenants.filter(t => !assignedTenantIds.includes(t.id));

  return (
    <div className="space-y-4">
      {actionError && <Alert type="error" message={actionError} />}

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Manage tenant assignments for <strong className="text-slate-900 dark:text-white">{property.title}</strong>
      </p>

      <div className="space-y-3">
        {property.units.map(unit => (
          <div
            key={unit.unitId}
            className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
          >
            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <DoorOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{unit.unitName}</p>
              {unit.status === 'occupied' ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  {unit.tenantName ?? 'Occupied'}
                </p>
              ) : (
                <p className="text-xs text-slate-400">Vacant</p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {unit.status === 'occupied' ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleUnassign(unit.unitId)}
                  loading={loading && activeUnit === unit.unitId}
                >
                  <UserMinus className="h-3.5 w-3.5" /> Remove
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTenants[unit.unitId] || ''}
                    onChange={e =>
                      setSelectedTenants(prev => ({ ...prev, [unit.unitId]: e.target.value }))
                    }
                    className="text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select tenant...</option>
                    {availableTenants.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    onClick={() => handleAssign(unit.unitId)}
                    loading={loading && activeUnit === unit.unitId}
                    disabled={!selectedTenants[unit.unitId]}
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Assign
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 flex justify-end">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

// ─── Status badge helpers ─────────────────────────────────────────────────────

function statusVariant(status: string): 'success' | 'warning' | 'info' {
  if (status === 'occupied') return 'success';
  if (status === 'partial') return 'info';
  return 'warning';
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function PropertiesPage() {
  const { user } = useAuthStore();
  const { properties, loading, error, createProperty, updateProperty, deleteProperty, refetch } =
    useProperties();

  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editProp, setEditProp] = useState<Property | null>(null);
  const [deleteProp, setDeleteProp] = useState<Property | null>(null);
  const [assignProp, setAssignProp] = useState<Property | null>(null);  // single-type assign
  const [unitsProp, setUnitsProp] = useState<Property | null>(null);   // apartment unit management
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (user?.role === 'landlord') {
      fetch('/api/tenants').then(r => r.json()).then(j => { if (j.data) setTenants(j.data); });
    }
  }, [user]);

  const filtered = properties.filter(
    p =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (data: PropertyFormData) => {
    setActionLoading(true);
    setActionError('');
    try {
      const { unitNames, ...rest } = data;
      await createProperty({
        ...rest,
        units: unitNames?.map(name => ({ unitName: name })) as never,
      });
      setShowAdd(false);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (data: PropertyFormData) => {
    if (!editProp) return;
    setActionLoading(true);
    setActionError('');
    try {
      const { unitNames, propertyType, ...rest } = data;
      void unitNames; void propertyType; // ignored on edit — type is immutable after creation
      await updateProperty(editProp.id, rest);
      setEditProp(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProp) return;
    setActionLoading(true);
    try {
      await deleteProperty(deleteProp.id);
      setDeleteProp(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Single-type tenant assignment
  const handleAssign = async () => {
    if (!assignProp || !selectedTenant) return;
    setActionLoading(true);
    setActionError('');
    try {
      await updateProperty(assignProp.id, { tenantId: selectedTenant });
      setAssignProp(null);
      setSelectedTenant('');
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnassign = async (prop: Property) => {
    setActionLoading(true);
    try {
      await updateProperty(prop.id, { tenantId: null } as never);
    } finally {
      setActionLoading(false);
    }
  };

  // Apartment unit operations
  const handleAssignUnit = async (unitId: string, tenantId: string) => {
    if (!unitsProp) return;
    setActionLoading(true);
    try {
      await fetch(`/api/properties/${unitsProp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign-unit', unitId, tenantId }),
      }).then(async r => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Failed');
      });
      await refetch();
      // Refresh the unitsProp reference after refetch
      setUnitsProp(prev => {
        const updated = properties.find(p => p.id === prev?.id);
        return updated ?? prev;
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnassignUnit = async (unitId: string) => {
    if (!unitsProp) return;
    setActionLoading(true);
    try {
      await fetch(`/api/properties/${unitsProp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unassign-unit', unitId }),
      }).then(async r => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Failed');
      });
      await refetch();
      setUnitsProp(prev => {
        const updated = properties.find(p => p.id === prev?.id);
        return updated ?? prev;
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ── Tenant view ─────────────────────────────────────────────────────────────
  if (user?.role === 'tenant') {
    const prop = properties[0] as (Property & { myUnit?: PropertyUnit; landlordName?: string }) | undefined;

    if (loading) {
      return (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" className="text-blue-600" />
        </div>
      );
    }

    if (!prop) {
      return (
        <div className="text-center py-20">
          <Building2 className="h-14 w-14 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">No property assigned</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Your landlord hasn't assigned you to a property yet.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Property</h1>
        <Card>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{prop.title}</h2>
                <p className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  <MapPin className="h-4 w-4" /> {prop.address}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={statusVariant(prop.status)} className="mt-1">
                  {prop.status}
                </Badge>
                {(prop.propertyType ?? 'single') === 'apartment' && prop.myUnit && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                    {prop.myUnit.unitName}
                  </span>
                )}
              </div>
            </div>

            {prop.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300">{prop.description}</p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <BedDouble className="h-5 w-5 text-slate-400 mx-auto mb-1" />
                <p className="font-bold text-slate-900 dark:text-white">
                  {prop.bedrooms === 0 ? 'Studio' : prop.bedrooms}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Bedrooms</p>
              </div>
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <Bath className="h-5 w-5 text-slate-400 mx-auto mb-1" />
                <p className="font-bold text-slate-900 dark:text-white">{prop.bathrooms}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Bathrooms</p>
              </div>
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <Ruler className="h-5 w-5 text-slate-400 mx-auto mb-1" />
                <p className="font-bold text-slate-900 dark:text-white">{prop.area}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Sq ft</p>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="font-bold text-blue-700 dark:text-blue-300 text-lg">
                  {formatCurrency(prop.rent)}
                </p>
                <p className="text-xs text-blue-500 dark:text-blue-400">Per month</p>
              </div>
            </div>

            {prop.amenities.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                  Amenities
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {prop.amenities.map(a => (
                    <span
                      key={a}
                      className="text-xs px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs text-slate-400">Listed {formatDate(prop.createdAt)}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ── Landlord view ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Properties</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'} listed
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" /> Add Property
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search by name or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {error && <Alert type="error" message={error} />}

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" className="text-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Building2 className="h-14 w-14 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {search ? 'No results found' : 'No properties yet'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {search ? 'Try a different search' : 'Add your first property to get started'}
          </p>
          {!search && (
            <Button className="mt-4" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4" /> Add Property
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map(prop => {
            const p = prop as Property & { tenantName?: string };
            const isApartment = (p.propertyType ?? 'single') === 'apartment';
            const units = p.units ?? [];
            const occupiedCount = units.filter(u => u.status === 'occupied').length;

            return (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate">{p.title}</h3>
                      {isApartment && (
                        <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded font-medium flex-shrink-0">
                          Apt
                        </span>
                      )}
                    </div>
                    <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" /> {p.location}
                    </p>
                  </div>
                  <Badge variant={statusVariant(p.status)} className="ml-2 flex-shrink-0">
                    {p.status}
                  </Badge>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <span className="flex items-center gap-1">
                    <BedDouble className="h-3.5 w-3.5" />
                    {p.bedrooms === 0 ? 'Studio' : `${p.bedrooms} bd`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="h-3.5 w-3.5" />
                    {p.bathrooms} ba
                  </span>
                  {p.area > 0 && (
                    <span className="flex items-center gap-1">
                      <Ruler className="h-3.5 w-3.5" />
                      {p.area} sqft
                    </span>
                  )}
                  {isApartment && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {occupiedCount}/{units.length} units
                    </span>
                  )}
                </div>

                {/* Rent + tenant info */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatCurrency(p.rent)}
                    <span className="text-sm font-normal text-slate-400">/mo</span>
                  </span>
                  {!isApartment && p.tenantName && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Tenant: <span className="font-medium text-slate-700 dark:text-slate-300">{p.tenantName}</span>
                    </span>
                  )}
                  {isApartment && units.length > 0 && (
                    <div className="flex gap-0.5">
                      {units.map(u => (
                        <div
                          key={u.unitId}
                          title={`${u.unitName}: ${u.status}`}
                          className={cn(
                            'h-3 w-3 rounded-sm',
                            u.status === 'occupied'
                              ? 'bg-emerald-500'
                              : 'bg-slate-200 dark:bg-slate-600'
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Amenities */}
                {p.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {p.amenities.slice(0, 4).map(a => (
                      <span
                        key={a}
                        className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded"
                      >
                        {a}
                      </span>
                    ))}
                    {p.amenities.length > 4 && (
                      <span className="text-xs px-2 py-0.5 text-slate-400">
                        +{p.amenities.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <Button size="sm" variant="ghost" onClick={() => setEditProp(p)} className="flex-1">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>

                  {isApartment ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => { setUnitsProp(p); setActionError(''); }}
                      className="flex-1"
                    >
                      <DoorOpen className="h-3.5 w-3.5" /> Manage Units
                    </Button>
                  ) : p.status === 'vacant' ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => { setAssignProp(p); setActionError(''); }}
                      className="flex-1"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Assign Tenant
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleUnassign(p)}
                      loading={actionLoading}
                      className="flex-1"
                    >
                      <UserMinus className="h-3.5 w-3.5" /> Remove Tenant
                    </Button>
                  )}

                  <Button size="sm" variant="danger" onClick={() => setDeleteProp(p)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setActionError(''); }} title="Add New Property" size="lg">
        {actionError && <Alert type="error" message={actionError} className="mb-4" />}
        <PropertyForm onSave={handleCreate} onCancel={() => setShowAdd(false)} loading={actionLoading} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editProp} onClose={() => { setEditProp(null); setActionError(''); }} title="Edit Property" size="lg">
        {actionError && <Alert type="error" message={actionError} className="mb-4" />}
        {editProp && (
          <PropertyForm
            initial={editProp}
            onSave={handleEdit}
            onCancel={() => setEditProp(null)}
            loading={actionLoading}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteProp} onClose={() => setDeleteProp(null)} title="Delete Property" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          Are you sure you want to delete <strong>{deleteProp?.title}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setDeleteProp(null)}>Cancel</Button>
          <Button variant="danger" fullWidth onClick={handleDelete} loading={actionLoading}>Delete</Button>
        </div>
      </Modal>

      {/* Single-type tenant assignment */}
      <Modal
        open={!!assignProp}
        onClose={() => { setAssignProp(null); setSelectedTenant(''); setActionError(''); }}
        title="Assign Tenant"
        size="sm"
      >
        {actionError && <Alert type="error" message={actionError} className="mb-4" />}
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          Assigning tenant to: <strong>{assignProp?.title}</strong>
        </p>
        <Select
          label="Select tenant"
          options={tenants.map(t => ({ value: t.id, label: `${t.name} (${t.email})` }))}
          placeholder="Choose a tenant..."
          value={selectedTenant}
          onChange={e => setSelectedTenant(e.target.value)}
        />
        <div className="flex gap-3 mt-4">
          <Button variant="outline" fullWidth onClick={() => setAssignProp(null)}>Cancel</Button>
          <Button fullWidth onClick={handleAssign} loading={actionLoading} disabled={!selectedTenant}>
            Assign
          </Button>
        </div>
      </Modal>

      {/* Apartment unit management */}
      <Modal
        open={!!unitsProp}
        onClose={() => { setUnitsProp(null); setActionError(''); }}
        title="Manage Units"
        size="lg"
      >
        {unitsProp && (
          <UnitsModal
            property={unitsProp as Property & { units: (PropertyUnit & { tenantName?: string })[] }}
            tenants={tenants}
            onAssign={handleAssignUnit}
            onUnassign={handleUnassignUnit}
            onClose={() => setUnitsProp(null)}
            loading={actionLoading}
          />
        )}
      </Modal>
    </div>
  );
}
