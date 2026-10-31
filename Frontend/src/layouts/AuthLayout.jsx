import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants/roles';
import Background from '../components/ui/Background';

export default function AuthLayout() {
  const { switchDemoRole } = useAuth();

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden text-white">
      {/* Unicorn Studio Background for Login & Signup pages */}
      <Background />

      {/* Top Brand Banner */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 mb-2">
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-[0_2px_16px_rgba(0,0,0,0.95)]">
          Brightloop Software
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-[#fcd34d] font-bold tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
          Unified Subscription Management &amp; Recurring Billing Platform
        </p>
      </div>

      {/* Main Form Container (Dark Brown Shade Box) */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-[#1f140e]/95 backdrop-blur-2xl py-8 px-6 sm:px-10 shadow-2xl shadow-black/90 rounded-3xl border border-[#4d3221]/80">
          <Outlet />
        </div>

        {/* Demo Fast Account Switcher for Evaluators (Dark Brown Shade) */}
        <div className="mt-5 bg-[#1f140e]/90 backdrop-blur-xl rounded-2xl p-4 border border-[#4d3221]/80 text-center shadow-xl shadow-black/80">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#fcd34d] mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-warning" />
            <span>Fast Role Previews with Hop</span>
          </div>
          <p className="text-[11px] text-[#d6c2b0] mb-3">
            Click below to instantly sign in and explore RBAC permissions:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                switchDemoRole(ROLES.ADMIN);
                window.location.href = '/app/dashboard';
              }}
              className="px-2.5 py-1.5 rounded-xl bg-[#2e1d13] hover:bg-[#3d271a] text-white hover:text-[#fcd34d] border border-[#5a3a27] text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => {
                switchDemoRole(ROLES.STAFF);
                window.location.href = '/app/dashboard';
              }}
              className="px-2.5 py-1.5 rounded-xl bg-[#2e1d13] hover:bg-[#3d271a] text-white hover:text-[#fcd34d] border border-[#5a3a27] text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              💼 Staff
            </button>
            <button
              type="button"
              onClick={() => {
                switchDemoRole(ROLES.CUSTOMER);
                window.location.href = '/portal/subscriptions';
              }}
              className="px-2.5 py-1.5 rounded-xl bg-[#2e1d13] hover:bg-[#3d271a] text-white hover:text-[#fcd34d] border border-[#5a3a27] text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              🛍️ Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
