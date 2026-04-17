'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const TIMEOUT_MS = 5 * 60 * 1000;   // 5 minutes
const WARNING_MS = 4 * 60 * 1000;   // warn at 4 minutes (1 minute remaining)
const CHECK_MS   = 10_000;           // check every 10 seconds

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, fetchMe, logout } = useAuthStore();
  const router = useRouter();

  const lastActivityRef = useRef(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  // ── session validation ─────────────────────────────────────────────────────
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // ── inactivity timeout ─────────────────────────────────────────────────────
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    setSecondsLeft(60);
  }, []);

  // Track user activity
  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const;
    const handler = () => resetTimer();
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    return () => events.forEach(e => window.removeEventListener(e, handler));
  }, [resetTimer]);

  // Polling interval — checks idle time and updates countdown
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current;

      if (idle >= TIMEOUT_MS) {
        logout().then(() => router.push('/login'));
        return;
      }

      if (idle >= WARNING_MS) {
        const remaining = Math.ceil((TIMEOUT_MS - idle) / 1000);
        setSecondsLeft(remaining);
        setShowWarning(true);
      }
    }, CHECK_MS);

    return () => clearInterval(interval);
  }, [user, logout, router]);

  // ── render ─────────────────────────────────────────────────────────────────
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <LoadingSpinner size="lg" className="text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <DashboardLayout role={user.role}>{children}</DashboardLayout>

      {/* Inactivity warning modal */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
              <svg className="h-7 w-7 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Session Expiring</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                You&apos;ve been inactive. You will be logged out in{' '}
                <span className="font-bold text-amber-600 dark:text-amber-400">{secondsLeft}s</span>.
              </p>
            </div>
            <button
              onClick={resetTimer}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
            >
              Stay Logged In
            </button>
          </div>
        </div>
      )}
    </>
  );
}
