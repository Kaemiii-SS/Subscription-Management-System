import React from 'react';
import { formatCurrency, cn } from '../../lib/utils';

export default function MoneyText({ amount, currency = 'USD', className = '' }) {
  const formatted = formatCurrency(amount, currency);

  return (
    <span className={cn('font-mono font-medium tracking-tight', className)}>
      {formatted}
    </span>
  );
}
