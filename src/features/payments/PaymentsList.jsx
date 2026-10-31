import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '../../api/payments';
import { ROUTES } from '../../constants/routes';
import { formatDate } from '../../lib/utils';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import FilterBar from '../../components/ui/FilterBar';
import MoneyText from '../../components/ui/MoneyText';
import { CreditCard, CheckCircle2 } from 'lucide-react';

export default function PaymentsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page, search],
    queryFn: () => paymentsApi.getAll({ page, size: 8, search }),
  });

  const columns = [
    {
      key: 'paymentNumber',
      header: 'Payment #',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900">{row.paymentNumber}</span>
      ),
    },
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      render: (row) => (
        <Link
          to={`${ROUTES.INVOICES}/${row.invoiceId}`}
          className="font-mono font-semibold text-blue-600 hover:underline"
        >
          {row.invoiceNumber}
        </Link>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (row) => <span className="font-semibold text-slate-800">{row.customerName}</span>,
    },
    {
      key: 'method',
      header: 'Payment Method',
      render: (row) => (
        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
          {row.method}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Settled Amount',
      render: (row) => <MoneyText amount={row.amount} className="font-bold text-emerald-600" />,
    },
    {
      key: 'date',
      header: 'Date Paid',
      render: (row) => <span className="text-xs text-slate-600">{formatDate(row.date)}</span>,
    },
    {
      key: 'reference',
      header: 'Reference ID',
      render: (row) => (
        <span className="text-xs font-mono text-slate-400">{row.reference || '-'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recorded Payments"
        subtitle="Real-time transaction settlement ledger and remittance history."
      />

      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search payments by receipt #, customer, method..."
      />

      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        total={data?.total || 0}
        page={page}
        size={8}
        onPageChange={setPage}
        emptyTitle="No payments recorded"
        emptyDescription="When payments are recorded against invoices, they will appear in this ledger."
      />
    </div>
  );
}
