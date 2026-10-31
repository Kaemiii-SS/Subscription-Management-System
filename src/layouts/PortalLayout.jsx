import React from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { Repeat, FileText, User, LogOut, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';
import { cn } from '../lib/utils';
import MascotGuide from '../components/mascot/MascotGuide';

export default function PortalLayout() {
  const { user, logout, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    switchDemoRole(newRole);
    if (newRole === ROLES.CUSTOMER) {
      navigate(ROUTES.PORTAL_SUBSCRIPTIONS);
    } else {
      navigate(ROUTES.DASHBOARD);
    }
  };

  const navLinks = [
    { label: 'My Subscriptions', path: ROUTES.PORTAL_SUBSCRIPTIONS, icon: Repeat },
    { label: 'My Invoices & Receipts', path: ROUTES.PORTAL_INVOICES, icon: FileText },
    { label: 'Account Profile', path: ROUTES.PORTAL_PROFILE, icon: User },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col text-textPrimary">
      {/* Top Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sage border border-mint p-1 flex items-center justify-center shadow-xs">
                <img src="/mascot.png" alt="Hop" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-black text-textPrimary text-base tracking-tight">Brightloop</span>
                <span className="ml-2 text-xs font-bold px-2.5 py-0.5 rounded-full bg-sage text-primary border border-mint">
                  Customer Portal
                </span>
              </div>
            </div>

            {/* Role switch for evaluators */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-background px-3 py-1.5 rounded-xl border border-border text-xs">
                <span className="text-textSecondary font-medium">Switch:</span>
                <select
                  value={user?.role}
                  onChange={handleRoleChange}
                  className="bg-surface font-semibold text-textPrimary rounded-lg px-2 py-1 border border-border text-xs focus:outline-none cursor-pointer"
                >
                  <option value={ROLES.CUSTOMER}>🛍️ Customer (Acme Corp)</option>
                  <option value={ROLES.ADMIN}>👑 Admin (Sarah Connor)</option>
                  <option value={ROLES.STAFF}>💼 Staff (David Miller)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pl-3 border-l border-border">
                <div className="text-right hidden md:block">
                  <p className="text-xs font-bold text-textPrimary">{user?.name || 'Customer'}</p>
                  <p className="text-[11px] text-textSecondary">{user?.companyName || user?.email}</p>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-2 text-textSecondary hover:text-coral hover:bg-coral/10 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex space-x-1 border-t border-border/60 py-2 overflow-x-auto">
            {navLinks.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap',
                    isActive
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-textSecondary hover:text-textPrimary hover:bg-background'
                  )
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-border py-4 text-center text-xs text-textSecondary flex items-center justify-center gap-2">
        <img src="/mascot.png" alt="Hop" className="w-4 h-4 object-contain inline" />
        <span>Brightloop Self-Service Customer Portal &copy; {new Date().getFullYear()} • Guided by Hop.</span>
      </footer>

      {/* Mascot Guide Companion for customers */}
      <MascotGuide />
    </div>
  );
}
