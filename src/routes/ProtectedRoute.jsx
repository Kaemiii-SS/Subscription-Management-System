import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/routes';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, token, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-textSecondary">Verifying security credentials...</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-surface rounded-3xl shadow-sm border border-border p-8 text-center text-textPrimary">
          <div className="w-14 h-14 bg-coral/20 border border-coral text-coral-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-textPrimary mb-2">Access Denied (403)</h2>
          <p className="text-textSecondary text-xs mb-6 leading-relaxed">
            Your current account role (<span className="font-bold text-textPrimary">{user.role}</span>) does not have permission to view this section.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={user.role === 'customer' ? ROUTES.PORTAL_SUBSCRIPTIONS : ROUTES.DASHBOARD}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-[#15803d] text-white font-bold text-xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Your Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
