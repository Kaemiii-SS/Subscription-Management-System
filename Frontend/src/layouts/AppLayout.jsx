import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  FileText,
  Repeat,
  DollarSign,
  Receipt,
  Users,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Percent,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';
import { cn } from '../lib/utils';
import MascotGuide from '../components/mascot/MascotGuide';

export default function AppLayout() {
  const { user, logout, switchDemoRole } = useAuth();
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
    { label: 'Payments', path: ROUTES.PAYMENTS, icon: DollarSign },
  ];

  const catalogItems = [
    { label: 'Quotation Templates', path: ROUTES.TEMPLATES, icon: Receipt },
    { label: 'Products & Variants', path: ROUTES.PRODUCTS, icon: Package },
    { label: 'Billing Plans', path: ROUTES.PLANS, icon: Layers },
    { label: 'Tax Rules', path: ROUTES.TAXES, icon: Percent },
    { label: 'Discounts & Promos', path: ROUTES.DISCOUNTS, icon: Sparkles },
  ];

  const adminItems = [
    ...(user?.role === 'admin'
      ? [{ label: 'Staff Members', path: ROUTES.STAFF, icon: Users }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-transparent flex flex-col md:flex-row text-textPrimary">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-[var(--surface-strong)] backdrop-blur-md text-textPrimary px-4 py-3 flex items-center justify-between z-30 sticky top-0 border-b border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-2.5">
          <img src="/mascot.png" alt="Hop" className="w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--border)] p-0.5 object-contain" />
          <span className="font-bold text-sm tracking-tight text-textPrimary">Brightloop</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-[var(--accent-soft)] transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-[var(--surface-strong)] backdrop-blur-[14px] text-textSecondary flex flex-col border-r border-[var(--border)] transition-transform duration-200 ease-in-out md:static md:translate-x-0 shadow-2xl',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header with Mascot */}
        <div className="p-4 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface-strong)]/80">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-1 flex items-center justify-center shadow-md">
              <img src="/mascot.png" alt="Hop Mascot" className="w-full h-full object-contain" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-[var(--bg-base)]"></span>
          </div>

          <div className="overflow-hidden">
            <h2 className="font-black text-white text-base leading-tight tracking-tight flex items-center gap-1">
              Brightloop
            </h2>
            <p className="text-[11px] text-white/80 flex items-center gap-1 font-medium">
              <span>with Hop Guide</span>
              <Sparkles className="w-3 h-3 text-warning" />
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Workflows */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-black tracking-wider text-white uppercase">
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
                        ? 'bg-accent text-[#0b1a1a] font-black shadow-md shadow-accent/20 border border-accent'
                        : 'text-white/90 hover:text-white hover:bg-[var(--accent-soft)]'
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
            <div className="px-3 mb-2 text-[10px] font-black tracking-wider text-white uppercase">
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
                        ? 'bg-accent text-[#0b1a1a] font-black shadow-md shadow-accent/20 border border-accent'
                        : 'text-white/90 hover:text-white hover:bg-[var(--accent-soft)]'
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
              <div className="px-3 mb-2 text-[10px] font-black tracking-wider text-white uppercase">
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
                          ? 'bg-accent text-[#0b1a1a] font-black shadow-md shadow-accent/20 border border-accent'
                          : 'text-white/90 hover:text-white hover:bg-[var(--accent-soft)]'
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
        <div className="p-3 bg-[var(--surface-strong)] border-t border-[var(--border)]">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] mb-2">
            <div className="w-8 h-8 rounded-full bg-accent text-[#0b1a1a] flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'User'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[var(--accent-soft)] text-white uppercase border border-[var(--border)]">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-danger hover:text-white hover:bg-danger/20 rounded-xl transition-colors border border-danger/30 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-[var(--surface)] backdrop-blur-md border-b border-[var(--border)] px-6 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Workspace
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-white/80" />
            <span className="text-xs font-bold text-white bg-[var(--accent-soft)] px-2.5 py-0.5 rounded-lg border border-[var(--border)] uppercase">
              {user?.role === 'admin' ? 'Executive Admin Panel' : 'Staff Operations'}
            </span>
          </div>

          {/* Quick Switchers & Customer Preview */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[var(--surface)] px-3 py-1.5 rounded-xl border border-[var(--border)] text-xs">
              <span className="text-white font-medium hidden sm:inline">Role:</span>
              <select
                value={user?.role}
                onChange={handleRoleChange}
                className="bg-transparent font-bold text-white rounded-lg px-2 py-1 border-none text-xs focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
              >
                <option value={ROLES.ADMIN} className="bg-[#002222] text-[#f2f5e8]">👑 Admin (Sarah Connor)</option>
                <option value={ROLES.STAFF} className="bg-[#002222] text-[#f2f5e8]">💼 Staff (David Miller)</option>
                <option value={ROLES.CUSTOMER} className="bg-[#002222] text-[#f2f5e8]">🛍️ Customer Portal (Acme Corp)</option>
              </select>
            </div>

            <button
              onClick={() => navigate(ROUTES.PORTAL_SUBSCRIPTIONS)}
              className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-[#0b1a1a] bg-[var(--accent-soft)] hover:bg-accent px-3 py-1.5 rounded-xl border border-[var(--border)] transition-all cursor-pointer"
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
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
