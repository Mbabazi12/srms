'use client';

import { useState } from 'react';
import { User, Mail, Phone, Shield, Calendar, Save } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import { formatDate } from '@/lib/utils';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    setLoading(true);
    setError('');

    // Demo: update locally (in production, call a PATCH /api/profile endpoint)
    await new Promise(r => setTimeout(r, 500));
    if (user) {
      setUser({ ...user, name: form.name.trim(), phone: form.phone.trim() });
    }
    setSuccess('Profile updated successfully!');
    setEditing(false);
    setLoading(false);
    setTimeout(() => setSuccess(''), 3000);
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>

      {success && <Alert type="success" message={success} />}

      {/* Avatar card */}
      <Card>
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-md">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
            <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full font-medium capitalize ${user.role === 'landlord' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
              {user.role}
            </span>
          </div>
        </div>
      </Card>

      {/* Info card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          {!editing && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
        </CardHeader>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            {error && <Alert type="error" message={error} />}
            <Input
              label="Full name"
              value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setError(''); }}
              required
            />
            <Input
              label="Phone number"
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+1 (555) 000-0000"
            />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" fullWidth onClick={() => { setEditing(false); setForm({ name: user.name, phone: user.phone || '' }); setError(''); }}>
                Cancel
              </Button>
              <Button type="submit" fullWidth loading={loading}>
                <Save className="h-4 w-4" /> Save changes
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {[
              { icon: User, label: 'Full name', value: user.name },
              { icon: Mail, label: 'Email address', value: user.email },
              { icon: Phone, label: 'Phone number', value: user.phone || 'Not provided' },
              { icon: Shield, label: 'Account role', value: user.role === 'landlord' ? 'Landlord' : 'Tenant' },
              { icon: Calendar, label: 'Member since', value: formatDate(user.createdAt) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Security card */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Password</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Last updated when account was created</p>
              </div>
            </div>
            <Button size="sm" variant="outline" disabled title="Password change coming soon">
              Change
            </Button>
          </div>
        </div>
      </Card>

      {/* Demo account note */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Demo system:</strong> Profile changes are saved to the client-side store for this session. In a production system, they would be persisted to the database.
        </p>
      </div>
    </div>
  );
}
