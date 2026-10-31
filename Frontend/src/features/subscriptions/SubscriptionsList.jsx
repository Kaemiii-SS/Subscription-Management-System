import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { subscriptionsApi } from '../../api/subscriptions';
import { plansApi } from '../../api/plans';
import { getStoredData, STORAGE_KEYS } from '../../lib/storage';
import { ROUTES } from '../../constants/routes';
import { SUBSCRIPTION_STATUS } from '../../constants/status';
import { formatDate } from '../../lib/utils';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import FilterBar from '../../components/ui/FilterBar';
import StatusBadge from '../../components/ui/StatusBadge';
import MoneyText from '../../components/ui/MoneyText';
import { Plus, ArrowRight } from 'lucide-react';

export default function SubscriptionsList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions', page, search, statusFilter, customerFilter, planFilter],
    queryFn: () =>
      subscriptionsApi.getAll({
        page,
        size: 8,
        search,
        status: statusFilter,
        customerId: customerFilter,
        planId: planFilter,
      }),
  });

  const { data: plansData } = useQuery({
    queryKey: ['plans-list-options'],
    queryFn: () => plansApi.getAll({ size: 100 }),
  });

  const customers = getStoredData(STORAGE_KEYS.USERS).filter((u) => u.role === 'customer');

  const columns = [
    {
      key: 'subscriptionNumber',
      header: 'Subscription #',
      render: (row) => (
        <span className="font-mono font-bold text-accent hover:underline transition-colors">
          {row.subscriptionNumber}
        </span>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer Account',
      render: (row) => (
        <div>
          <span className="font-bold text-white block text-sm">{row.customerName}</span>
          <p className="text-xs text-white/80">{row.customerEmail}</p>
        </div>
      ),
    },
    {
      key: 'planName',
      header: 'Billing Plan',
      render: (row) => (
        <div>
          <span className="font-semibold text-white block">{row.planName}</span>
          <span className="text-xs text-white/80 capitalize block">
            Cadence: {row.billingPeriod}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'nextBillingDate',
      header: 'Next Billing',
      render: (row) => (
        <span className="text-xs text-white font-mono font-semibold">
          {formatDate(row.nextBillingDate)}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Recurring Total',
      render: (row) => <MoneyText amount={row.total} className="font-black text-white text-sm" />,
    },
    {
      key: 'expiryDate',
      header: 'Expiry Date',
      render: (row) => (
        <span className="text-xs text-white font-medium">{formatDate(row.expiryDate)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`${ROUTES.SUBSCRIPTIONS}/${row.id}`);
            }}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscriptions"
        subtitle="Manage recurring contract agreements, quotation conversions, and automated billing schedules."
        action={
          <button
            onClick={() => navigate(ROUTES.SUBSCRIPTION_NEW)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#0b1a1a] bg-accent hover:bg-accent-hover rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Subscription</span>
          </button>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search by subscription number or account name..."
        statusFilter={statusFilter}
        onStatusChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        statusOptions={[
          { label: 'Draft', value: SUBSCRIPTION_STATUS.DRAFT },
          { label: 'Quotation', value: SUBSCRIPTION_STATUS.QUOTATION },
          { label: 'Confirmed', value: SUBSCRIPTION_STATUS.CONFIRMED },
          { label: 'Active', value: SUBSCRIPTION_STATUS.ACTIVE },
          { label: 'Paused', value: SUBSCRIPTION_STATUS.PAUSED },
          { label: 'Closed', value: SUBSCRIPTION_STATUS.CLOSED },
        ]}
        extraFilters={
          <>
            <select
              value={customerFilter}
              onChange={(e) => {
                setCustomerFilter(e.target.value);
                setPage(1);
              }}
              className="py-2 px-3 text-xs bg-background border border-border rounded-xl focus:bg-surface text-textPrimary font-semibold cursor-pointer"
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName || c.name}
                </option>
              ))}
            </select>

            <select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setPage(1);
              }}
              className="py-2 px-3 text-xs bg-background border border-border rounded-xl focus:bg-surface text-textPrimary font-semibold cursor-pointer"
            >
              <option value="">All Plans</option>
              {plansData?.items?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        total={data?.total || 0}
        page={page}
        size={8}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`${ROUTES.SUBSCRIPTIONS}/${row.id}`)}
        emptyTitle="No subscriptions found"
        emptyDescription="Create a proposal from a quotation template or build a custom subscription."
      />
    </div>
  );
}
