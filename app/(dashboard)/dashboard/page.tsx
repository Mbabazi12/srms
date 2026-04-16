'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import {
  Building2, Users, DollarSign, AlertTriangle,
  Wrench, CheckCircle, Clock, TrendingUp,
} from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatDate, getPaymentStatusColor, getMaintenanceStatusColor, getMaintenanceStatusLabel } from '@/lib/utils';
import { Payment, Property, MaintenanceRequest } from '@/types';

type EnrichedPayment = Payment & { propertyTitle?: string };
type EnrichedMaintenance = MaintenanceRequest & { propertyTitle?: string };

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // Landlord state
  const [properties, setProperties] = useState<Property[]>([]);
  const [payments, setPayments] = useState<EnrichedPayment[]>([]);
  const [maintenance, setMaintenance] = useState<EnrichedMaintenance[]>([]);

  // Tenant state
  const [myProperty, setMyProperty] = useState<Property | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [propsRes, paysRes, maintRes] = await Promise.all([
          fetch('/api/properties'),
          fetch('/api/payments'),
          fetch('/api/maintenance'),
        ]);
        const [propsJson, paysJson, maintJson] = await Promise.all([
          propsRes.json(), paysRes.json(), maintRes.json(),
        ]);

        if (propsJson.data) {
          setProperties(propsJson.data);
          if (user?.role === 'tenant') setMyProperty(propsJson.data[0] || null);
        }
        if (paysJson.data) setPayments(paysJson.data);
        if (maintJson.data) setMaintenance(maintJson.data);
      } finally {
        setLoading(false);
      }
    };
    if (user) load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" className="text-blue-600" />
      </div>
    );
  }

  if (user?.role === 'landlord') {
    return <LandlordDashboard properties={properties} payments={payments} maintenance={maintenance} />;
  }

  return <TenantDashboard myProperty={myProperty} payments={payments} maintenance={maintenance} />;
}

// ─── Landlord Dashboard ────────────────────────────────────────────────────────

