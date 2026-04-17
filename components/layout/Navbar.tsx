'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu, Moon, Sun, LogOut, User, ChevronDown,
  Bell, MessageSquare, Wrench, AlertTriangle, Megaphone, CheckCheck,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/lib/store/authStore';
import { useNotificationCounts } from '@/hooks/useNotificationCounts';
import { useNotifications, type NotificationItem } from '@/hooks/useNotifications';
import { cn } from '@/lib/cn';

interface NavbarProps {
  onMenuClick: () => void;
}

type OpenPanel = null | 'notif' | 'user';

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const MSG_ICON: Record<string, React.ElementType> = {
  urgent: AlertTriangle,
  warning: Bell,
  announcement: Megaphone,
  normal: MessageSquare,
};

const MSG_ICON_COLOR: Record<string, string> = {
  urgent: 'text-red-500 dark:text-red-400',
  warning: 'text-amber-500 dark:text-amber-400',
  announcement: 'text-blue-500 dark:text-blue-400',
  normal: 'text-slate-500 dark:text-slate-400',
};

const MSG_BG: Record<string, string> = {
  urgent: 'bg-red-100 dark:bg-red-900/30',
  warning: 'bg-amber-100 dark:bg-amber-900/30',
  announcement: 'bg-blue-100 dark:bg-blue-900/30',
  normal: 'bg-slate-100 dark:bg-slate-700',
};

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState<OpenPanel>(null);

  const { counts, refetch: refetchCounts } = useNotificationCounts();
  const { notifications, loading, fetchNotifications, markMessageRead, markAllRead } =
    useNotifications();

  const totalCount = counts.unreadMessages + counts.pendingMaintenance;
  const hasMessages = notifications.some(n => n.type === 'message');

  // Fetch notification items whenever the panel opens
  useEffect(() => {
    if (open === 'notif') fetchNotifications();
  }, [open, fetchNotifications]);

  const handleLogout = async () => {
    setOpen(null);
    await logout();
    router.push('/login');
  };

  const handleNotifClick = async (notif: NotificationItem) => {
    setOpen(null);
    if (notif.type === 'message' && notif.messageIds?.length) {
      await markMessageRead(notif.messageIds);
      refetchCounts();
    }
    router.push(notif.href);
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    refetchCounts();
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <header className="h-16 flex items-center px-4 sm:px-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 mr-3"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      {/* Shared overlay — closes whichever panel is open */}
      {open && (
        <div className="fixed inset-0 z-10" onClick={() => setOpen(null)} />
      )}

      {/* Right side actions */}
      <div className="flex items-center gap-1.5">

        {/* Dark mode toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* ── Notification bell ───────────────────────────────────────────── */}
        <div className="relative z-20">
          <button
            onClick={() => setOpen(o => o === 'notif' ? null : 'notif')}
            className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {totalCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] flex items-center justify-center text-[10px] font-bold rounded-full bg-red-500 text-white px-0.5 leading-none">
                {totalCount > 99 ? '99+' : totalCount}
              </span>
            )}
          </button>

          {open === 'notif' && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Notifications
                  </h3>
                  {totalCount > 0 && (
                    <span className="text-xs font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                      {totalCount}
                    </span>
                  )}
                </div>
                {hasMessages && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Panel body */}
              <div className="max-h-[22rem] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <span className="h-5 w-5 border-2 border-slate-200 dark:border-slate-600 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <Bell className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      All caught up!
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      No new notifications
                    </p>
                  </div>
                ) : (
                  notifications.map(notif => {
                    const isMsg = notif.type === 'message';
                    const msgType = notif.messageType ?? 'normal';
                    const IconEl = isMsg
                      ? (MSG_ICON[msgType] ?? MessageSquare)
                      : Wrench;
                    const iconColor = isMsg
                      ? (MSG_ICON_COLOR[msgType] ?? MSG_ICON_COLOR.normal)
                      : 'text-orange-500 dark:text-orange-400';
                    const iconBg = isMsg
                      ? (MSG_BG[msgType] ?? MSG_BG.normal)
                      : 'bg-orange-100 dark:bg-orange-900/30';

                    return (
                      <button
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors text-left"
                      >
                        {/* Icon */}
                        <div className={cn(
                          'flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-0.5',
                          iconBg
                        )}>
                          <IconEl className={cn('h-4 w-4', iconColor)} />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white leading-snug truncate">
                            {notif.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {notif.body}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {formatRelative(notif.createdAt)}
                          </p>
                        </div>

                        {/* Unread dot for messages */}
                        {isMsg && (
                          <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Panel footer */}
              {notifications.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-2.5 flex gap-3">
                  <button
                    onClick={() => { setOpen(null); router.push('/messages'); }}
                    className="flex-1 text-xs text-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors py-1"
                  >
                    View messages
                  </button>
                  <button
                    onClick={() => { setOpen(null); router.push('/maintenance'); }}
                    className="flex-1 text-xs text-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors py-1"
                  >
                    View maintenance
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── User menu ───────────────────────────────────────────────────── */}
        <div className="relative z-20">
          <button
            onClick={() => setOpen(o => o === 'user' ? null : 'user')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-900 dark:text-white leading-none">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
          </button>

          {open === 'user' && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
              <a
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                onClick={() => setOpen(null)}
              >
                <User className="h-4 w-4" /> Profile
              </a>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
