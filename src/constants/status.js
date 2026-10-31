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
  [SUBSCRIPTION_STATUS.DRAFT]: 'bg-[#edf7f1] text-[#6b7280] border-[#dbe7df]',
  [SUBSCRIPTION_STATUS.QUOTATION]: 'bg-[#d1fae5] text-[#16a34a] border-[#6ee7b7]',
  [SUBSCRIPTION_STATUS.CONFIRMED]: 'bg-[#c4b5fd]/25 text-[#6d28d9] border-[#c4b5fd]',
  [SUBSCRIPTION_STATUS.ACTIVE]: 'bg-[#16a34a]/15 text-[#15803d] border-[#16a34a]/30 font-semibold',
  [SUBSCRIPTION_STATUS.PAUSED]: 'bg-[#fbbf24]/20 text-[#b45309] border-[#fbbf24]',
  [SUBSCRIPTION_STATUS.CLOSED]: 'bg-slate-200 text-slate-700 border-slate-300',

  // Invoice statuses
  [INVOICE_STATUS.DRAFT]: 'bg-[#edf7f1] text-[#6b7280] border-[#dbe7df]',
  [INVOICE_STATUS.CONFIRMED]: 'bg-[#5eead4]/25 text-[#0f766e] border-[#5eead4]',
  [INVOICE_STATUS.PAID]: 'bg-[#16a34a]/15 text-[#15803d] border-[#16a34a]/30 font-semibold',
  [INVOICE_STATUS.CANCELLED]: 'bg-[#fb7185]/20 text-[#be123c] border-[#fb7185]',
  'Overdue': 'bg-[#fb7185]/25 text-[#be123c] border-[#fb7185] animate-pulse font-bold',
};
