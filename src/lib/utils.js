import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isAfter, differenceInDays } from "date-fns";
import { INVOICE_STATUS } from "../constants/status";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency string or number for display.
 * Avoid floating point rounding issues: formats backend amount precisely.
 */
export function formatCurrency(amount, currency = 'USD') {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '$0.00';
  }
  const numeric = typeof amount === 'number' ? amount : parseFloat(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
}

/**
 * Format date string safely
 */
export function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, 'MMM dd, yyyy');
  } catch (e) {
    return dateString;
  }
}

/**
 * Check if invoice is overdue:
 * Due date is in the past and status is not PAID or CANCELLED
 */
export function isInvoiceOverdue(dueDate, status) {
  if (!dueDate || status === INVOICE_STATUS.PAID || status === INVOICE_STATUS.CANCELLED) {
    return false;
  }
  try {
    const due = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
    const today = new Date();
    // Overdue if today is after due date (end of due day)
    return isAfter(today, due);
  } catch (e) {
    return false;
  }
}

/**
 * Get days late for overdue invoices
 */
export function getDaysOverdue(dueDate) {
  if (!dueDate) return 0;
  try {
    const due = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
    const diff = differenceInDays(new Date(), due);
    return diff > 0 ? diff : 0;
  } catch (e) {
    return 0;
  }
}
