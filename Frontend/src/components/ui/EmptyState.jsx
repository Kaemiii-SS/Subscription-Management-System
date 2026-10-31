import React from 'react';
import { cn } from '../../lib/utils';

export default function EmptyState({
  title = 'No items found',
  description = 'Try adjusting your search criteria or create a new entry with Hop.',
  action,
  className = '',
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border-2 border-dashed border-border bg-surface/80',
        className
      )}
    >
      <div className="relative mb-3">
        <div className="w-20 h-20 rounded-2xl bg-sage/60 border border-mint p-1 flex items-center justify-center shadow-xs">
          <img
            src="/mascot.png"
            alt="Hop the Assistant Bunny"
            className="w-full h-full object-contain"
          />
        </div>
        <span className="absolute -bottom-1 -right-1 bg-primary text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-white">
          Hop
        </span>
      </div>
      <h3 className="text-base font-bold text-textPrimary mb-1">{title}</h3>
      <p className="text-xs text-textSecondary max-w-sm mb-5 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
