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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-md bg-surface rounded-3xl shadow-2xl border border-border overflow-hidden transform transition-all text-textPrimary"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border',
                isDestructive
                  ? 'bg-coral/20 text-coral-700 border-coral'
                  : 'bg-sage text-primary border-mint'
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

        <div className="bg-background px-6 py-4 flex items-center justify-end gap-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-textSecondary hover:bg-surface rounded-xl transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'px-4 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer',
              isDestructive
                ? 'bg-coral hover:bg-[#be123c] disabled:opacity-50'
                : 'bg-primary hover:bg-[#15803d] disabled:opacity-50'
            )}
          >
            {isLoading && (
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
