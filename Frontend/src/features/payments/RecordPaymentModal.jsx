import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { paymentsApi } from '../../api/payments';
import { PAYMENT_METHODS } from '../../constants/status';
import FormField from '../../components/ui/FormField';
import MoneyText from '../../components/ui/MoneyText';
import { X, Calendar, Hash, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const paymentSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than 0'),
  method: z.string().min(1, 'Please select a payment method'),
  date: z.string().min(1, 'Payment date is required'),
  reference: z.string().optional(),
  note: z.string().optional(),
});

export default function RecordPaymentModal({
  isOpen,
  invoice,
  onClose,
  onSuccess,
}) {
  if (!isOpen || !invoice) return null;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: invoice.amountLeft > 0 ? invoice.amountLeft : invoice.total,
      method: 'Bank Transfer',
      date: new Date().toISOString().split('T')[0],
      reference: '',
      note: '',
    },
  });

  const onSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      setServerError('');

      if (values.amount > invoice.amountLeft) {
        setServerError(`Payment amount cannot exceed the balance due ($${invoice.amountLeft.toFixed(2)})`);
        setIsSubmitting(false);
        return;
      }

      const result = await paymentsApi.recordPayment({
        invoiceId: invoice.id,
        amount: Number(values.amount),
        method: values.method,
        date: values.date,
        reference: values.reference,
        note: values.note,
      });

      toast.success(
        `Payment ${result.payment.paymentNumber} of $${values.amount.toFixed(2)} recorded successfully!`
      );
      onSuccess && onSuccess(result);
      onClose();
    } catch (err) {
      setServerError(err.response?.data?.message || err.message || 'Failed to record payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-lg bg-[var(--surface-strong)] backdrop-blur-xl rounded-3xl shadow-2xl border border-[var(--border)] overflow-hidden transform transition-all text-textPrimary"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header with Hop */}
        <div className="px-6 py-4 bg-[var(--surface-strong)] border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-0.5 flex items-center justify-center shadow-xs">
              <img src="/mascot.png" alt="Hop Guide" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Record Payment Receipt</h3>
              <p className="text-xs text-white/90 mt-0.5 font-medium">
                Invoice <span className="font-bold text-accent">{invoice.invoiceNumber}</span> • {invoice.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Summary Header */}
        <div className="px-6 py-3.5 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between text-xs">
          <div>
            <span className="text-textSecondary">Total Invoice: </span>
            <MoneyText amount={invoice.total} className="font-bold text-textPrimary" />
          </div>
          <div>
            <span className="text-textSecondary">Paid: </span>
            <MoneyText amount={invoice.paidAmount} className="font-bold text-accent" />
          </div>
          <div className="bg-[var(--surface-strong)] px-2.5 py-1 rounded-lg border border-danger/40 shadow-2xs">
            <span className="text-textSecondary font-semibold">Due: </span>
            <MoneyText amount={invoice.amountLeft} className="font-black text-danger" />
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {serverError && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-xs text-danger font-semibold">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Amount to Pay" error={errors.amount?.message} required>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textSecondary font-bold text-xs">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  className="w-full pl-8 pr-3.5 py-2 text-xs font-mono font-bold bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-textPrimary"
                />
              </div>
            </FormField>

            <FormField label="Payment Method" error={errors.method?.message} required>
              <select
                {...register('method')}
                className="w-full px-3.5 py-2 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-textPrimary font-semibold cursor-pointer"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method} className="bg-[#002222] text-[#f2f5e8]">
                    {method}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Payment Date" error={errors.date?.message} required>
              <div className="relative">
                <Calendar className="w-4 h-4 text-textSecondary absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  {...register('date')}
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none text-textPrimary font-medium"
                />
              </div>
            </FormField>

            <FormField label="Reference / Transaction ID" error={errors.reference?.message}>
              <div className="relative">
                <Hash className="w-4 h-4 text-textSecondary absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  {...register('reference')}
                  placeholder="e.g. WIRE-884920"
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none text-textPrimary font-medium"
                />
              </div>
            </FormField>
          </div>

          <FormField label="Internal Notes / Memos" error={errors.note?.message}>
            <textarea
              rows={2}
              {...register('note')}
              placeholder="e.g. Wire transfer confirmed by accounting"
              className="w-full p-3 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none text-textPrimary font-medium"
            />
          </FormField>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 rounded-xl border border-white/20 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-[#0b1a1a] bg-accent hover:bg-accent-hover disabled:opacity-50 rounded-xl shadow-md shadow-accent/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Confirm & Record Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
