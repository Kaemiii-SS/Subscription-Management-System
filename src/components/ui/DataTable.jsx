import React from 'react';
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import EmptyState from './EmptyState';
import { cn } from '../../lib/utils';

export default function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  total = 0,
  page = 1,
  size = 10,
  onPageChange,
  onRowClick,
  emptyTitle,
  emptyDescription,
  emptyAction,
  sortField,
  sortDirection = 'asc',
  onSort,
  className = '',
}) {
  const totalPages = Math.max(1, Math.ceil(total / size));
  const hasPagination = onPageChange && total > size;

  return (
    <div className={cn('bg-surface rounded-2xl border border-border shadow-xs overflow-hidden flex flex-col', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-textPrimary">
          <thead className="bg-background text-textSecondary font-bold uppercase tracking-wider border-b border-border">
            <tr>
              {columns.map((col, idx) => {
                const isSortable = col.sortable && onSort;
                const isCurrentSort = sortField === col.key;
                return (
                  <th
                    key={col.key || idx}
                    scope="col"
                    className={cn(
                      'px-5 py-3.5 select-none',
                      col.headerClassName,
                      isSortable && 'cursor-pointer hover:text-textPrimary transition-colors'
                    )}
                    onClick={() => isSortable && onSort(col.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {isSortable && (
                        <span className="text-textSecondary">
                          {isCurrentSort ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-primary" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-primary" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {isLoading ? (
              // Skeleton loading rows
              Array.from({ length: size || 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="px-5 py-4">
                      <div className="h-4 bg-background rounded-md w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => (
                <tr
                  key={row.id || rIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(
                    'transition-colors hover:bg-background/80',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map((col, cIdx) => (
                    <td key={col.key || cIdx} className={cn('px-5 py-3.5', col.className)}>
                      {col.render ? col.render(row, rIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {(hasPagination || total > 0) && (
        <div className="px-5 py-3 bg-background/60 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-textSecondary">
          <div>
            Showing <span className="font-bold text-textPrimary">{Math.min(total, (page - 1) * size + 1)}</span> to{' '}
            <span className="font-bold text-textPrimary">{Math.min(total, page * size)}</span> of{' '}
            <span className="font-bold text-textPrimary">{total}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange && onPageChange(page - 1)}
              disabled={page <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-border bg-surface hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-semibold text-textPrimary">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange && onPageChange(page + 1)}
              disabled={page >= totalPages || isLoading}
              className="p-1.5 rounded-lg border border-border bg-surface hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
