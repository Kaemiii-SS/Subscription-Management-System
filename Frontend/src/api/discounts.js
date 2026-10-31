import apiClient from './client';
import { STORAGE_KEYS, getStoredData, setStoredData } from '../lib/storage';

const IS_MOCK = true;

export const discountsApi = {
  async getAll({ page = 1, size = 10, search = '' } = {}) {
    if (!IS_MOCK) {
      const { data } = await apiClient.get('/discounts', { params: { page, size, search } });
      return data;
    }
    await new Promise((res) => setTimeout(res, 200));
    let items = getStoredData(STORAGE_KEYS.DISCOUNTS);

    if (search) {
      const term = search.toLowerCase();
      items = items.filter(
        (d) =>
          d.name.toLowerCase().includes(term) ||
          d.code?.toLowerCase().includes(term)
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

  async getById(id) {
    if (!IS_MOCK) {
      const { data } = await apiClient.get(`/discounts/${id}`);
      return data;
    }
    const items = getStoredData(STORAGE_KEYS.DISCOUNTS);
    const item = items.find((d) => d.id === id);
    if (!item) throw new Error('Discount not found');
    return item;
  },

  async create(payload) {
    if (!IS_MOCK) {
      const { data } = await apiClient.post('/discounts', payload);
      return data;
    }
    await new Promise((res) => setTimeout(res, 300));
    const items = getStoredData(STORAGE_KEYS.DISCOUNTS);
    const newDiscount = {
      ...payload,
      id: `disc-${Date.now()}`,
      usedCount: 0,
    };
    items.unshift(newDiscount);
    setStoredData(STORAGE_KEYS.DISCOUNTS, items);
    return newDiscount;
  },

  async update(id, payload) {
    if (!IS_MOCK) {
      const { data } = await apiClient.put(`/discounts/${id}`, payload);
      return data;
    }
    await new Promise((res) => setTimeout(res, 300));
    const items = getStoredData(STORAGE_KEYS.DISCOUNTS);
    const index = items.findIndex((d) => d.id === id);
    if (index === -1) throw new Error('Discount not found');

    items[index] = { ...items[index], ...payload };
    setStoredData(STORAGE_KEYS.DISCOUNTS, items);
    return items[index];
  },

  async delete(id) {
    if (!IS_MOCK) {
      const { data } = await apiClient.delete(`/discounts/${id}`);
      return data;
    }
    await new Promise((res) => setTimeout(res, 300));
    let items = getStoredData(STORAGE_KEYS.DISCOUNTS);
    items = items.filter((d) => d.id !== id);
    setStoredData(STORAGE_KEYS.DISCOUNTS, items);
    return { success: true };
  },
};
