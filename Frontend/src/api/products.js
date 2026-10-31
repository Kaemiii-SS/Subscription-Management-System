import apiClient from './client';
import { STORAGE_KEYS, getStoredData, setStoredData } from '../lib/storage';

const IS_MOCK = false;

export const productsApi = {
  async getAll({ page = 1, size = 10, search = '', sort = 'name' } = {}) {
    if (!IS_MOCK) {
      const { data } = await apiClient.get('/products', { params: { page, size, search, sort } });
      return data;
    }
    await new Promise((res) => setTimeout(res, 250));
    let items = getStoredData(STORAGE_KEYS.PRODUCTS);

    if (search) {
      const term = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.type.toLowerCase().includes(term) ||
          (p.notes && p.notes.toLowerCase().includes(term))
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
      const { data } = await apiClient.get(`/products/${id}`);
      return data;
    }
    await new Promise((res) => setTimeout(res, 200));
    const items = getStoredData(STORAGE_KEYS.PRODUCTS);
    const item = items.find((p) => p.id === id);
    if (!item) throw new Error('Product not found');
    return item;
  },

  async create(payload) {
    if (!IS_MOCK) {
      const { data } = await apiClient.post('/products', payload);
      return data;
    }
    await new Promise((res) => setTimeout(res, 300));
    const items = getStoredData(STORAGE_KEYS.PRODUCTS);
    const newProduct = {
      ...payload,
      id: `prod-${Date.now()}`,
      variants: payload.variants || [],
    };
    items.unshift(newProduct);
    setStoredData(STORAGE_KEYS.PRODUCTS, items);
    return newProduct;
  },

  async update(id, payload) {
    if (!IS_MOCK) {
      const { data } = await apiClient.put(`/products/${id}`, payload);
      return data;
    }
    await new Promise((res) => setTimeout(res, 300));
    const items = getStoredData(STORAGE_KEYS.PRODUCTS);
    const index = items.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Product not found');

    items[index] = { ...items[index], ...payload };
    setStoredData(STORAGE_KEYS.PRODUCTS, items);
    return items[index];
  },

  async delete(id) {
    if (!IS_MOCK) {
      const { data } = await apiClient.delete(`/products/${id}`);
      return data;
    }
    await new Promise((res) => setTimeout(res, 300));
    let items = getStoredData(STORAGE_KEYS.PRODUCTS);
    items = items.filter((p) => p.id !== id);
    setStoredData(STORAGE_KEYS.PRODUCTS, items);
    return { success: true };
  },
};
