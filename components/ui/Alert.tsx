import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  type?: AlertType;
  message: string;
  className?: string;
}

const config: Record<AlertType, { icon: typeof Info; classes: string }> = {
  info: { icon: Info, classes: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' },
  success: { icon: CheckCircle, classes: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' },
  warning: { icon: AlertCircle, classes: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800' },
  error: { icon: XCircle, classes: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' },
};

export default function Alert({ type = 'info', message, className }: AlertProps) {
  const { icon: Icon, classes } = config[type];
  return (
    <div className={cn('flex items-start gap-3 rounded-lg border px-4 py-3 text-sm', classes, className)}>
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
