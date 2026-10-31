import React from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle } from 'lucide-react';

export default function FormField({
  label,
  error,
  helperText,
  required = false,
  className = '',
  labelClassName = '',
  children,
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className={cn("text-xs font-bold uppercase tracking-wider text-white flex items-center justify-between", labelClassName)}>
          <span>
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </span>
        </label>
      )}

      {children}

      {error ? (
        <div className="flex items-center gap-1.5 text-xs text-danger mt-0.5 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <p className="text-xs text-white/80 mt-0.5 font-medium">{helperText}</p>
      ) : null}
    </div>
  );
}
