import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate';
  subtitle?: string;
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    text: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    icon: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
    text: 'text-green-600 dark:text-green-400',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    text: 'text-amber-600 dark:text-amber-400',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
    text: 'text-red-600 dark:text-red-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
    text: 'text-purple-600 dark:text-purple-400',
  },
  slate: {
    bg: 'bg-slate-50 dark:bg-slate-800',
    icon: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
    text: 'text-slate-600 dark:text-slate-400',
  },
};

export default function StatsCard({ title, value, icon: Icon, change, color = 'blue', subtitle }: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div className={cn('rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-800 shadow-sm')}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', colors.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      {(change || subtitle) && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{change || subtitle}</p>
      )}
    </div>
  );
}
