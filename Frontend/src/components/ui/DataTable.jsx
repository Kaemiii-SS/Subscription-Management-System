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
    <div className={cn('bg-[var(--surface)] backdrop-blur-md rounded-2xl border border-[var(--border)] shadow-xs overflow-hidden flex flex-col', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-white">
          <thead className="bg-[var(--surface-strong)] text-white font-bold uppercase tracking-wider border-b border-[var(--border)]">
            <tr>
              {columns.map((col, idx) => {
                const isSortable = col.sortable && onSort;
                const isCurrentSort = sortField === col.key;
                return (
                  <th
                    key={col.key || idx}
                    scope="col"
                    className={cn(
                      'px-5 py-3.5 select-none font-bold text-white',
                      col.headerClassName,
                      isSortable && 'cursor-pointer hover:text-accent transition-colors'
                    )}
                    onClick={() => isSortable && onSort(col.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {isSortable && (
                        <span className="text-white">
                          {isCurrentSort ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-accent" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-accent" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--border)]/60">
            {isLoading ? (
              // Skeleton loading rows
              Array.from({ length: size || 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="px-5 py-4">
                      <div className="h-4 bg-[var(--surface-strong)]/50 rounded-md w-3/4"></div>
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
                    'transition-colors hover:bg-[var(--accent-soft)]/50',
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
        <div className="px-5 py-3 bg-[var(--surface-strong)] border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white">
          <div>
            Showing <span className="font-bold text-white">{Math.min(total, (page - 1) * size + 1)}</span> to{' '}
            <span className="font-bold text-white">{Math.min(total, page * size)}</span> of{' '}
            <span className="font-bold text-white">{total}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange && onPageChange(page - 1)}
              disabled={page <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-white hover:bg-[var(--accent-soft)] hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold text-white">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange && onPageChange(page + 1)}
              disabled={page >= totalPages || isLoading}
              className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-white hover:bg-[var(--accent-soft)] hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
