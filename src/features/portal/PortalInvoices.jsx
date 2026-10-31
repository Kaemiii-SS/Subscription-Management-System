import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { invoicesApi } from '../../api/invoices';
import { useAuth } from '../../context/AuthContext';
import { formatDate, isInvoiceOverdue } from '../../lib/utils';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import MoneyText from '../../components/ui/MoneyText';
import RecordPaymentModal from '../payments/RecordPaymentModal';
import { CreditCard, Printer, Eye } from 'lucide-react';

export default function PortalInvoices() {
  const { user } = useAuth();
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentInvoice, setPaymentInvoice] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['portal-invoices', user?.id],
    queryFn: () => invoicesApi.getAll({ size: 50 }),
  });

  const columns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      render: (row) => <span className="font-mono font-bold text-blue-600">{row.invoiceNumber}</span>,
    },
    {
      key: 'invoiceDate',
      header: 'Date Issued',
      render: (row) => <span className="text-xs text-slate-600">{formatDate(row.invoiceDate)}</span>,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (row) => {
        const overdue = isInvoiceOverdue(row.dueDate, row.status);
        return (
          <span className={`text-xs font-medium ${overdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
            {formatDate(row.dueDate)}
          </span>
        );
      },
    },
    {
      key: 'total',
      header: 'Total Amount',
      render: (row) => <MoneyText amount={row.total} className="font-bold text-slate-900" />,
    },
    {
      key: 'amountLeft',
      header: 'Remaining Balance',
      render: (row) => (
        <MoneyText
          amount={row.amountLeft}
          className={`font-mono font-bold ${row.amountLeft > 0 ? 'text-rose-600' : 'text-emerald-600'}`}
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
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
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
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedInvoice.invoiceNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Issued: {formatDate(selectedInvoice.invoiceDate)}
                </p>
              </div>
              <StatusBadge status={selectedInvoice.status} />
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="space-y-2 border-b border-slate-100 pb-4">
                <h4 className="font-bold text-slate-900 uppercase">Purchased Items</h4>
                {selectedInvoice.lines?.map((line, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-700">{line.description}</span>
                    <MoneyText amount={line.amount} className="font-bold text-slate-900" />
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-right">
                <div className="flex justify-between text-slate-500">
                  <span>Taxes Applied:</span>
                  <MoneyText amount={selectedInvoice.taxAmount} />
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Paid:</span>
                  <MoneyText amount={selectedInvoice.paidAmount} className="text-emerald-600 font-bold" />
                </div>
                <div className="flex justify-between text-slate-900 font-bold pt-2 border-t border-slate-200">
                  <span>Balance Due:</span>
                  <MoneyText amount={selectedInvoice.amountLeft} className="text-blue-600 font-black text-sm" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl"
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
