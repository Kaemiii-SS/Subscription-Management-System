import apiClient from './client';
import { STORAGE_KEYS, getStoredData, setStoredData } from '../lib/storage';

const IS_MOCK = true;

export const templatesApi = {
  async getAll({ page = 1, size = 10, search = '' } = {}) {
    if (!IS_MOCK) {
      const { data } = await apiClient.get('/templates', { params: { page, size, search } });
      return data;
    }
    await new Promise((res) => setTimeout(res, 200));
    let items = getStoredData(STORAGE_KEYS.TEMPLATES);

    if (search) {
      const term = search.toLowerCase();
      items = items.filter(
        (t) =>
          t.name.toLowerCase().includes(term) ||
          t.notes?.toLowerCase().includes(term)
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
      const { data } = await apiClient.get(`/templates/${id}`);
      return data;
    }
    const items = getStoredData(STORAGE_KEYS.TEMPLATES);
    const item = items.find((t) => t.id === id);
    if (!item) throw new Error('Template not found');
    return item;
  },

  async create(payload) {
    if (!IS_MOCK) {
      const { data } = await apiClient.post('/templates', payload);
      return data;
    }
    await new Promise((res) => setTimeout(res, 300));
    const items = getStoredData(STORAGE_KEYS.TEMPLATES);
    const newTemplate = {
      ...payload,
      id: `tmpl-${Date.now()}`,
    };
    items.unshift(newTemplate);
    setStoredData(STORAGE_KEYS.TEMPLATES, items);
    return newTemplate;
  },

  async update(id, payload) {
    if (!IS_MOCK) {
      const { data } = await apiClient.put(`/templates/${id}`, payload);
      return data;
    }
    await new Promise((res) => setTimeout(res, 300));
    const items = getStoredData(STORAGE_KEYS.TEMPLATES);
    const index = items.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Template not found');

    items[index] = { ...items[index], ...payload };
    setStoredData(STORAGE_KEYS.TEMPLATES, items);
    return items[index];
  },

  async delete(id) {
    if (!IS_MOCK) {
      const { data } = await apiClient.delete(`/templates/${id}`);
      return data;
    }
    await new Promise((res) => setTimeout(res, 300));
    let items = getStoredData(STORAGE_KEYS.TEMPLATES);
    items = items.filter((t) => t.id !== id);
    setStoredData(STORAGE_KEYS.TEMPLATES, items);
    return { success: true };
  },
};
