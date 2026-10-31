import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Repeat,
  FileText,
  CreditCard,
  FileSpreadsheet,
  Package,
  CalendarDays,
  Percent,
  Tag,
  Users,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';
import { cn } from '../lib/utils';
import MascotGuide from '../components/mascot/MascotGuide';

export default function AppLayout() {
  const { user, logout, switchDemoRole, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    switchDemoRole(newRole);
    if (newRole === ROLES.CUSTOMER) {
      navigate(ROUTES.PORTAL_SUBSCRIPTIONS);
    } else {
      navigate(ROUTES.DASHBOARD);
    }
  };

  const navItems = [
    { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { label: 'Subscriptions', path: ROUTES.SUBSCRIPTIONS, icon: Repeat },
    { label: 'Invoices', path: ROUTES.INVOICES, icon: FileText },
    { label: 'Payments', path: ROUTES.PAYMENTS, icon: CreditCard },
    { label: 'Quotation Templates', path: ROUTES.TEMPLATES, icon: FileSpreadsheet },
  ];

  const catalogItems = [
    { label: 'Products & Variants', path: ROUTES.PRODUCTS, icon: Package },
    { label: 'Billing Plans', path: ROUTES.PLANS, icon: CalendarDays },
    { label: 'Tax Rules', path: ROUTES.TAXES, icon: Percent },
    { label: 'Discounts', path: ROUTES.DISCOUNTS, icon: Tag },
  ];

  const adminItems = [
    ...(isAdmin ? [{ label: 'Staff Members', path: ROUTES.STAFF, icon: Users }] : []),
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row text-textPrimary">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#14532d] text-white px-4 py-3 flex items-center justify-between z-30 sticky top-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <img src="/mascot.png" alt="Hop" className="w-8 h-8 rounded-lg bg-surface p-0.5 object-contain" />
          <span className="font-bold text-sm tracking-tight text-white">Brightloop</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-800"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-[#14532d] text-emerald-100 flex flex-col border-r border-[#166534] transition-transform duration-200 ease-in-out md:static md:translate-x-0 shadow-lg',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header with Mascot */}
        <div className="p-4 flex items-center gap-3 border-b border-[#166534] bg-[#0f3d21]">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-surface border border-mint p-1 flex items-center justify-center shadow-md">
              <img src="/mascot.png" alt="Hop Mascot" className="w-full h-full object-contain" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-secondary rounded-full border-2 border-[#0f3d21]"></span>
          </div>

          <div className="overflow-hidden">
            <h2 className="font-black text-white text-base leading-tight tracking-tight flex items-center gap-1">
              Brightloop
            </h2>
            <p className="text-[11px] text-mint flex items-center gap-1 font-medium">
              <span>with Hop Guide</span>
              <Sparkles className="w-3 h-3 text-amber" />
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Workflows */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-mint/80 uppercase">
              Operations
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all',
                      isActive
                        ? 'bg-primary text-white shadow-md shadow-primary/30 border border-secondary/40'
                        : 'text-emerald-100/90 hover:text-white hover:bg-[#166534]'
                    )
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Catalog Management */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-mint/80 uppercase">
              Catalog & Rules
            </div>
            <nav className="space-y-1">
              {catalogItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all',
                      isActive
                        ? 'bg-primary text-white shadow-md shadow-primary/30 border border-secondary/40'
                        : 'text-emerald-100/90 hover:text-white hover:bg-[#166534]'
                    )
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Admin Tools */}
          {adminItems.length > 0 && (
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-mint/80 uppercase">
                Administration
              </div>
              <nav className="space-y-1">
                {adminItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all',
                        isActive
                          ? 'bg-primary text-white shadow-md shadow-primary/30'
                          : 'text-emerald-100/90 hover:text-white hover:bg-[#166534]'
                      )
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-3 bg-[#0f3d21] border-t border-[#166534]">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-[#14532d] border border-[#166534] mb-2">
            <div className="w-8 h-8 rounded-full bg-secondary text-[#14532d] flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'User'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-sage text-[#14532d] uppercase">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-coral hover:text-white hover:bg-coral/20 rounded-xl transition-colors border border-coral/30 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-surface border-b border-border px-6 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-textSecondary uppercase tracking-wider">
              Workspace
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-textSecondary" />
            <span className="text-xs font-bold text-primary bg-sage px-2.5 py-0.5 rounded-lg border border-mint uppercase">
              {user?.role === 'admin' ? 'Executive Admin Panel' : 'Staff Operations'}
            </span>
          </div>

          {/* Quick Switchers & Customer Preview */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-xl border border-border text-xs">
              <span className="text-textSecondary font-medium hidden sm:inline">Role:</span>
              <select
                value={user?.role}
                onChange={handleRoleChange}
                className="bg-surface font-semibold text-textPrimary rounded-lg px-2 py-1 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value={ROLES.ADMIN}>👑 Admin (Sarah Connor)</option>
                <option value={ROLES.STAFF}>💼 Staff (David Miller)</option>
                <option value={ROLES.CUSTOMER}>🛍️ Customer Portal (Acme Corp)</option>
              </select>
            </div>

            <button
              onClick={() => navigate(ROUTES.PORTAL_SUBSCRIPTIONS)}
              className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-white bg-sage hover:bg-primary px-3 py-1.5 rounded-xl border border-mint transition-colors cursor-pointer"
            >
              <span>Customer Portal View</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mascot Guide Companion Everywhere */}
      <MascotGuide />

      {/* Mobile drawer backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
