export const SUBSCRIPTION_STATUS = {
  DRAFT: 'Draft',
  QUOTATION: 'Quotation',
  CONFIRMED: 'Confirmed',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  CLOSED: 'Closed',
};

export const INVOICE_STATUS = {
  DRAFT: 'Draft',
  CONFIRMED: 'Confirmed',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

export const BILLING_PERIODS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
};

export const PAYMENT_METHODS = [
  'Bank Transfer',
  'Credit Card',
  'UPI / QR Code',
  'Cash',
  'Cheque',
  'PayPal',
];

export const STATUS_COLORS = {
  // Subscription statuses
  [SUBSCRIPTION_STATUS.DRAFT]: 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]',
  [SUBSCRIPTION_STATUS.QUOTATION]: 'bg-[var(--accent-soft)] text-accent font-semibold border border-[var(--border)]',
  [SUBSCRIPTION_STATUS.CONFIRMED]: 'bg-[var(--accent-soft)] text-textPrimary font-semibold border border-[var(--border)]',
  [SUBSCRIPTION_STATUS.ACTIVE]: 'bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/40 font-semibold',
  [SUBSCRIPTION_STATUS.PAUSED]: 'bg-[var(--warning)]/20 text-[var(--warning)] border border-[var(--warning)]/40 font-semibold',
  [SUBSCRIPTION_STATUS.CLOSED]: 'bg-[var(--surface-strong)] text-[var(--text-secondary)] border border-[var(--border)]',

  // Invoice statuses
  [INVOICE_STATUS.DRAFT]: 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]',
  [INVOICE_STATUS.CONFIRMED]: 'bg-teal/20 text-teal border border-teal/40 font-semibold',
  [INVOICE_STATUS.PAID]: 'bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/40 font-semibold',
  [INVOICE_STATUS.CANCELLED]: 'bg-[var(--danger)]/20 text-[var(--danger)] border border-[var(--danger)]/40 font-semibold',
  'Overdue': 'bg-[var(--danger)]/25 text-[var(--danger)] border border-[var(--danger)]/50 animate-pulse font-bold',
};
