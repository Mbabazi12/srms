'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Login failed');
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

  const fillDemo = (email: string) => {
    setForm({ email, password: 'password123' });
    setError('');
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sign in to your RentSmart account</p>
        </div>
{/* 
        Demo accounts
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">Demo Accounts (click to fill)</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('alice@example.com')}
              className="text-xs px-3 py-1.5 bg-white dark:bg-slate-700 border border-blue-200 dark:border-slate-600 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors text-left"
            >
              <span className="font-medium">🏠 Landlord</span><br />alice@example.com
            </button>
            <button
              type="button"
              onClick={() => fillDemo('bob@example.com')}
              className="text-xs px-3 py-1.5 bg-white dark:bg-slate-700 border border-blue-200 dark:border-slate-600 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors text-left"
            >
              <span className="font-medium">🧑‍💼 Tenant</span><br />bob@example.com
            </button>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">Password: password123</p>
        </div> */}

        {error && <Alert type="error" message={error} className="mb-4" />}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="••••••••"
                required
                autoComplete="current-password"
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
            <LogIn className="h-4 w-4" />
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
