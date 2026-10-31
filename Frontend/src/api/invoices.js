import apiClient from './client';
import { STORAGE_KEYS, getStoredData, setStoredData } from '../lib/storage';
import { isInvoiceOverdue } from '../lib/utils';
import { INVOICE_STATUS } from '../constants/status';

const IS_MOCK = false;

export const invoicesApi = {
  async getAll({ page = 1, size = 10, search = '', status = '', customerId = '' } = {}) {
    if (!IS_MOCK) {
      const { data } = await apiClient.get('/invoices', {
        params: { page, size, search, status, customerId },
      });
      return data;
    }
    await new Promise((res) => setTimeout(res, 250));
    let items = getStoredData(STORAGE_KEYS.INVOICES);

    const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{}');
    if (currentUser.role === 'customer') {
      items = items.filter((inv) => inv.customerId === currentUser.id || inv.customerEmail === currentUser.email);
    } else if (customerId) {
      items = items.filter((inv) => inv.customerId === customerId);
    }

    if (search) {
      const term = search.toLowerCase();
      items = items.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(term) ||
          inv.customerName.toLowerCase().includes(term) ||
          inv.subscriptionNumber?.toLowerCase().includes(term)
      );
    }

    if (status) {
      if (status === 'Overdue') {
        items = items.filter((inv) => isInvoiceOverdue(inv.dueDate, inv.status));
      } else if (status === 'Outstanding') {
        items = items.filter((inv) => inv.amountLeft > 0 && inv.status !== INVOICE_STATUS.CANCELLED);
      } else {
        items = items.filter((inv) => inv.status.toLowerCase() === status.toLowerCase());
      }
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
      const { data } = await apiClient.get(`/invoices/${id}`);
      return data;
    }
    await new Promise((res) => setTimeout(res, 200));
    const items = getStoredData(STORAGE_KEYS.INVOICES);
    const item = items.find((inv) => inv.id === id || inv.invoiceNumber === id);
    if (!item) throw new Error('Invoice not found');

    const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{}');
    if (currentUser.role === 'customer' && item.customerId !== currentUser.id && item.customerEmail !== currentUser.email) {
      const err = new Error('Forbidden');
      err.response = { status: 403, data: { message: 'You do not have permission to view this invoice.' } };
      throw err;
    }

    return item;
  },

  async updateStatus(id, newStatus) {
    if (!IS_MOCK) {
      const { data } = await apiClient.patch(`/invoices/${id}/status`, { status: newStatus });
      return data;
    }
    await new Promise((res) => setTimeout(res, 250));
    const items = getStoredData(STORAGE_KEYS.INVOICES);
    const index = items.findIndex((inv) => inv.id === id || inv.invoiceNumber === id);
    if (index === -1) throw new Error('Invoice not found');

    items[index].status = newStatus;
    setStoredData(STORAGE_KEYS.INVOICES, items);
    return items[index];
  },
};
