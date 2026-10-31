import apiClient from './client';
import { STORAGE_KEYS, getStoredData, setStoredData } from '../lib/storage';

const IS_MOCK = false;

export const taxesApi = {
  async getAll() {
    if (!IS_MOCK) {
      const { data } = await apiClient.get('/taxes');
      return Array.isArray(data) ? data : (data.items || data.content || []);
    }
    await new Promise((res) => setTimeout(res, 200));
    return getStoredData(STORAGE_KEYS.TAXES);
  },

  async create(payload) {
    if (!IS_MOCK) {
      const { data } = await apiClient.post('/taxes', payload);
      return data;
    }
    await new Promise((res) => setTimeout(res, 300));
    const items = getStoredData(STORAGE_KEYS.TAXES);
    const newTax = { ...payload, id: `tax-${Date.now()}` };
    items.push(newTax);
    setStoredData(STORAGE_KEYS.TAXES, items);
    return newTax;
  },

  async update(id, payload) {
    if (!IS_MOCK) {
      const { data } = await apiClient.put(`/taxes/${id}`, payload);
      return data;
    }
    await new Promise((res) => setTimeout(res, 300));
    const items = getStoredData(STORAGE_KEYS.TAXES);
    const index = items.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Tax not found');
    items[index] = { ...items[index], ...payload };
    setStoredData(STORAGE_KEYS.TAXES, items);
    return items[index];
  },

  async delete(id) {
    if (!IS_MOCK) {
      const { data } = await apiClient.delete(`/taxes/${id}`);
      return data;
    }
    await new Promise((res) => setTimeout(res, 300));
    let items = getStoredData(STORAGE_KEYS.TAXES);
    items = items.filter((t) => t.id !== id);
    setStoredData(STORAGE_KEYS.TAXES, items);
    return { success: true };
  },
};
