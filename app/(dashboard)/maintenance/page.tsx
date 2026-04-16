'use client';

import { useState } from 'react';
import { Wrench, Plus, Search, CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { useMaintenance } from '@/hooks/useMaintenance';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate, getMaintenanceStatusColor, getMaintenanceStatusLabel, getPriorityColor } from '@/lib/utils';
import { MaintenanceRequest, MaintenanceStatus } from '@/types';

type EnrichedMaintenance = MaintenanceRequest & { propertyTitle?: string };

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const statusIcons: Record<MaintenanceStatus, typeof CheckCircle> = {
  pending: Clock,
  in_progress: AlertTriangle,
  resolved: CheckCircle,
  rejected: XCircle,
};

function NewRequestForm({ onSubmit, onCancel, loading }: {
  onSubmit: (data: { title: string; issue: string; priority: string }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({ title: '', issue: '', priority: 'medium' });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.issue) { setError('Title and issue description are required'); return; }
    setError('');
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert type="error" message={error} />}
      <Input label="Issue title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Leaking faucet in bathroom" required />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Issue description <span className="text-red-500">*</span></label>
        <textarea
          className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={4}
          value={form.issue}
          onChange={e => setForm(f => ({ ...f, issue: e.target.value }))}
          placeholder="Describe the issue in detail — when it started, how severe it is..."
          required
        />
      </div>
      <Select label="Priority" options={priorityOptions} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} />
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" fullWidth onClick={onCancel}>Cancel</Button>
        <Button type="submit" fullWidth loading={loading}>Submit Request</Button>
      </div>
    </form>
  );
}

export default function MaintenancePage() {
  const { user } = useAuthStore();
  const { requests, loading, error, submitRequest, updateRequest } = useMaintenance();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<EnrichedMaintenance | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [landlordNotes, setLandlordNotes] = useState('');

  const filtered = (requests as EnrichedMaintenance[]).filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.issue.toLowerCase().includes(search.toLowerCase()) ||
      (r.propertyTitle?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleNewRequest = async (data: { title: string; issue: string; priority: string }) => {
    setActionLoading(true);
    setActionError('');
    try {
      await submitRequest(data);
      setShowNew(false);
      setActionSuccess('Maintenance request submitted successfully!');
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to submit');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async (status: MaintenanceStatus) => {
    if (!selected) return;
    setActionLoading(true);
    setActionError('');
    try {
      await updateRequest(selected.id, status, landlordNotes || undefined);
      setSelected(null);
      setLandlordNotes('');
      setActionSuccess(`Request ${status === 'resolved' ? 'resolved' : status === 'rejected' ? 'rejected' : 'updated'}!`);
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setActionLoading(false);
    }
  };

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    resolved: requests.filter(r => r.status === 'resolved').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Maintenance</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{requests.length} total requests</p>
        </div>
        {user?.role === 'tenant' && (
          <Button onClick={() => { setShowNew(true); setActionError(''); }}>
            <Plus className="h-4 w-4" /> New Request
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', count: stats.pending, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'In Progress', count: stats.in_progress, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Resolved', count: stats.resolved, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`rounded-xl p-4 ${bg} text-center`}>
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {actionSuccess && <Alert type="success" message={actionSuccess} />}
      {error && <Alert type="error" message={error} />}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search requests..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'in_progress', 'resolved', 'rejected'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs rounded-lg font-medium transition-colors capitalize ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" className="text-blue-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Wrench className="h-14 w-14 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{search ? 'No results found' : 'No requests yet'}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {search ? 'Try a different search' : user?.role === 'tenant' ? 'Submit a maintenance request if you have an issue' : 'No maintenance requests from tenants yet'}
          </p>
          {!search && user?.role === 'tenant' && (
            <Button className="mt-4" onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4" /> New Request
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {[...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(req => {
            const StatusIcon = statusIcons[req.status];
            return (
              <Card key={req.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelected(req); setLandlordNotes(req.notes || ''); setActionError(''); }}>
                <div className="flex items-start gap-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getMaintenanceStatusColor(req.status)}`}>
                    <StatusIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{req.title}</h3>
                      <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${getMaintenanceStatusColor(req.status)}`}>
                        {getMaintenanceStatusLabel(req.status)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{req.issue}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 dark:text-slate-500">
                      {req.propertyTitle && <span>{req.propertyTitle}</span>}
                      <span>Submitted {formatDate(req.createdAt)}</span>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${getPriorityColor(req.priority)}`}>
                        {req.priority}
                      </span>
                    </div>
                    {req.notes && (
                      <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded text-xs text-slate-600 dark:text-slate-300">
                        <span className="font-medium">Note:</span> {req.notes}
                      </div>
                    )}
                    {req.resolvedAt && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">Resolved {formatDate(req.resolvedAt)}</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* New request modal (tenant) */}
      <Modal open={showNew} onClose={() => { setShowNew(false); setActionError(''); }} title="Submit Maintenance Request">
        {actionError && <Alert type="error" message={actionError} className="mb-4" />}
        <NewRequestForm onSubmit={handleNewRequest} onCancel={() => setShowNew(false)} loading={actionLoading} />
      </Modal>

      {/* Detail / update modal */}
      <Modal open={!!selected} onClose={() => { setSelected(null); setActionError(''); }} title="Maintenance Request" size="lg">
        {actionError && <Alert type="error" message={actionError} className="mb-4" />}
        {selected && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">{selected.title}</h3>
                {selected.propertyTitle && <p className="text-sm text-slate-500 dark:text-slate-400">{selected.propertyTitle}</p>}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getMaintenanceStatusColor(selected.status)}`}>
                  {getMaintenanceStatusLabel(selected.status)}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getPriorityColor(selected.priority)}`}>
                  {selected.priority} priority
                </span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{selected.issue}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Submitted</p>
                <p className="font-medium text-slate-900 dark:text-white">{formatDate(selected.createdAt)}</p>
              </div>
              {selected.resolvedAt && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Resolved</p>
                  <p className="font-medium text-green-600 dark:text-green-400">{formatDate(selected.resolvedAt)}</p>
                </div>
              )}
            </div>

            {selected.notes && (
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">{selected.notes}</p>
              </div>
            )}

            {/* Landlord actions */}
            {user?.role === 'landlord' && (selected.status === 'pending' || selected.status === 'in_progress') && (
              <div className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Landlord actions</p>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Notes (optional)</label>
                  <textarea
                    className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                    value={landlordNotes}
                    onChange={e => setLandlordNotes(e.target.value)}
                    placeholder="Add a note for the tenant..."
                  />
                </div>
                <div className="flex gap-2">
                  {selected.status === 'pending' && (
                    <Button size="sm" variant="secondary" fullWidth onClick={() => handleStatusUpdate('in_progress')} loading={actionLoading}>
                      Mark In Progress
                    </Button>
                  )}
                  <Button size="sm" fullWidth onClick={() => handleStatusUpdate('resolved')} loading={actionLoading}>
                    <CheckCircle className="h-4 w-4" /> Mark Resolved
                  </Button>
                  <Button size="sm" variant="danger" fullWidth onClick={() => handleStatusUpdate('rejected')} loading={actionLoading}>
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {/* Tenant cancel */}
            {user?.role === 'tenant' && selected.status === 'pending' && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <Button variant="danger" fullWidth onClick={() => handleStatusUpdate('rejected')} loading={actionLoading}>
                  Cancel Request
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
