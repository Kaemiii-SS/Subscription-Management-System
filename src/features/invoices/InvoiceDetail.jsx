import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '../../api/invoices';
import { ROUTES } from '../../constants/routes';
import { INVOICE_STATUS } from '../../constants/status';
import { formatDate, isInvoiceOverdue } from '../../lib/utils';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import MoneyText from '../../components/ui/MoneyText';
import RecordPaymentModal from '../payments/RecordPaymentModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { MascotBanner } from '../../components/mascot/MascotGuide';
import {
  ArrowLeft,
  Printer,
  CreditCard,
  Send,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function InvoiceDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(null);

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoice-detail', id],
    queryFn: () => invoicesApi.getById(id),
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus) => invoicesApi.updateStatus(invoice.id, newStatus),
    onSuccess: (updated) => {
      toast.success(`Invoice status changed to ${updated.status}`);
      queryClient.invalidateQueries({ queryKey: ['invoice-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setConfirmStatus(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Status transition failed');
      setConfirmStatus(null);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
        <div className="h-8 bg-background rounded-lg w-1/3"></div>
        <div className="h-96 bg-surface rounded-2xl border border-border"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="text-center py-16 bg-surface rounded-2xl border border-border max-w-md mx-auto">
        <XCircle className="w-12 h-12 text-coral mx-auto mb-3" />
        <h3 className="text-base font-bold text-textPrimary mb-1">Invoice Not Found</h3>
        <p className="text-xs text-textSecondary mb-6">{error?.message || 'Invoice record could not be loaded.'}</p>
        <Link
          to={ROUTES.INVOICES}
          className="px-4 py-2 text-xs font-bold text-white bg-primary rounded-xl"
        >
          Return to list
        </Link>
      </div>
    );
  }

  const isOverdue = isInvoiceOverdue(invoice.dueDate, invoice.status);

  const handlePrint = () => {
    window.print();
  };

  const handleSendInvoice = () => {
    toast.success(`Invoice dispatched to ${invoice.customerEmail}`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top action controls (hidden when printing) */}
      <div className="no-print space-y-4">
        <PageHeader
          title={`Invoice ${invoice.invoiceNumber}`}
          subtitle={`Subscription: ${invoice.subscriptionNumber || 'N/A'}`}
          badge={<StatusBadge status={invoice.status} isOverdue={isOverdue} />}
          backButton={
            <Link
              to={ROUTES.INVOICES}
              className="p-2 text-textSecondary hover:text-textPrimary hover:bg-surface rounded-xl transition-colors inline-block"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          }
          action={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-textPrimary bg-surface hover:bg-background border border-border rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / PDF</span>
              </button>

              <button
                type="button"
                onClick={handleSendInvoice}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-textPrimary bg-surface hover:bg-background border border-border rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Email Invoice</span>
              </button>

              {invoice.status === INVOICE_STATUS.DRAFT && (
                <button
                  type="button"
                  onClick={() =>
                    setConfirmStatus({
                      title: 'Confirm Invoice?',
                      message: 'Marking this invoice as Confirmed commits it for collection.',
                      status: INVOICE_STATUS.CONFIRMED,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-[#15803d] rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Confirm Invoice</span>
                </button>
              )}

              {invoice.amountLeft > 0 && invoice.status !== INVOICE_STATUS.CANCELLED && (
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-[#15803d] rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
              )}
            </div>
          }
        />

        {/* Mascot Guidance */}
        <MascotBanner
          title="Hop's Statement Review"
          tip="Invoice Helper"
          message={
            invoice.status === 'Paid'
              ? 'This invoice is completely settled! All amounts are reconciled in the payments ledger.'
              : `Balance due is $${invoice.amountLeft.toFixed(2)}. Click 'Record Payment' above to record an incoming wire, card or UPI payment.`
          }
        />
      </div>

      {/* Invoice Paper Document for View & Print */}
      <div className="bg-surface rounded-3xl border border-border shadow-xs p-8 sm:p-12 print:border-none print:shadow-none print:p-0">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-8 border-b border-border">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-sage border border-mint p-1 flex items-center justify-center">
                <img src="/mascot.png" alt="Hop" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-black text-xl text-textPrimary tracking-tight">Brightloop Software</span>
                <span className="text-[10px] text-primary font-bold block">Recurring Billing System</span>
              </div>
            </div>
            <p className="text-xs text-textSecondary">100 Silicon Vista Blvd, Tech District</p>
            <p className="text-xs text-textSecondary">Austin, Texas, United States</p>
            <p className="text-xs text-textSecondary">billing@brightloop.com</p>
          </div>

          <div className="text-left sm:text-right">
            <h2 className="text-2xl font-black text-textPrimary uppercase tracking-tight">
              INVOICE
            </h2>
            <p className="text-sm font-mono font-bold text-primary mt-0.5">
              {invoice.invoiceNumber}
            </p>
            <div className="mt-3 space-y-1 text-xs text-textSecondary">
              <p>
                <span className="text-textSecondary/70">Invoice Date:</span>{' '}
                <span className="font-semibold text-textPrimary">{formatDate(invoice.invoiceDate)}</span>
              </p>
              <p>
                <span className="text-textSecondary/70">Due Date:</span>{' '}
                <span className={`font-bold ${isOverdue ? 'text-coral' : 'text-textPrimary'}`}>
                  {formatDate(invoice.dueDate)}
                </span>
              </p>
              <p>
                <span className="text-textSecondary/70">Subscription Ref:</span>{' '}
                <span className="font-mono font-semibold text-textPrimary">
                  {invoice.subscriptionNumber}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Bill To Info */}
        <div className="py-6 border-b border-border flex flex-col sm:flex-row justify-between gap-6">
          <div>
            <span className="text-[11px] font-bold text-textSecondary uppercase tracking-wider block mb-1">
              Billed To Customer:
            </span>
            <h4 className="text-sm font-bold text-textPrimary">{invoice.customerName}</h4>
            <p className="text-xs text-textSecondary">{invoice.customerEmail}</p>
            <p className="text-xs text-textSecondary mt-1">Verified Client</p>
          </div>

          <div className="bg-background p-4 rounded-2xl border border-border min-w-[220px]">
            <span className="text-[11px] font-bold text-textSecondary uppercase tracking-wider block mb-1">
              Payment Status Summary
            </span>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs text-textSecondary">Total Billed:</span>
              <MoneyText amount={invoice.total} className="font-bold text-textPrimary text-xs" />
            </div>
            <div className="flex justify-between items-baseline mb-1 text-primary">
              <span className="text-xs font-semibold">Paid to Date:</span>
              <MoneyText amount={invoice.paidAmount} className="font-bold text-xs" />
            </div>
            <div className="pt-2 border-t border-border flex justify-between items-baseline">
              <span className="text-xs font-bold text-textPrimary">Amount Due:</span>
              <MoneyText
                amount={invoice.amountLeft}
                className={`font-black text-sm ${invoice.amountLeft > 0 ? 'text-coral' : 'text-primary'}`}
              />
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border text-textSecondary uppercase font-bold">
              <tr>
                <th className="py-3">Description</th>
                <th className="py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {invoice.lines?.map((line, idx) => (
                <tr key={idx}>
                  <td className="py-3.5 text-textPrimary font-semibold">{line.description}</td>
                  <td className="py-3.5 text-right font-mono font-bold text-textPrimary">
                    <MoneyText amount={line.amount} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="pt-6 border-t border-border flex flex-col items-end gap-2 text-xs text-textSecondary">
            <div className="flex justify-between w-64">
              <span>Subtotal:</span>
              <MoneyText
                amount={invoice.total - (invoice.taxAmount || 0) + (invoice.discountAmount || 0)}
                className="font-bold text-textPrimary"
              />
            </div>

            {invoice.discountAmount > 0 && (
              <div className="flex justify-between w-64 text-primary font-bold">
                <span>Special Promotion / Discount:</span>
                <span>-<MoneyText amount={invoice.discountAmount} /></span>
              </div>
            )}

            <div className="flex justify-between w-64">
              <span>Taxes Applied ({invoice.taxPercent}%):</span>
              <MoneyText amount={invoice.taxAmount || 0} className="font-bold text-textPrimary" />
            </div>

            <div className="flex justify-between w-64 pt-3 border-t border-border text-sm font-black text-textPrimary">
              <span>Total Invoice Amount:</span>
              <MoneyText amount={invoice.total} className="text-base text-primary" />
            </div>
          </div>
        </div>

        {/* Payment History Log */}
        {invoice.paymentHistory && invoice.paymentHistory.length > 0 && (
          <div className="pt-8 border-t border-border">
            <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider mb-3">
              Recorded Payment Receipts
            </h4>
            <div className="space-y-2">
              {invoice.paymentHistory.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-sage/50 rounded-xl border border-mint flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-textPrimary font-mono">{p.paymentNumber}</span>
                    <span className="text-textSecondary ml-2">via {p.method}</span>
                    <span className="text-textSecondary ml-2">({formatDate(p.date)})</span>
                    {p.note && <p className="text-[11px] text-textSecondary mt-0.5">{p.note}</p>}
                  </div>
                  <MoneyText amount={p.amount} className="font-black text-primary font-mono" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-border text-center text-xs text-textSecondary flex items-center justify-center gap-1.5">
          <img src="/mascot.png" alt="Hop" className="w-4 h-4 object-contain inline" />
          <span>Thank you for choosing Brightloop Software. Questions? Contact billing@brightloop.com</span>
        </div>
      </div>

      {/* Record Payment Dialog */}
      {paymentModalOpen && (
        <RecordPaymentModal
          isOpen={true}
          invoice={invoice}
          onClose={() => setPaymentModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['invoice-detail', id] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
          }}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(confirmStatus)}
        title={confirmStatus?.title}
        message={confirmStatus?.message}
        onConfirm={() => statusMutation.mutate(confirmStatus.status)}
        onClose={() => setConfirmStatus(null)}
      />
    </div>
  );
}
