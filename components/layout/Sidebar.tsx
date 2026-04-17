'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Wrench,
  User,
  X,
  Home,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { UserRole } from '@/types';

interface SidebarProps {
  role: UserRole;
  open: boolean;
  onClose: () => void;
  badges?: Partial<Record<string, number>>;
}

const landlordNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/properties', label: 'Properties', icon: Building2 },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: User },
];

const tenantNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/properties', label: 'My Property', icon: Home },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function Sidebar({ role, open, onClose, badges = {} }: SidebarProps) {
  const pathname = usePathname();
  const navItems = role === 'landlord' ? landlordNav : tenantNav;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200 dark:border-slate-700">
        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">RentSmart</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{role} Portal</p>
        </div>
        {/* Mobile close */}
        <button
          className="ml-auto lg:hidden p-1 rounded text-slate-500 hover:text-slate-700 dark:hover:text-white"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          const badge = badges[href];
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Icon className={cn('h-5 w-5 flex-shrink-0', active ? 'text-blue-600 dark:text-blue-400' : '')} />
              <span className="flex-1">{label}</span>
              {badge != null && badge > 0 && (
                <span className="ml-auto min-w-[1.25rem] h-5 flex items-center justify-center text-xs font-bold rounded-full bg-red-500 text-white px-1 leading-none">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Role badge */}
      <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
        <div className={cn(
          'text-center text-xs font-medium py-1.5 rounded-full',
          role === 'landlord'
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
        )}>
          {role === 'landlord' ? '🏠 Landlord Account' : '🧑‍💼 Tenant Account'}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-full">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 lg:hidden flex flex-col',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
