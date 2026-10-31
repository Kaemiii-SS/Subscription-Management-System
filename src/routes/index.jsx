import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import AppLayout from '../layouts/AppLayout';
import PortalLayout from '../layouts/PortalLayout';
import ProtectedRoute from './ProtectedRoute';

// Auth Pages
import Login from '../features/auth/Login';
import Signup from '../features/auth/Signup';
import ForgotPassword from '../features/auth/ForgotPassword';
import ResetPassword from '../features/auth/ResetPassword';

// Operations Pages
import Dashboard from '../features/dashboard/Dashboard';
import ProductsList from '../features/catalog/ProductsList';
import PlansList from '../features/catalog/PlansList';
import TaxesList from '../features/catalog/TaxesList';
import DiscountsList from '../features/discounts/DiscountsList';
import TemplatesList from '../features/templates/TemplatesList';
import SubscriptionsList from '../features/subscriptions/SubscriptionsList';
import CreateSubscription from '../features/subscriptions/CreateSubscription';
import SubscriptionDetail from '../features/subscriptions/SubscriptionDetail';
import InvoicesList from '../features/invoices/InvoicesList';
import InvoiceDetail from '../features/invoices/InvoiceDetail';
import PaymentsList from '../features/payments/PaymentsList';
import StaffList from '../features/staff/StaffList';

// Customer Portal Pages
import PortalSubscriptions from '../features/portal/PortalSubscriptions';
import PortalInvoices from '../features/portal/PortalInvoices';
import PortalProfile from '../features/portal/PortalProfile';

export default function AppRoutes() {
  const { user } = useAuth();

  const getHomeRoute = () => {
    if (!user) return ROUTES.LOGIN;
    if (user.role === ROLES.CUSTOMER) return ROUTES.PORTAL_SUBSCRIPTIONS;
    return ROUTES.DASHBOARD;
  };

  return (
    <Routes>
      {/* Root Redirection */}
      <Route path="/" element={<Navigate to={getHomeRoute()} replace />} />

      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.SIGNUP} element={<Signup />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
      </Route>

      {/* Internal Management App (Admin & Staff) */}
      <Route
        path="/app"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
        
        {/* Catalog */}
        <Route path={ROUTES.PRODUCTS} element={<ProductsList />} />
        <Route path={ROUTES.PLANS} element={<PlansList />} />
        <Route path={ROUTES.TAXES} element={<TaxesList />} />
        <Route path={ROUTES.DISCOUNTS} element={<DiscountsList />} />

        {/* Proposals & Templates */}
        <Route path={ROUTES.TEMPLATES} element={<TemplatesList />} />

        {/* Subscriptions */}
        <Route path={ROUTES.SUBSCRIPTIONS} element={<SubscriptionsList />} />
        <Route path={ROUTES.SUBSCRIPTION_NEW} element={<CreateSubscription />} />
        <Route path={ROUTES.SUBSCRIPTION_DETAIL} element={<SubscriptionDetail />} />

        {/* Invoices & Payments */}
        <Route path={ROUTES.INVOICES} element={<InvoicesList />} />
        <Route path={ROUTES.INVOICE_DETAIL} element={<InvoiceDetail />} />
        <Route path={ROUTES.PAYMENTS} element={<PaymentsList />} />

        {/* Admin Only: Staff Management */}
        <Route
          path={ROUTES.STAFF}
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <StaffList />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Customer Portal (Customer Role) */}
      <Route
        path="/portal"
        element={
          <ProtectedRoute allowedRoles={[ROLES.CUSTOMER, ROLES.ADMIN, ROLES.STAFF]}>
            <PortalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={ROUTES.PORTAL_SUBSCRIPTIONS} replace />} />
        <Route path={ROUTES.PORTAL_SUBSCRIPTIONS} element={<PortalSubscriptions />} />
        <Route path={ROUTES.PORTAL_INVOICES} element={<PortalInvoices />} />
        <Route path={ROUTES.PORTAL_PROFILE} element={<PortalProfile />} />
      </Route>

      {/* Fallback 404 */}
      <Route path="*" element={<Navigate to={getHomeRoute()} replace />} />
    </Routes>
  );
}
