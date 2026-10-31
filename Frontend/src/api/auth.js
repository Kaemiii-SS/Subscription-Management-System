import apiClient from './client';
import { STORAGE_KEYS, getStoredData, setStoredData } from '../lib/storage';

const IS_MOCK_FALLBACK = false;

// Password validation rule per spec:
// > 8 chars, 1 uppercase, 1 lowercase, 1 special character
export function validatePasswordCriteria(password) {
  return {
    minLength: password.length > 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
}

export function isPasswordValid(password) {
  const criteria = validatePasswordCriteria(password);
  return criteria.minLength && criteria.hasUppercase && criteria.hasLowercase && criteria.hasSpecial;
}

export const authApi = {
  async login({ email, password }) {
    if (!IS_MOCK_FALLBACK) {
      const { data } = await apiClient.post('/auth/login', { email, password });
      if (data.token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
      }
      if (data.user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
      }
      return data;
    }

    // Mock implementation
    await new Promise((res) => setTimeout(res, 400));
    const users = getStoredData(STORAGE_KEYS.USERS);
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      const err = new Error('Invalid email or password.');
      err.response = { status: 400, data: { message: 'Invalid credentials. Please verify your email and password.' } };
      throw err;
    }

    const token = `jwt_mock_${user.role}_${user.id}_${Date.now()}`;
    const authData = { token, user };
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return authData;
  },

  async signup({ name, email, password, companyName }) {
    if (!IS_MOCK_FALLBACK) {
      const { data } = await apiClient.post('/auth/signup', { name, email, password, companyName });
      if (data.token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
      }
      if (data.user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
      }
      return data;
    }

    await new Promise((res) => setTimeout(res, 400));
    const users = getStoredData(STORAGE_KEYS.USERS);
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (existing) {
      const err = new Error('Duplicate email');
      err.response = {
        status: 400,
        data: {
          message: 'Validation failed',
          fieldErrors: { email: 'This email already has an account.' },
        },
      };
      throw err;
    }

    if (!isPasswordValid(password)) {
      const err = new Error('Weak password');
      err.response = {
        status: 400,
        data: {
          message: 'Password does not meet required complexity standards.',
        },
      };
      throw err;
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      companyName: companyName || name,
      role: 'customer', // New signups are always customers
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0],
    };

    users.push(newUser);
    setStoredData(STORAGE_KEYS.USERS, users);

    const token = `jwt_mock_customer_${newUser.id}_${Date.now()}`;
    const authData = { token, user: newUser };
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    return authData;
  },

  async forgotPassword(email) {
    if (!IS_MOCK_FALLBACK) {
      const { data } = await apiClient.post('/auth/forgot-password', { email });
      return data;
    }
    await new Promise((res) => setTimeout(res, 300));
    // Always return same friendly message whether user exists or not for privacy
    return { message: 'If this email exists, a link was sent.' };
  },

  async resetPassword({ token, newPassword }) {
    if (!IS_MOCK_FALLBACK) {
      const { data } = await apiClient.post('/auth/reset-password', { token, newPassword });
      return data;
    }
    await new Promise((res) => setTimeout(res, 400));
    if (!token || token === 'invalid') {
      const err = new Error('Invalid token');
      err.response = { status: 400, data: { message: 'The password reset link is invalid or has expired.' } };
      throw err;
    }
    return { message: 'Password has been successfully reset. Please log in.' };
  },

  async getCurrentUser() {
    if (!IS_MOCK_FALLBACK) {
      const { data } = await apiClient.get('/auth/me');
      return data;
    }
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
};
