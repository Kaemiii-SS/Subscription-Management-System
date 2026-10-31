import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '../../api/dashboard';
import { plansApi } from '../../api/plans';
import { getStoredData, STORAGE_KEYS } from '../../lib/storage';
import PageHeader from '../../components/ui/PageHeader';
import MoneyText from '../../components/ui/MoneyText';
import StatusBadge from '../../components/ui/StatusBadge';
import RecordPaymentModal from '../payments/RecordPaymentModal';
import { MascotBanner } from '../../components/mascot/MascotGuide';
import { formatDate } from '../../lib/utils';
import {
  TrendingUp,
  AlertOctagon,
  CreditCard,
  Repeat,
  DollarSign,
  Filter,
  Sparkles,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [dateRange, setDateRange] = useState('all');

  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);

  // Fetch metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['dashboard-metrics', selectedCustomer, selectedPlan, dateRange],
    queryFn: () =>
      dashboardApi.getMetrics({
        customerId: selectedCustomer,
        planId: selectedPlan,
        dateRange,
      }),
  });

  // Fetch revenue chart data
  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['dashboard-chart'],
    queryFn: () => dashboardApi.getRevenueChart(),
  });

  // Fetch overdue invoices
  const { data: overdueInvoices, isLoading: overdueLoading } = useQuery({
    queryKey: ['dashboard-overdue'],
    queryFn: () => dashboardApi.getOverdueInvoices(),
  });

  const customers = getStoredData(STORAGE_KEYS.USERS).filter((u) => u.role === 'customer');
  const { data: plansData } = useQuery({
    queryKey: ['plans-list-filter'],
    queryFn: () => plansApi.getAll({ size: 100 }),
  });

  const handlePaymentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-overdue'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-chart'] });
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <PageHeader
        title="Executive Finance Dashboard"
        subtitle="Real-time recurring revenue metrics, subscription retention, and overdue collections."
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-sage text-primary border border-mint">
            <Sparkles className="w-3.5 h-3.5 text-amber" />
            Sub-2s Realtime Engine
          </span>
        }
      />

      {/* Guided Mascot Assistant Banner */}
      <MascotBanner
        title="Hop's Financial Pulse"
        tip="Daily Intelligence"
        message="I've analyzed your recurring cash flow! Your base subscriptions have grown +12% this month. There are 2 overdue invoices below requiring immediate follow-up to prevent revenue leakage."
        action={
          overdueInvoices && overdueInvoices.length > 0 ? (
            <button
              onClick={() => {
                const el = document.getElementById('overdue-action-center');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-1.5 text-xs font-bold text-coral bg-coral/10 hover:bg-coral/20 border border-coral/30 rounded-xl transition-all cursor-pointer whitespace-nowrap"
            >
              Review {overdueInvoices.length} Overdue Invoices &rarr;
            </button>
          ) : (
            <span className="text-xs font-semibold text-primary flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              All Invoices Current
            </span>
          )
        }
      />

      {/* Global Filter Bar */}
      <div className="bg-[var(--surface)] backdrop-blur-md p-4 rounded-2xl border border-[var(--border)] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-textPrimary">
          <Filter className="w-4 h-4 text-accent" />
          <span>Dashboard Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Customer Filter */}
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="py-1.5 px-3 text-xs bg-[var(--surface-strong)] border border-[var(--border)] rounded-xl focus:bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-textPrimary font-semibold cursor-pointer"
          >
            <option value="" className="bg-[#002222] text-[#f2f5e8]">All Accounts / Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#002222] text-[#f2f5e8]">
                {c.companyName || c.name}
              </option>
            ))}
          </select>

          {/* Plan Filter */}
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="py-1.5 px-3 text-xs bg-[var(--surface-strong)] border border-[var(--border)] rounded-xl focus:bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-textPrimary font-semibold cursor-pointer"
          >
            <option value="" className="bg-[#002222] text-[#f2f5e8]">All Subscription Plans</option>
            {plansData?.items?.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#002222] text-[#f2f5e8]">
                {p.name}
              </option>
            ))}
          </select>

          {/* Time range */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="py-1.5 px-3 text-xs bg-[var(--surface-strong)] border border-[var(--border)] rounded-xl focus:bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-textPrimary font-semibold cursor-pointer"
          >
            <option value="all" className="bg-[#002222] text-[#f2f5e8]">Lifetime / All Time</option>
            <option value="quarter" className="bg-[#002222] text-[#f2f5e8]">This Quarter (Q4 2026)</option>
            <option value="month" className="bg-[#002222] text-[#f2f5e8]">Current Billing Month</option>
          </select>
        </div>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Subscriptions */}
        <div className="bg-[var(--surface)] backdrop-blur-md p-5 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Active Subscriptions
            </span>
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] text-accent flex items-center justify-center border border-[var(--border)]">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {metricsLoading ? (
              <div className="h-8 bg-[var(--surface-strong)] rounded-lg animate-pulse w-24"></div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">
                  {metrics?.activeSubscriptions || 0}
                </span>
                <span className="text-xs font-bold text-[#4ade80] flex items-center">
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +12% MoM
                </span>
              </div>
            )}
            <p className="text-[11px] text-white/90 mt-1 font-medium">Generating recurring monthly revenue</p>
          </div>
        </div>

        {/* Card 2: Revenue Collected */}
        <div className="bg-[var(--surface)] backdrop-blur-md p-5 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Revenue Collected
            </span>
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] text-accent flex items-center justify-center border border-[var(--border)]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {metricsLoading ? (
              <div className="h-8 bg-[var(--surface-strong)] rounded-lg animate-pulse w-32"></div>
            ) : (
              <div className="flex items-baseline gap-2">
                <MoneyText
                  amount={metrics?.revenueCollected || 0}
                  className="text-2xl font-black text-white"
                />
              </div>
            )}
            <p className="text-[11px] text-white/90 mt-1 font-medium">Total settled payments in cash/bank</p>
          </div>
        </div>

        {/* Card 3: Amount Still Owed */}
        <div className="bg-[var(--surface)] backdrop-blur-md p-5 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Amount Still Owed
            </span>
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] text-accent flex items-center justify-center border border-[var(--border)]">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {metricsLoading ? (
              <div className="h-8 bg-[var(--surface-strong)] rounded-lg animate-pulse w-32"></div>
            ) : (
              <div className="flex items-baseline gap-2">
                <MoneyText
                  amount={metrics?.amountStillOwed || 0}
                  className="text-2xl font-black text-white"
                />
              </div>
            )}
            <p className="text-[11px] text-white/90 mt-1 font-medium">Pending receivable across all invoices</p>
          </div>
        </div>

        {/* Card 4: Overdue Invoices */}
        <div className="bg-[var(--surface)] backdrop-blur-md p-5 rounded-2xl border border-danger/40 shadow-xs flex flex-col justify-between bg-gradient-to-br from-[var(--surface)] to-danger/15">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#fca5a5] uppercase tracking-wider">
              Overdue Invoices
            </span>
            <div className="w-10 h-10 rounded-xl bg-danger/20 text-danger flex items-center justify-center animate-pulse border border-danger/40">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {metricsLoading ? (
              <div className="h-8 bg-[var(--surface-strong)] rounded-lg animate-pulse w-32"></div>
            ) : (
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black text-[#f87171]">
                    {metrics?.overdueCount || 0}{' '}
                    <span className="text-xs font-medium text-white/80">inv.</span>
                  </span>
                </div>
                <MoneyText
                  amount={metrics?.overdueAmount || 0}
                  className="text-base font-black text-[#f87171]"
                />
              </div>
            )}
            <p className="text-[11px] text-[#fca5a5] mt-1 font-semibold">Requires immediate follow-up</p>
          </div>
        </div>
      </div>

      {/* Revenue by Month Chart */}
      <div className="bg-[var(--surface)] backdrop-blur-md p-6 rounded-2xl border border-[var(--border)] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Monthly Recurring Revenue (MRR) Growth
            </h3>
            <p className="text-xs text-white/90 mt-0.5 font-medium">
              Breakdown of base subscription plans vs. modular add-ons over time.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-white">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#4ade80] shadow-[0_0_8px_#4ade80]"></span>
              <span>Base Plans</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]"></span>
              <span>Add-ons</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          {chartLoading ? (
            <div className="w-full h-full bg-[var(--surface-strong)] rounded-xl animate-pulse flex items-center justify-center text-xs text-white">
              Loading financial telemetry...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRecurring" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.65} />
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorAddOns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.60} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.20)" />
                <XAxis
                  dataKey="month"
                  stroke="#ffffff"
                  fontSize={12}
                  tickLine={false}
                  tick={{ fill: '#ffffff', fontWeight: 600 }}
                />
                <YAxis
                  stroke="#ffffff"
                  fontSize={12}
                  tickLine={false}
                  tick={{ fill: '#ffffff', fontWeight: 600 }}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <Tooltip
                  formatter={(val) => [`$${val.toLocaleString()}`, '']}
                  contentStyle={{
                    backgroundColor: 'rgba(0, 24, 24, 0.95)',
                    backdropFilter: 'blur(16px)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Area
                  type="monotone"
                  dataKey="recurring"
                  name="Base Subscriptions"
                  stroke="#4ade80"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRecurring)"
                />
                <Area
                  type="monotone"
                  dataKey="addOns"
                  name="Add-ons & Variants"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorAddOns)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Overdue Invoices Priority Table */}
      <div id="overdue-action-center" className="bg-[var(--surface)] backdrop-blur-md rounded-2xl border border-[var(--border)] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Overdue Invoices Action Center
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-danger/20 text-danger border border-danger/40">
                {overdueInvoices?.length || 0} Requiring Action
              </span>
            </div>
            <p className="text-xs text-white/90 mt-0.5 font-medium">
              Chase these customer accounts or record payments directly before revenue is lost.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white">
            <thead className="bg-[var(--surface-strong)] text-white font-bold uppercase tracking-wider border-b border-[var(--border)]">
              <tr>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Invoice #</th>
                <th className="px-5 py-3">Due Date</th>
                <th className="px-5 py-3">Days Late</th>
                <th className="px-5 py-3">Balance Due</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/60">
              {overdueLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-5 py-3.5">
                      <div className="h-4 bg-[var(--surface-strong)] rounded-md w-full"></div>
                    </td>
                  </tr>
                ))
              ) : !overdueInvoices || overdueInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[#4ade80] font-semibold">
                    🎉 Excellent! All customer invoices are completely settled.
                  </td>
                </tr>
              ) : (
                overdueInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-danger/10 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-white">{inv.customerName}</div>
                      <div className="text-[11px] text-white/80">{inv.customerEmail}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-accent">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-5 py-3.5 text-white/90 font-medium">{formatDate(inv.dueDate)}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 font-bold text-danger bg-danger/20 px-2 py-0.5 rounded-md border border-danger/40 text-[11px]">
                        <Clock className="w-3 h-3" />
                        {inv.daysLate} days late
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <MoneyText amount={inv.amountLeft} className="font-black text-white" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setPaymentModalInvoice(inv)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0b1a1a] bg-accent hover:bg-accent-hover rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Record Payment</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {paymentModalInvoice && (
        <RecordPaymentModal
          isOpen={true}
          invoice={paymentModalInvoice}
          onClose={() => setPaymentModalInvoice(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
