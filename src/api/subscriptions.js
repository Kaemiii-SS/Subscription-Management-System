import apiClient from './client';
import { STORAGE_KEYS, getStoredData, setStoredData } from '../lib/storage';
import { SUBSCRIPTION_STATUS } from '../constants/status';

const IS_MOCK = true;

export const subscriptionsApi = {
  async getAll({ page = 1, size = 10, search = '', status = '', customerId = '', planId = '' } = {}) {
    if (!IS_MOCK) {
      const { data } = await apiClient.get('/subscriptions', {
        params: { page, size, search, status, customerId, planId },
      });
      return data;
    }
    await new Promise((res) => setTimeout(res, 250));
    let items = getStoredData(STORAGE_KEYS.SUBSCRIPTIONS);

    // If customer logged in, enforce customer isolation
    const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{}');
    if (currentUser.role === 'customer') {
      items = items.filter((s) => s.customerId === currentUser.id || s.customerEmail === currentUser.email);
    } else if (customerId) {
      items = items.filter((s) => s.customerId === customerId);
    }

    if (search) {
      const term = search.toLowerCase();
      items = items.filter(
        (s) =>
          s.subscriptionNumber.toLowerCase().includes(term) ||
          s.customerName.toLowerCase().includes(term) ||
          s.planName.toLowerCase().includes(term)
      );
    }

    if (status) {
      items = items.filter((s) => s.status.toLowerCase() === status.toLowerCase());
    }

    if (planId) {
      items = items.filter((s) => s.planId === planId);
    }

    const total = items.length;
    const startIndex = (page - 1) * size;
    const paginated = items.slice(startIndex, startIndex + size);

    return {
      items: paginated,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  },

  async getById(id) {
    if (!IS_MOCK) {
      const { data } = await apiClient.get(`/subscriptions/${id}`);
      return data;
    }
    await new Promise((res) => setTimeout(res, 200));
    const items = getStoredData(STORAGE_KEYS.SUBSCRIPTIONS);
    const item = items.find((s) => s.id === id || s.subscriptionNumber === id);
    if (!item) throw new Error('Subscription not found');

    const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{}');
    if (currentUser.role === 'customer' && item.customerId !== currentUser.id && item.customerEmail !== currentUser.email) {
      const err = new Error('Forbidden');
      err.response = { status: 403, data: { message: 'You do not have permission to view this subscription.' } };
      throw err;
    }

    return item;
  },

  async create(payload) {
    if (!IS_MOCK) {
      const { data } = await apiClient.post('/subscriptions', payload);
      return data;
    }
    await new Promise((res) => setTimeout(res, 350));
    const items = getStoredData(STORAGE_KEYS.SUBSCRIPTIONS);
    const count = items.length + 1;
    const subNumber = `SUB-2026-${String(count).padStart(3, '0')}`;

    const newSub = {
      ...payload,
      id: subNumber,
      subscriptionNumber: subNumber,
      status: payload.status || SUBSCRIPTION_STATUS.DRAFT,
      activityLog: [
        {
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          user: JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{}').name || 'System',
          action: 'Created subscription in Draft status',
        },
      ],
    };

    items.unshift(newSub);
    setStoredData(STORAGE_KEYS.SUBSCRIPTIONS, items);
    return newSub;
  },

  async updateStatus(id, newStatus, reason = '') {
    if (!IS_MOCK) {
      const { data } = await apiClient.patch(`/subscriptions/${id}/status`, { status: newStatus, reason });
      return data;
    }
    await new Promise((res) => setTimeout(res, 300));
    const items = getStoredData(STORAGE_KEYS.SUBSCRIPTIONS);
    const index = items.findIndex((s) => s.id === id || s.subscriptionNumber === id);
    if (index === -1) throw new Error('Subscription not found');

    const sub = items[index];
    const prevStatus = sub.status;
    sub.status = newStatus;

    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{}');
    if (!sub.activityLog) sub.activityLog = [];
    sub.activityLog.unshift({
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      user: user.name || 'System',
      action: `Status transitioned from ${prevStatus} to ${newStatus}${reason ? ` (${reason})` : ''}`,
    });

    // If activated, trigger automatic invoice generation if none exists for this period
    if (newStatus === SUBSCRIPTION_STATUS.ACTIVE) {
      const invoices = getStoredData(STORAGE_KEYS.INVOICES);
      const invoiceCount = invoices.length + 1;
      const invNumber = `INV-2026-${String(invoiceCount + 100).padStart(3, '0')}`;
      
      const newInvoice = {
        id: invNumber,
        invoiceNumber: invNumber,
        subscriptionId: sub.id,
        subscriptionNumber: sub.subscriptionNumber,
        customerId: sub.customerId,
        customerName: sub.customerName,
        customerEmail: sub.customerEmail,
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        total: sub.total,
        paidAmount: 0.00,
        amountLeft: sub.total,
        status: 'Draft',
        taxPercent: sub.taxPercent || 18,
        taxAmount: sub.taxAmount || 0,
        discountAmount: sub.discountAmount || 0,
        lines: (sub.lines || []).map((l) => ({
          description: `${l.productName} (${l.variantName || 'Standard'}) x ${l.quantity}`,
          amount: l.amount,
        })),
        paymentHistory: [],
      };
      invoices.unshift(newInvoice);
      setStoredData(STORAGE_KEYS.INVOICES, invoices);
    }

    setStoredData(STORAGE_KEYS.SUBSCRIPTIONS, items);
    return sub;
  },

  async update(id, payload) {
    if (!IS_MOCK) {
      const { data } = await apiClient.put(`/subscriptions/${id}`, payload);
      return data;
    }
    await new Promise((res) => setTimeout(res, 300));
    const items = getStoredData(STORAGE_KEYS.SUBSCRIPTIONS);
    const index = items.findIndex((s) => s.id === id || s.subscriptionNumber === id);
    if (index === -1) throw new Error('Subscription not found');

    items[index] = { ...items[index], ...payload };
    setStoredData(STORAGE_KEYS.SUBSCRIPTIONS, items);
    return items[index];
  },
};
