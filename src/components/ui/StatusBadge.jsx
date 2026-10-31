import React from 'react';
import { cn } from '../../lib/utils';
import { STATUS_COLORS } from '../../constants/status';

export default function StatusBadge({ status, isOverdue = false, className = '' }) {
  if (isOverdue) {
    return (
      <span
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
          STATUS_COLORS['Overdue'],
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-ping"></span>
        Overdue
      </span>
    );
  }

  const colorClass = STATUS_COLORS[status] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize',
        colorClass,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 mr-1.5"></span>
      {status}
    </span>
  );
}
