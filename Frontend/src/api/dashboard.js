import apiClient from './client';
import { STORAGE_KEYS, getStoredData } from '../lib/storage';
import { isInvoiceOverdue, getDaysOverdue } from '../lib/utils';
import { SUBSCRIPTION_STATUS, INVOICE_STATUS } from '../constants/status';

const IS_MOCK = false;

export const dashboardApi = {
  async getMetrics({ customerId = '', planId = '', dateRange = '' } = {}) {
    if (!IS_MOCK) {
      const { data } = await apiClient.get('/dashboard/metrics', {
        params: { customerId, planId, dateRange },
      });
      return data;
    }
    // Fast response target (< 300ms)
    await new Promise((res) => setTimeout(res, 200));

    let subscriptions = getStoredData(STORAGE_KEYS.SUBSCRIPTIONS);
    let invoices = getStoredData(STORAGE_KEYS.INVOICES);

    if (customerId) {
      subscriptions = subscriptions.filter((s) => s.customerId === customerId);
      invoices = invoices.filter((i) => i.customerId === customerId);
    }
    if (planId) {
      subscriptions = subscriptions.filter((s) => s.planId === planId);
    }

    const activeSubscriptions = subscriptions.filter((s) => s.status === SUBSCRIPTION_STATUS.ACTIVE).length;
    
    // Revenue collected (sum of paidAmount across invoices)
    const revenueCollected = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

    // Amount still owed (sum of amountLeft on non-cancelled invoices)
    const amountStillOwed = invoices
      .filter((inv) => inv.status !== INVOICE_STATUS.CANCELLED)
      .reduce((sum, inv) => sum + (inv.amountLeft || 0), 0);

    // Overdue invoices
    const overdueInvoicesList = invoices.filter((inv) => isInvoiceOverdue(inv.dueDate, inv.status));
    const overdueCount = overdueInvoicesList.length;
    const overdueAmount = overdueInvoicesList.reduce((sum, inv) => sum + (inv.amountLeft || 0), 0);

    return {
      activeSubscriptions,
      revenueCollected,
      amountStillOwed,
      overdueCount,
      overdueAmount,
    };
  },

  async getRevenueChart() {
    if (!IS_MOCK) {
      const { data } = await apiClient.get('/dashboard/revenue-chart');
      return data;
    }
    await new Promise((res) => setTimeout(res, 250));

    // Dynamic month aggregation
    return [
      { month: 'May', recurring: 12400, addOns: 3200, total: 15600 },
      { month: 'Jun', recurring: 14800, addOns: 4100, total: 18900 },
      { month: 'Jul', recurring: 17200, addOns: 4800, total: 22000 },
      { month: 'Aug', recurring: 21500, addOns: 5300, total: 26800 },
      { month: 'Sep', recurring: 24900, addOns: 6200, total: 31100 },
      { month: 'Oct', recurring: 28400, addOns: 7500, total: 35900 },
    ];
  },

  async getOverdueInvoices() {
    if (!IS_MOCK) {
      const { data } = await apiClient.get('/dashboard/overdue-invoices');
      return Array.isArray(data) ? data : (data.items || data.content || []);
    }
    await new Promise((res) => setTimeout(res, 200));
    const invoices = getStoredData(STORAGE_KEYS.INVOICES);
    return invoices
      .filter((inv) => isInvoiceOverdue(inv.dueDate, inv.status))
      .map((inv) => ({
        ...inv,
        daysLate: getDaysOverdue(inv.dueDate),
      }))
      .sort((a, b) => b.daysLate - a.daysLate);
  },
};
