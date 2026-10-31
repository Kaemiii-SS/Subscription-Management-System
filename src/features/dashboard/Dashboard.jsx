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
      <div className="bg-surface p-4 rounded-2xl border border-border shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-textPrimary">
          <Filter className="w-4 h-4 text-primary" />
          <span>Dashboard Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Customer Filter */}
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="py-1.5 px-3 text-xs bg-background border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-textPrimary font-semibold cursor-pointer"
          >
            <option value="">All Accounts / Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName || c.name}
              </option>
            ))}
          </select>

          {/* Plan Filter */}
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="py-1.5 px-3 text-xs bg-background border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-textPrimary font-semibold cursor-pointer"
          >
            <option value="">All Subscription Plans</option>
            {plansData?.items?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Time range */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="py-1.5 px-3 text-xs bg-background border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-textPrimary font-semibold cursor-pointer"
          >
            <option value="all">Lifetime / All Time</option>
            <option value="quarter">This Quarter (Q4 2026)</option>
            <option value="month">Current Billing Month</option>
          </select>
        </div>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Subscriptions */}
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-textSecondary uppercase tracking-wider">
              Active Subscriptions
            </span>
            <div className="w-10 h-10 rounded-xl bg-sage text-primary flex items-center justify-center border border-mint">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {metricsLoading ? (
              <div className="h-8 bg-background rounded-lg animate-pulse w-24"></div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-textPrimary">
                  {metrics?.activeSubscriptions || 0}
                </span>
                <span className="text-xs font-bold text-primary flex items-center">
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +12% MoM
                </span>
              </div>
            )}
            <p className="text-[11px] text-textSecondary mt-1">Generating recurring monthly revenue</p>
          </div>
        </div>

        {/* Card 2: Revenue Collected */}
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-textSecondary uppercase tracking-wider">
              Revenue Collected
            </span>
            <div className="w-10 h-10 rounded-xl bg-teal/20 text-[#0f766e] flex items-center justify-center border border-teal">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {metricsLoading ? (
              <div className="h-8 bg-background rounded-lg animate-pulse w-32"></div>
            ) : (
              <div className="flex items-baseline gap-2">
                <MoneyText
                  amount={metrics?.revenueCollected || 0}
                  className="text-2xl font-black text-textPrimary"
                />
              </div>
            )}
            <p className="text-[11px] text-textSecondary mt-1">Total settled payments in cash/bank</p>
          </div>
        </div>

        {/* Card 3: Amount Still Owed */}
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-textSecondary uppercase tracking-wider">
              Amount Still Owed
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber/20 text-[#b45309] flex items-center justify-center border border-amber">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {metricsLoading ? (
              <div className="h-8 bg-background rounded-lg animate-pulse w-32"></div>
            ) : (
              <div className="flex items-baseline gap-2">
                <MoneyText
                  amount={metrics?.amountStillOwed || 0}
                  className="text-2xl font-black text-textPrimary"
                />
              </div>
            )}
            <p className="text-[11px] text-textSecondary mt-1">Pending receivable across all invoices</p>
          </div>
        </div>

        {/* Card 4: Overdue Invoices */}
        <div className="bg-surface p-5 rounded-2xl border border-coral/40 shadow-xs flex flex-col justify-between bg-gradient-to-br from-surface to-coral/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-coral-700 uppercase tracking-wider">
              Overdue Invoices
            </span>
            <div className="w-10 h-10 rounded-xl bg-coral/20 text-coral-700 flex items-center justify-center animate-pulse border border-coral">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {metricsLoading ? (
              <div className="h-8 bg-background rounded-lg animate-pulse w-32"></div>
            ) : (
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black text-coral-700">
                    {metrics?.overdueCount || 0}{' '}
                    <span className="text-xs font-medium text-textSecondary">inv.</span>
                  </span>
                </div>
                <MoneyText
                  amount={metrics?.overdueAmount || 0}
                  className="text-base font-black text-coral-700"
                />
              </div>
            )}
            <p className="text-[11px] text-coral-700/80 mt-1 font-medium">Requires immediate follow-up</p>
          </div>
        </div>
      </div>

      {/* Revenue by Month Chart */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider">
              Monthly Recurring Revenue (MRR) Growth
            </h3>
            <p className="text-xs text-textSecondary mt-0.5">
              Breakdown of base subscription plans vs. modular add-ons over time.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-textSecondary">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-primary"></span>
              <span>Base Plans</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-secondary"></span>
              <span>Add-ons</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          {chartLoading ? (
            <div className="w-full h-full bg-background rounded-xl animate-pulse flex items-center justify-center text-xs text-textSecondary">
              Loading financial telemetry...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRecurring" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorAddOns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbe7df" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <Tooltip
                  formatter={(val) => [`$${val.toLocaleString()}`, '']}
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="recurring"
                  name="Base Subscriptions"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRecurring)"
                />
                <Area
                  type="monotone"
                  dataKey="addOns"
                  name="Add-ons & Variants"
                  stroke="#34d399"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAddOns)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Overdue Invoices Priority Table */}
      <div id="overdue-action-center" className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider">
                Overdue Invoices Action Center
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-coral/20 text-coral-700 border border-coral">
                {overdueInvoices?.length || 0} Requiring Action
              </span>
            </div>
            <p className="text-xs text-textSecondary mt-0.5">
              Chase these customer accounts or record payments directly before revenue is lost.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-textPrimary">
            <thead className="bg-background text-textSecondary font-bold uppercase tracking-wider border-b border-border">
              <tr>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Invoice #</th>
                <th className="px-5 py-3">Due Date</th>
                <th className="px-5 py-3">Days Late</th>
                <th className="px-5 py-3">Balance Due</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {overdueLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-5 py-3.5">
                      <div className="h-4 bg-background rounded-md w-full"></div>
                    </td>
                  </tr>
                ))
              ) : !overdueInvoices || overdueInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-primary font-semibold">
                    🎉 Excellent! All customer invoices are completely settled.
                  </td>
                </tr>
              ) : (
                overdueInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-coral/5 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-textPrimary">{inv.customerName}</div>
                      <div className="text-[11px] text-textSecondary">{inv.customerEmail}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-primary">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-5 py-3.5 text-textSecondary">{formatDate(inv.dueDate)}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 font-bold text-coral-700 bg-coral/20 px-2 py-0.5 rounded-md border border-coral text-[11px]">
                        <Clock className="w-3 h-3" />
                        {inv.daysLate} days late
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <MoneyText amount={inv.amountLeft} className="font-black text-textPrimary" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setPaymentModalInvoice(inv)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-primary hover:bg-[#15803d] rounded-xl shadow-xs transition-all cursor-pointer"
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
