import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants/roles';

export default function AuthLayout() {
  const { switchDemoRole } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden text-textPrimary">
      {/* Background ambient soft pastel glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-mint/20 blur-[130px] pointer-events-none rounded-full"></div>
      <div className="absolute bottom-0 right-10 w-[400px] h-[300px] bg-secondary/15 blur-[120px] pointer-events-none rounded-full"></div>

      {/* Top Brand Banner with Hop Mascot */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center relative mb-2">
          <div className="w-20 h-20 rounded-3xl bg-surface border-2 border-mint p-1.5 shadow-xl shadow-primary/10 flex items-center justify-center">
            <img src="/mascot.png" alt="Hop the Mascot" className="w-full h-full object-contain" />
          </div>
          <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-xs">
            Hop
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-textPrimary tracking-tight">
          Brightloop Software
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-textSecondary font-medium">
          Unified Subscription Management & Recurring Billing Platform
        </p>
      </div>

      {/* Main Form Container */}
      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-surface py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-border">
          <Outlet />
        </div>

        {/* Demo Fast Account Switcher for Evaluators */}
        <div className="mt-5 bg-surface/90 backdrop-blur-md rounded-2xl p-4 border border-border text-center shadow-xs">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-primary mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber" />
            <span>Fast Role Previews with Hop</span>
          </div>
          <p className="text-[11px] text-textSecondary mb-3">
            Click below to instantly sign in and explore RBAC permissions:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                switchDemoRole(ROLES.ADMIN);
                window.location.href = '/app/dashboard';
              }}
              className="px-2.5 py-1.5 rounded-xl bg-sage hover:bg-mint/40 text-primary border border-mint text-xs font-bold transition-all cursor-pointer"
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => {
                switchDemoRole(ROLES.STAFF);
                window.location.href = '/app/dashboard';
              }}
              className="px-2.5 py-1.5 rounded-xl bg-lavender/30 hover:bg-lavender/50 text-[#6d28d9] border border-lavender text-xs font-bold transition-all cursor-pointer"
            >
              💼 Staff
            </button>
            <button
              type="button"
              onClick={() => {
                switchDemoRole(ROLES.CUSTOMER);
                window.location.href = '/portal/subscriptions';
              }}
              className="px-2.5 py-1.5 rounded-xl bg-teal/20 hover:bg-teal/40 text-[#0f766e] border border-teal text-xs font-bold transition-all cursor-pointer"
            >
              🛍️ Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
