import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { invoicesApi } from '../../api/invoices';
import { formatDate, isInvoiceOverdue } from '../../lib/utils';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import MoneyText from '../../components/ui/MoneyText';
import RecordPaymentModal from '../payments/RecordPaymentModal';
import { CreditCard, Eye, Printer, X } from 'lucide-react';

export default function PortalInvoices() {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentInvoice, setPaymentInvoice] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['portal-invoices'],
    queryFn: () => invoicesApi.getAll({ size: 50 }),
  });

  const columns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      render: (row) => <span className="font-mono font-bold text-accent">{row.invoiceNumber}</span>,
    },
    {
      key: 'invoiceDate',
      header: 'Date Issued',
      render: (row) => <span className="text-xs text-textSecondary">{formatDate(row.invoiceDate)}</span>,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (row) => {
        const overdue = isInvoiceOverdue(row.dueDate, row.status);
        return (
          <span className={`text-xs font-medium ${overdue ? 'text-danger font-bold' : 'text-textSecondary'}`}>
            {formatDate(row.dueDate)}
          </span>
        );
      },
    },
    {
      key: 'total',
      header: 'Total Amount',
      render: (row) => <MoneyText amount={row.total} className="font-bold text-textPrimary" />,
    },
    {
      key: 'amountLeft',
      header: 'Remaining Balance',
      render: (row) => (
        <MoneyText
          amount={row.amountLeft}
          className={`font-mono font-bold ${row.amountLeft > 0 ? 'text-danger' : 'text-success'}`}
        />
      ),
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
      header: 'Action',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          {row.amountLeft > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPaymentInvoice(row);
              }}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-[#0b1a1a] bg-accent hover:bg-accent-hover rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <CreditCard className="w-3 h-3" />
              <span>Pay Online</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedInvoice(row);
            }}
            className="p-1.5 text-textSecondary hover:text-textPrimary hover:bg-[var(--accent-soft)] rounded-lg transition-colors cursor-pointer"
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
        title="My Invoices & Payment History"
        subtitle="View detailed statements, tax invoices, and settle outstanding balances."
      />

      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        total={data?.total || 0}
        onRowClick={(row) => setSelectedInvoice(row)}
        emptyTitle="No invoices found"
        emptyDescription="You do not have any invoices at this time."
      />

      {/* Invoice Modal for Customer */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-xl bg-[var(--surface-strong)] backdrop-blur-xl rounded-3xl shadow-2xl border border-[var(--border)] overflow-hidden max-h-[90vh] flex flex-col text-textPrimary">
            <div className="p-6 bg-[var(--surface-strong)]/80 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-textPrimary">
                  {selectedInvoice.invoiceNumber}
                </h3>
                <p className="text-xs text-textSecondary">
                  Issued: {formatDate(selectedInvoice.invoiceDate)}
                </p>
              </div>
              <StatusBadge status={selectedInvoice.status} />
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="space-y-2 border-b border-[var(--border)] pb-4">
                <h4 className="font-bold text-textPrimary uppercase">Purchased Items</h4>
                {selectedInvoice.lines?.map((line, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-[var(--border)]/40">
                    <span className="text-textSecondary">{line.description}</span>
                    <MoneyText amount={line.amount} className="font-bold text-textPrimary" />
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-right">
                <div className="flex justify-between text-textSecondary">
                  <span>Taxes Applied:</span>
                  <MoneyText amount={selectedInvoice.taxAmount} />
                </div>
                <div className="flex justify-between text-textSecondary">
                  <span>Paid:</span>
                  <MoneyText amount={selectedInvoice.paidAmount} className="text-success font-bold" />
                </div>
                <div className="flex justify-between text-textPrimary font-bold pt-2 border-t border-[var(--border)]">
                  <span>Balance Due:</span>
                  <MoneyText amount={selectedInvoice.amountLeft} className="text-danger font-black text-sm" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-[var(--surface-strong)]/80 border-t border-[var(--border)] flex justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-textPrimary bg-[var(--accent-soft)] hover:bg-accent hover:text-[#0b1a1a] border border-[var(--border)] rounded-xl transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-1.5 text-xs font-semibold text-textSecondary hover:text-textPrimary hover:bg-[var(--accent-soft)] border border-[var(--border)] rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record / Pay Modal */}
      {paymentInvoice && (
        <RecordPaymentModal
          isOpen={true}
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
