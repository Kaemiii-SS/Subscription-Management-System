import {
  INITIAL_USERS,
  INITIAL_PRODUCTS,
  INITIAL_PLANS,
  INITIAL_TAXES,
  INITIAL_DISCOUNTS,
  INITIAL_TEMPLATES,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
} from '../mock/mockData';

const STORAGE_KEYS = {
  TOKEN: 'brightloop_auth_token',
  USER: 'brightloop_current_user',
  USERS: 'brightloop_users',
  PRODUCTS: 'brightloop_products',
  PLANS: 'brightloop_plans',
  TAXES: 'brightloop_taxes',
  DISCOUNTS: 'brightloop_discounts',
  TEMPLATES: 'brightloop_templates',
  SUBSCRIPTIONS: 'brightloop_subscriptions',
  INVOICES: 'brightloop_invoices',
  PAYMENTS: 'brightloop_payments',
};

// Initialize default seed data if not present
export function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PLANS)) {
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(INITIAL_PLANS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TAXES)) {
    localStorage.setItem(STORAGE_KEYS.TAXES, JSON.stringify(INITIAL_TAXES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.DISCOUNTS)) {
    localStorage.setItem(STORAGE_KEYS.DISCOUNTS, JSON.stringify(INITIAL_DISCOUNTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TEMPLATES)) {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(INITIAL_TEMPLATES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS)) {
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(INITIAL_SUBSCRIPTIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
  }
}

export function getStoredData(key) {
  initializeStorage();
  const raw = localStorage.getItem(key);
  try {
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function setStoredData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export { STORAGE_KEYS };
