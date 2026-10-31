import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  statusFilter,
  onStatusChange,
  statusOptions = [],
  extraFilters,
  children,
  className = '',
}) {
  return (
    <div
      className={cn(
        'bg-surface p-3.5 rounded-2xl border border-border shadow-xs flex flex-wrap items-center justify-between gap-3',
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
        {/* Search */}
        {onSearchChange && (
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-textSecondary absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 text-xs bg-background border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-textPrimary placeholder-textSecondary font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-textSecondary hover:text-textPrimary p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Status Dropdown */}
        {onStatusChange && statusOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="py-2 px-3 text-xs bg-background border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-textPrimary font-semibold cursor-pointer"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {extraFilters}
      </div>

      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}
