import { PaymentStatus, MaintenanceStatus, MaintenancePriority } from '@/types';

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A';
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(dateStr));
}

export function formatDateLong(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateStr));
}

export function getPaymentStatusColor(status: PaymentStatus): string {
  switch (status) {
    case 'paid': return 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400';
    case 'pending': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400';
    case 'overdue': return 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400';
  }
}

export function getMaintenanceStatusColor(status: MaintenanceStatus): string {
  switch (status) {
    case 'pending': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400';
    case 'in_progress': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400';
    case 'resolved': return 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400';
    case 'rejected': return 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400';
  }
}

export function getPriorityColor(priority: MaintenancePriority): string {
  switch (priority) {
    case 'low': return 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300';
    case 'medium': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400';
    case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400';
    case 'urgent': return 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400';
  }
}

export function getMaintenanceStatusLabel(status: MaintenanceStatus): string {
  switch (status) {
    case 'pending': return 'Pending';
    case 'in_progress': return 'In Progress';
    case 'resolved': return 'Resolved';
    case 'rejected': return 'Rejected';
  }
}

export function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
}

export function stripSensitiveFields<T extends { passwordHash?: string }>(user: T): Omit<T, 'passwordHash'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safe } = user;
  return safe;
}
