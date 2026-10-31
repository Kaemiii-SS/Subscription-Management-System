import apiClient from './client';
import { STORAGE_KEYS, getStoredData, setStoredData } from '../lib/storage';
import { INVOICE_STATUS } from '../constants/status';

const IS_MOCK = true;

export const paymentsApi = {
  async getAll({ page = 1, size = 10, search = '' } = {}) {
    if (!IS_MOCK) {
      const { data } = await apiClient.get('/payments', { params: { page, size, search } });
      return data;
    }
    await new Promise((res) => setTimeout(res, 200));
    let items = getStoredData(STORAGE_KEYS.PAYMENTS);

    const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{}');
    if (currentUser.role === 'customer') {
      items = items.filter((p) => p.customerId === currentUser.id);
    }

    if (search) {
      const term = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.paymentNumber.toLowerCase().includes(term) ||
          p.invoiceNumber.toLowerCase().includes(term) ||
          p.customerName.toLowerCase().includes(term) ||
          p.method.toLowerCase().includes(term)
      );
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

  async recordPayment({ invoiceId, amount, method, date, note, reference }) {
    if (!IS_MOCK) {
      const { data } = await apiClient.post(`/invoices/${invoiceId}/payments`, {
        amount,
        method,
        date,
        note,
        reference,
      });
      return data;
    }
    await new Promise((res) => setTimeout(res, 350));
    const invoices = getStoredData(STORAGE_KEYS.INVOICES);
    const invIndex = invoices.findIndex((i) => i.id === invoiceId || i.invoiceNumber === invoiceId);
    if (invIndex === -1) throw new Error('Invoice not found');

    const invoice = invoices[invIndex];
    const numAmount = parseFloat(amount);

    if (numAmount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }
    if (numAmount > invoice.amountLeft + 0.01) {
      throw new Error(`Amount exceeds remaining balance of ${invoice.amountLeft}.`);
    }

    const payments = getStoredData(STORAGE_KEYS.PAYMENTS);
    const payCount = payments.length + 1;
    const payNumber = `PAY-2026-${String(payCount).padStart(3, '0')}`;

    const newPayment = {
      id: `pay-${Date.now()}`,
      paymentNumber: payNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      amount: numAmount,
      method,
      date: date || new Date().toISOString().split('T')[0],
      reference: reference || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      note: note || '',
    };

    // Update invoice balances
    invoice.paidAmount = parseFloat((invoice.paidAmount + numAmount).toFixed(2));
    invoice.amountLeft = parseFloat(Math.max(0, invoice.total - invoice.paidAmount).toFixed(2));

    if (invoice.amountLeft <= 0) {
      invoice.status = INVOICE_STATUS.PAID;
    }

    if (!invoice.paymentHistory) invoice.paymentHistory = [];
    invoice.paymentHistory.push(newPayment);

    // Save updated invoices and payments
    invoices[invIndex] = invoice;
    setStoredData(STORAGE_KEYS.INVOICES, invoices);

    payments.unshift(newPayment);
    setStoredData(STORAGE_KEYS.PAYMENTS, payments);

    return { payment: newPayment, invoice };
  },
};
