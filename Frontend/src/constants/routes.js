export const ROUTES = {
  // Public
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Internal App (Admin & Staff)
  APP: '/app',
  DASHBOARD: '/app/dashboard',
  PRODUCTS: '/app/products',
  PRODUCT_NEW: '/app/products/new',
  PRODUCT_EDIT: '/app/products/:id',
  PLANS: '/app/plans',
  PLAN_NEW: '/app/plans/new',
  PLAN_EDIT: '/app/plans/:id',
  TAXES: '/app/taxes',
  DISCOUNTS: '/app/discounts',
  TEMPLATES: '/app/templates',
  TEMPLATE_NEW: '/app/templates/new',
  TEMPLATE_EDIT: '/app/templates/:id',
  SUBSCRIPTIONS: '/app/subscriptions',
  SUBSCRIPTION_NEW: '/app/subscriptions/new',
  SUBSCRIPTION_DETAIL: '/app/subscriptions/:id',
  INVOICES: '/app/invoices',
  INVOICE_DETAIL: '/app/invoices/:id',
  PAYMENTS: '/app/payments',
  STAFF: '/app/staff',

  // Customer Portal
  PORTAL: '/portal',
  PORTAL_SUBSCRIPTIONS: '/portal/subscriptions',
  PORTAL_SUBSCRIPTION_DETAIL: '/portal/subscriptions/:id',
  PORTAL_INVOICES: '/portal/invoices',
  PORTAL_INVOICE_DETAIL: '/portal/invoices/:id',
  PORTAL_PROFILE: '/portal/profile',
};