function LandlordDashboard({ properties, payments, maintenance }: {
  properties: Property[];
  payments: EnrichedPayment[];
  maintenance: EnrichedMaintenance[];
}) {
  const occupied = properties.filter(p => p.status === 'occupied').length;
  const vacant = properties.filter(p => p.status === 'vacant').length;
  const collected = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const pendingAmt = payments.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0);
  const openMaintenance = maintenance.filter(m => m.status === 'pending' || m.status === 'in_progress').length;

  const recentPayments = [...payments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const recentMaintenance = [...maintenance].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Welcome back! Here&apos;s your portfolio overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Properties" value={properties.length} icon={Building2} color="blue" />
        <StatsCard title="Occupied Units" value={`${occupied} / ${properties.length}`} icon={Users} color="green" subtitle={`${vacant} vacant`} />
        <StatsCard title="Rent Collected" value={formatCurrency(collected)} icon={DollarSign} color="green" subtitle="This year" />
        <StatsCard title="Pending Payments" value={formatCurrency(pendingAmt)} icon={AlertTriangle} color="amber" subtitle={`${payments.filter(p => p.status !== 'paid').length} invoices`} />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent payments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <a href="/payments" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View all</a>
          </CardHeader>
          <div className="space-y-3">
            {recentPayments.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No payments yet</p>
            )}
            {recentPayments.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{p.month}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{p.propertyTitle}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(p.amount)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPaymentStatusColor(p.status)}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Maintenance */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Maintenance Requests</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">{openMaintenance} open</p>
            </div>
            <a href="/maintenance" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View all</a>
          </CardHeader>
          <div className="space-y-3">
            {recentMaintenance.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No maintenance requests</p>
            )}
            {recentMaintenance.map(m => (
              <div key={m.id} className="flex items-start justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{m.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{m.propertyTitle} · {formatDate(m.createdAt)}</p>
                </div>
                <span className={`ml-2 flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${getMaintenanceStatusColor(m.status)}`}>
                  {getMaintenanceStatusLabel(m.status)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Property list */}
      <Card>
        <CardHeader>
          <CardTitle>Properties Overview</CardTitle>
          <a href="/properties" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Manage</a>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-2 px-3 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Property</th>
                <th className="text-left py-2 px-3 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide hidden sm:table-cell">Location</th>
                <th className="text-left py-2 px-3 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Rent</th>
                <th className="text-left py-2 px-3 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {properties.map(p => (
                <tr key={p.id} className="border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="py-3 px-3">
                    <p className="font-medium text-slate-900 dark:text-white">{p.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 sm:hidden">{p.location}</p>
                  </td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400 hidden sm:table-cell">{p.location}</td>
                  <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">{formatCurrency(p.rent)}/mo</td>
                  <td className="py-3 px-3">
                    <Badge variant={p.status === 'occupied' ? 'success' : 'warning'}>
                      {p.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {properties.length === 0 && (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-6">No properties listed yet. <a href="/properties" className="text-blue-600 hover:underline">Add one</a></p>
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── Tenant Dashboard ─────────────────────────────────────────────────────────

function TenantDashboard({ myProperty, payments, maintenance }: {
  myProperty: Property | null;
  payments: EnrichedPayment[];
  maintenance: EnrichedMaintenance[];
}) {
  const latestPayment = [...payments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  const openRequests = maintenance.filter(m => m.status === 'pending' || m.status === 'in_progress').length;
  const resolvedRequests = maintenance.filter(m => m.status === 'resolved').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track your rent, payments, and maintenance.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Monthly Rent"
          value={myProperty ? formatCurrency(myProperty.rent) : 'N/A'}
          icon={DollarSign}
          color="blue"
          subtitle="Per month"
        />
        <StatsCard
          title="Current Status"
          value={latestPayment?.status ?? 'N/A'}
          icon={latestPayment?.status === 'paid' ? CheckCircle : AlertTriangle}
          color={latestPayment?.status === 'paid' ? 'green' : 'amber'}
          subtitle={latestPayment?.month}
        />
        <StatsCard
          title="Open Requests"
          value={openRequests}
          icon={Wrench}
          color="amber"
          subtitle={`${resolvedRequests} resolved`}
        />
        <StatsCard
          title="Total Paid"
          value={formatCurrency(payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0))}
          icon={TrendingUp}
          color="green"
          subtitle="All time"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My property */}
        <Card>
          <CardHeader>
            <CardTitle>My Property</CardTitle>
            <a href="/properties" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View details</a>
          </CardHeader>
          {myProperty ? (
            <div className="space-y-3">
              <p className="font-semibold text-slate-900 dark:text-white">{myProperty.title}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{myProperty.address}</p>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: 'Bedrooms', value: myProperty.bedrooms === 0 ? 'Studio' : myProperty.bedrooms },
                  { label: 'Bathrooms', value: myProperty.bathrooms },
                  { label: 'Area', value: `${myProperty.area} sqft` },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                  </div>
                ))}
              </div>
              {myProperty.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {myProperty.amenities.map(a => (
                    <span key={a} className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md">{a}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No property assigned yet</p>
            </div>
          )}
        </Card>

        {/* Recent payments */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <a href="/payments" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View all</a>
          </CardHeader>
          <div className="space-y-2">
            {payments.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No payment records</p>
            )}
            {[...payments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{p.month}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Due {formatDate(p.dueDate)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{formatCurrency(p.amount)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPaymentStatusColor(p.status)}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Maintenance summary */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Requests</CardTitle>
          <a href="/maintenance" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View all</a>
        </CardHeader>
        <div className="space-y-2">
          {maintenance.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No maintenance requests submitted</p>
          )}
          {[...maintenance].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4).map(m => (
            <div key={m.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{m.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(m.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                {m.status === 'pending' && <Clock className="h-3.5 w-3.5 text-amber-500" />}
                {m.status === 'resolved' && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getMaintenanceStatusColor(m.status)}`}>
                  {getMaintenanceStatusLabel(m.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
