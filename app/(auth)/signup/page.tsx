'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, UserPlus, Building2, User } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import { UserRole } from '@/types';
import { cn } from '@/lib/cn';

export default function SignupPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: '' as UserRole | '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role) { setError('Please select your account type'); return; }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Signup failed');
        return;
      }

      setUser(json.data);
      router.push('/dashboard');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create account</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Join RentSmart today</p>
        </div>

        {error && <Alert type="error" message={error} className="mb-4" />}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selection */}
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              I am a <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'landlord', label: 'Landlord', icon: Building2, desc: 'I own properties' },
                { value: 'tenant', label: 'Tenant', icon: User, desc: 'I rent a property' },
              ].map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setForm(f => ({ ...f, role: value as UserRole })); setError(''); }}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center',
                    form.role === value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-slate-500 text-slate-600 dark:text-slate-400'
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <div>
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="text-xs opacity-75">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Full name"
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
            autoComplete="name"
          />

          <Input
            label="Email address"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />

          <Input
            label="Phone number"
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+1 (555) 000-0000"
            autoComplete="tel"
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2.5 pr-10 text-sm text-slate-900 dark:text-white placeholder-slate-400 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
            <UserPlus className="h-4 w-4" />
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
