import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { invoicesApi } from '../../api/invoices';
import { ROUTES } from '../../constants/routes';
import { INVOICE_STATUS } from '../../constants/status';
import { formatDate, isInvoiceOverdue } from '../../lib/utils';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import FilterBar from '../../components/ui/FilterBar';
import StatusBadge from '../../components/ui/StatusBadge';
import MoneyText from '../../components/ui/MoneyText';
import RecordPaymentModal from '../payments/RecordPaymentModal';
import { CreditCard, Eye } from 'lucide-react';

export default function InvoicesList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['invoices', page, search, statusFilter],
    queryFn: () => invoicesApi.getAll({ page, size: 8, search, status: statusFilter }),
  });

  const columns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      render: (row) => (
        <span className="font-mono font-bold text-accent hover:underline transition-colors">
          {row.invoiceNumber}
        </span>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (row) => (
        <div>
          <span className="font-bold text-white block">{row.customerName}</span>
          <p className="text-xs text-white/80">{row.customerEmail}</p>
        </div>
      ),
    },
    {
      key: 'invoiceDate',
      header: 'Invoice Date',
      render: (row) => <span className="text-xs text-white font-medium">{formatDate(row.invoiceDate)}</span>,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (row) => {
        const overdue = isInvoiceOverdue(row.dueDate, row.status);
        return (
          <span className={`text-xs font-semibold ${overdue ? 'text-danger font-bold' : 'text-white'}`}>
            {formatDate(row.dueDate)}
          </span>
        );
      },
    },
    {
      key: 'total',
      header: 'Total / Balance',
      render: (row) => {
        const total = row.total || 0;
        const paid = row.paidAmount || 0;
        const percent = Math.min(100, Math.round((paid / total) * 100));
        const isPartlyPaid = paid > 0 && paid < total;

        return (
          <div className="w-36">
            <div className="flex justify-between items-baseline text-xs mb-1">
              <MoneyText amount={total} className="font-bold text-white" />
              {row.amountLeft > 0 && (
                <span className="text-[11px] text-danger font-bold font-mono">
                  due: ${row.amountLeft}
                </span>
              )}
            </div>

            {/* Spec: Partly paid progress bar */}
            {isPartlyPaid && (
              <div className="space-y-0.5">
                <div className="w-full bg-[var(--surface-strong)] rounded-full h-1.5 overflow-hidden border border-[var(--border)]">
                  <div
                    className="bg-accent h-full rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-accent font-bold">
                  Paid ${paid.toLocaleString()} of ${total.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const overdue = isInvoiceOverdue(row.dueDate, row.status);
        return <StatusBadge status={row.status} isOverdue={overdue} />;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.amountLeft > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPaymentModalInvoice(row);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#0b1a1a] bg-accent hover:bg-accent-hover rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <CreditCard className="w-3 h-3" />
              <span>Record Pay</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`${ROUTES.INVOICES}/${row.id}`);
            }}
            className="p-1.5 text-textSecondary hover:text-accent hover:bg-[var(--accent-soft)] rounded-lg cursor-pointer"
            title="View Invoice"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing Invoices"
        subtitle="Manage automated subscription invoices, collections, tax breakdowns, and partial payments."
      />

      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search invoice #, customer name, subscription..."
        statusFilter={statusFilter}
        onStatusChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        statusOptions={[
          { label: 'Draft', value: INVOICE_STATUS.DRAFT },
          { label: 'Confirmed', value: INVOICE_STATUS.CONFIRMED },
          { label: 'Paid', value: INVOICE_STATUS.PAID },
          { label: 'Overdue Only', value: 'Overdue' },
          { label: 'Outstanding Balance', value: 'Outstanding' },
        ]}
      />

      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        total={data?.total || 0}
        page={page}
        size={8}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`${ROUTES.INVOICES}/${row.id}`)}
        emptyTitle="No invoices found"
        emptyDescription="Invoices are issued automatically when subscriptions are confirmed and activated."
      />

      {/* Record Payment Dialog */}
      {paymentModalInvoice && (
        <RecordPaymentModal
          isOpen={true}
          invoice={paymentModalInvoice}
          onClose={() => setPaymentModalInvoice(null)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
