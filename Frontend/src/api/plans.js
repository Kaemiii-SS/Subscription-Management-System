import apiClient from './client';
import { STORAGE_KEYS, getStoredData, setStoredData } from '../lib/storage';

const IS_MOCK = true;

export const plansApi = {
  async getAll({ page = 1, size = 10, search = '', period = '' } = {}) {
    if (!IS_MOCK) {
      const { data } = await apiClient.get('/plans', { params: { page, size, search, period } });
      return data;
    }
    await new Promise((res) => setTimeout(res, 250));
    let items = getStoredData(STORAGE_KEYS.PLANS);

    if (search) {
      const term = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term)
      );
    }

    if (period) {
      items = items.filter((p) => p.billingPeriod === period);
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
      const { data } = await apiClient.get(`/plans/${id}`);
      return data;
    }
    await new Promise((res) => setTimeout(res, 200));
    const items = getStoredData(STORAGE_KEYS.PLANS);
    const item = items.find((p) => p.id === id);
    if (!item) throw new Error('Plan not found');
    return item;
  },

  async create(payload) {
    if (!IS_MOCK) {
      const { data } = await apiClient.post('/plans', payload);
      return data;
    }
    await new Promise((res) => setTimeout(res, 300));
    const items = getStoredData(STORAGE_KEYS.PLANS);
    const newPlan = {
      ...payload,
      id: `plan-${Date.now()}`,
    };
    items.unshift(newPlan);
    setStoredData(STORAGE_KEYS.PLANS, items);
    return newPlan;
  },

  async update(id, payload) {
    if (!IS_MOCK) {
      const { data } = await apiClient.put(`/plans/${id}`, payload);
      return data;
    }
    await new Promise((res) => setTimeout(res, 300));
    const items = getStoredData(STORAGE_KEYS.PLANS);
    const index = items.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Plan not found');

    items[index] = { ...items[index], ...payload };
    setStoredData(STORAGE_KEYS.PLANS, items);
    return items[index];
  },

  async delete(id) {
    if (!IS_MOCK) {
      const { data } = await apiClient.delete(`/plans/${id}`);
      return data;
    }
    await new Promise((res) => setTimeout(res, 300));
    let items = getStoredData(STORAGE_KEYS.PLANS);
    items = items.filter((p) => p.id !== id);
    setStoredData(STORAGE_KEYS.PLANS, items);
    return { success: true };
  },
};
