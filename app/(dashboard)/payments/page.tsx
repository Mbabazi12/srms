'use client';

import { useState } from 'react';
import { DollarSign, CheckCircle, Clock, AlertCircle, Search, CreditCard } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { usePayments } from '@/hooks/usePayments';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatDate, getPaymentStatusColor } from '@/lib/utils';
import { Payment } from '@/types';

export default function PaymentsPage() {
  const { user } = useAuthStore();
  const { payments, loading, error, updatePayment } = usePayments();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [showMakePayment, setShowMakePayment] = useState(false);

  const filtered = payments.filter(p => {
    const matchSearch = (p.month?.toLowerCase().includes(search.toLowerCase())) ||
      ((p as typeof p & { propertyTitle?: string }).propertyTitle?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalCollected = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const totalOverdue = payments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0);

  const handleMarkPaid = async (payment: Payment) => {
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');
    try {
      await updatePayment(payment.id, 'paid');
      setActionSuccess('Payment marked as paid!');
      setSelectedPayment(null);
      setShowMakePayment(false);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLandlordUpdate = async (payment: Payment, status: string) => {
    setActionLoading(true);
    setActionError('');
    try {
      await updatePayment(payment.id, status);
      setSelectedPayment(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setActionLoading(false);
    }
  };

  const currentMonthPayment = payments.find(p => {
    const now = new Date();
    const monthStr = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    return p.month === monthStr;
  });

  const sortedPayments = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{payments.length} total records</p>
        </div>
        {user?.role === 'tenant' && currentMonthPayment && currentMonthPayment.status !== 'paid' && (
          <Button onClick={() => { setSelectedPayment(currentMonthPayment); setShowMakePayment(true); setActionError(''); setActionSuccess(''); }}>
            <CreditCard className="h-4 w-4" /> Pay Rent Now
          </Button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="sm" className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Collected</p>
            <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(totalCollected)}</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pending</p>
            <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(totalPending)}</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Overdue</p>
            <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(totalOverdue)}</p>
          </div>
        </Card>
      </div>

      {actionSuccess && <Alert type="success" message={actionSuccess} />}
      {error && <Alert type="error" message={error} />}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by month or property..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'paid', 'pending', 'overdue'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors capitalize ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card padding="none">
        <CardHeader className="px-5 pt-5 pb-0">
          <CardTitle>Payment Records</CardTitle>
        </CardHeader>
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" className="text-blue-600" /></div>
        ) : sortedPayments.length === 0 ? (
          <div className="text-center py-16">
            <DollarSign className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 dark:text-slate-400">No payment records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead className="border-y border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Month</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell">Property</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Due Date</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedPayments.map(payment => {
                  const ep = payment as typeof payment & { propertyTitle?: string };
                  return (
                    <tr key={payment.id} className="border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900 dark:text-white">{payment.month}</p>
                        {payment.date && <p className="text-xs text-slate-500 dark:text-slate-400">Paid {formatDate(payment.date)}</p>}
                      </td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400 hidden sm:table-cell truncate max-w-[180px]">{ep.propertyTitle || '—'}</td>
                      <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">{formatCurrency(payment.amount)}</td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{formatDate(payment.dueDate)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPaymentStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {user?.role === 'tenant' && payment.status !== 'paid' && (
                          <Button size="sm" onClick={() => { setSelectedPayment(payment); setShowMakePayment(true); setActionError(''); setActionSuccess(''); }}>
                            Pay Now
                          </Button>
                        )}
                        {user?.role === 'landlord' && payment.status !== 'paid' && (
                          <Button size="sm" variant="secondary" onClick={() => { setSelectedPayment(payment); setActionError(''); }}>
                            Update
                          </Button>
                        )}
                        {payment.status === 'paid' && (
                          <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" /> Paid
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Make payment modal (tenant) */}
      <Modal open={showMakePayment} onClose={() => { setShowMakePayment(false); setSelectedPayment(null); setActionError(''); }} title="Make Payment" size="sm">
        {actionError && <Alert type="error" message={actionError} className="mb-4" />}
        {selectedPayment && (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Month</span>
                <span className="font-medium text-slate-900 dark:text-white">{selectedPayment.month}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Due date</span>
                <span className="font-medium text-slate-900 dark:text-white">{formatDate(selectedPayment.dueDate)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-600">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Total amount</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(selectedPayment.amount)}</span>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Demo payment:</strong> Clicking &ldquo;Confirm Payment&rdquo; will mark this payment as paid instantly. In production, this would integrate with a payment gateway.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => { setShowMakePayment(false); setSelectedPayment(null); }}>Cancel</Button>
              <Button fullWidth loading={actionLoading} onClick={() => handleMarkPaid(selectedPayment)}>
                <CreditCard className="h-4 w-4" /> Confirm Payment
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Landlord update modal */}
      {user?.role === 'landlord' && (
        <Modal open={!!selectedPayment && !showMakePayment} onClose={() => { setSelectedPayment(null); setActionError(''); }} title="Update Payment Status" size="sm">
          {actionError && <Alert type="error" message={actionError} className="mb-4" />}
          {selectedPayment && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Month</span>
                  <span className="font-medium">{selectedPayment.month}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Amount</span>
                  <span className="font-bold">{formatCurrency(selectedPayment.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Current status</span>
                  <Badge variant={selectedPayment.status === 'paid' ? 'success' : selectedPayment.status === 'pending' ? 'warning' : 'danger'}>
                    {selectedPayment.status}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Set status to:</p>
                <div className="flex gap-2">
                  <Button variant="secondary" fullWidth onClick={() => handleLandlordUpdate(selectedPayment, 'paid')} loading={actionLoading}>
                    Mark Paid
                  </Button>
                  <Button variant="outline" fullWidth onClick={() => handleLandlordUpdate(selectedPayment, 'overdue')} loading={actionLoading}>
                    Mark Overdue
                  </Button>
                </div>
              </div>
              <Button variant="ghost" fullWidth onClick={() => setSelectedPayment(null)}>Cancel</Button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
