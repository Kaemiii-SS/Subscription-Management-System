import apiClient from './client';
import { STORAGE_KEYS, getStoredData, setStoredData } from '../lib/storage';

const IS_MOCK = false;

export const staffApi = {
  async getAll() {
    if (!IS_MOCK) {
      const { data } = await apiClient.get('/staff');
      return Array.isArray(data) ? data : (data.items || data.content || []);
    }
    await new Promise((res) => setTimeout(res, 200));
    const users = getStoredData(STORAGE_KEYS.USERS);
    return users.filter((u) => u.role === 'staff' || u.role === 'admin');
  },

  async create(payload) {
    if (!IS_MOCK) {
      const { data } = await apiClient.post('/staff', payload);
      return data;
    }
    await new Promise((res) => setTimeout(res, 300));
    const users = getStoredData(STORAGE_KEYS.USERS);
    const existing = users.find((u) => u.email.toLowerCase() === payload.email.toLowerCase());
    if (existing) {
      const err = new Error('Email exists');
      err.response = { status: 400, data: { message: 'This email is already in use.' } };
      throw err;
    }

    const newStaff = {
      id: `user-staff-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      department: payload.department || 'Operations',
      role: 'staff',
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0],
    };

    users.push(newStaff);
    setStoredData(STORAGE_KEYS.USERS, users);
    return newStaff;
  },
};
