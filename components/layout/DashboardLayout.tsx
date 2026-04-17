'use client';

import { useState } from 'react';
import { UserRole } from '@/types';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useNotificationCounts } from '@/hooks/useNotificationCounts';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: UserRole;
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { counts } = useNotificationCounts();

  const badges: Partial<Record<string, number>> = {
    '/messages': counts.unreadMessages,
    ...(role === 'landlord' ? { '/maintenance': counts.pendingMaintenance } : {}),
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <Sidebar role={role} open={sidebarOpen} onClose={() => setSidebarOpen(false)} badges={badges} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
