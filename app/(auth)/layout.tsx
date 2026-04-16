import { Building2 } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4">
        <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold text-slate-900 dark:text-white">RentSmart</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-slate-400 py-4">
        &copy; {new Date().getFullYear()} RentSmart. All rights reserved.
      </p>
    </div>
  );
}
