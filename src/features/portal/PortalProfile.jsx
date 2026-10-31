import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../lib/utils';
import PageHeader from '../../components/ui/PageHeader';
import { MascotBanner } from '../../components/mascot/MascotGuide';
import { Building, User, Mail, Phone, MapPin, Calendar, ShieldCheck } from 'lucide-react';

export default function PortalProfile() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Account Profile"
        subtitle="Your company identification, billing contacts, and security credentials."
      />

      <MascotBanner
        title="Hop's Account Safeguard"
        tip="Verified Portal"
        message="Your account is protected by role-based data isolation. All invoice history and self-service subscriptions shown belong exclusively to your organization."
      />

      <div className="bg-surface rounded-3xl border border-border shadow-xs overflow-hidden">
        <div className="p-6 sm:p-8 bg-gradient-to-r from-primary to-secondary text-white flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-black uppercase border border-white/30">
            {user?.name?.charAt(0) || 'C'}
          </div>
          <div>
            <h2 className="text-xl font-black">{user?.companyName || user?.name}</h2>
            <p className="text-xs text-emerald-100 mt-0.5">{user?.email}</p>
            <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#14532d] uppercase tracking-wide">
              <ShieldCheck className="w-3 h-3 text-primary" />
              Verified Active Client
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="p-4 rounded-2xl bg-background border border-border flex items-start gap-3">
              <User className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-textSecondary uppercase tracking-wider block text-[10px]">
                  Contact Person
                </span>
                <p className="font-bold text-textPrimary text-sm mt-0.5">{user?.name}</p>
                <p className="text-textSecondary text-[11px]">Primary Account Administrator</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-background border border-border flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-textSecondary uppercase tracking-wider block text-[10px]">
                  Registered Email
                </span>
                <p className="font-bold text-textPrimary text-sm mt-0.5">{user?.email}</p>
                <p className="text-textSecondary text-[11px]">Invoices and receipts delivered here</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-background border border-border flex items-start gap-3">
              <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-textSecondary uppercase tracking-wider block text-[10px]">
                  Phone Support
                </span>
                <p className="font-bold text-textPrimary text-sm mt-0.5">
                  {user?.phone || '+1 (555) 234-5678'}
                </p>
                <p className="text-textSecondary text-[11px]">Two-factor verification enabled</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-background border border-border flex items-start gap-3">
              <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-textSecondary uppercase tracking-wider block text-[10px]">
                  Customer Since
                </span>
                <p className="font-bold text-textPrimary text-sm mt-0.5">
                  {formatDate(user?.createdAt || '2026-01-01')}
                </p>
                <p className="text-textSecondary text-[11px]">Continuous enterprise relationship</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-background border border-border flex items-start gap-3 text-xs">
            <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-textSecondary uppercase tracking-wider block text-[10px]">
                Registered Billing Address
              </span>
              <p className="font-bold text-textPrimary text-xs mt-0.5">
                {user?.address || '100 Innovation Way, Suite 400, Austin, TX 78701, United States'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
