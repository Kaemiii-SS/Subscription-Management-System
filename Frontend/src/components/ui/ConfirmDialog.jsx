import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ConfirmDialog({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md bg-[var(--surface-strong)] backdrop-blur-xl rounded-3xl shadow-2xl border border-[var(--border)] overflow-hidden transform transition-all text-textPrimary"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border',
                isDestructive
                  ? 'bg-danger/20 text-danger border-danger/40'
                  : 'bg-[var(--accent-soft)] text-accent border-[var(--border)]'
              )}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="flex-1">
              <h3 className="text-base font-bold text-textPrimary mb-1">{title}</h3>
              <p className="text-xs text-textSecondary leading-relaxed">{message}</p>
            </div>

            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-textSecondary hover:text-textPrimary p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-[var(--surface-strong)]/80 px-6 py-4 flex items-center justify-end gap-3 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-textSecondary hover:text-textPrimary hover:bg-[var(--accent-soft)] rounded-xl border border-[var(--border)] transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'px-4 py-2 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer',
              isDestructive
                ? 'bg-danger hover:bg-danger/90 text-white disabled:opacity-50'
                : 'bg-accent hover:bg-accent-hover text-[#0b1a1a] disabled:opacity-50'
            )}
          >
            {isLoading && (
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
