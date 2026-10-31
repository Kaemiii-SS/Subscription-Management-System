import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { paymentsApi } from '../../api/payments';
import { PAYMENT_METHODS } from '../../constants/status';
import FormField from '../../components/ui/FormField';
import MoneyText from '../../components/ui/MoneyText';
import { X, CreditCard, Calendar, Hash, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RecordPaymentModal({ isOpen, invoice, onClose, onSuccess }) {
  if (!isOpen || !invoice) return null;

  const maxAmount = invoice.amountLeft || 0;

  const paymentSchema = z.object({
    amount: z
      .number({ invalid_type_error: 'Please enter a valid amount' })
      .positive('Amount must be greater than zero')
      .max(maxAmount + 0.01, `Amount cannot exceed remaining balance of $${maxAmount}`),
    method: z.string().min(1, 'Please select a payment method'),
    date: z.string().min(1, 'Payment date is required'),
    reference: z.string().optional(),
    note: z.string().optional(),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: maxAmount,
      method: PAYMENT_METHODS[0],
      date: new Date().toISOString().split('T')[0],
      reference: '',
      note: '',
    },
  });

  useEffect(() => {
    setValue('amount', maxAmount);
  }, [maxAmount, setValue]);

  const onSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      setServerError('');
      const result = await paymentsApi.recordPayment({
        invoiceId: invoice.id,
        amount: values.amount,
        method: values.method,
        date: values.date,
        reference: values.reference,
        note: values.note,
      });

      toast.success(
        `Payment of $${values.amount.toFixed(2)} recorded successfully for ${invoice.invoiceNumber}!`
      );
      if (onSuccess) onSuccess(result);
      onClose();
    } catch (err) {
      setServerError(err.response?.data?.message || err.message || 'Failed to record payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-lg bg-surface rounded-3xl shadow-2xl border border-border overflow-hidden transform transition-all text-textPrimary"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header with Hop */}
        <div className="px-6 py-4 bg-background border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sage border border-mint p-0.5 flex items-center justify-center shadow-xs">
              <img src="/mascot.png" alt="Hop Guide" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="text-base font-bold text-textPrimary">Record Payment Receipt</h3>
              <p className="text-xs text-textSecondary">
                Invoice <span className="font-bold text-primary">{invoice.invoiceNumber}</span> • {invoice.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-textSecondary hover:text-textPrimary p-1.5 rounded-xl hover:bg-surface transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Balance Summary Header */}
        <div className="px-6 py-3.5 bg-sage/40 border-b border-mint/60 flex items-center justify-between text-xs">
          <div>
            <span className="text-textSecondary">Total Invoice: </span>
            <MoneyText amount={invoice.total} className="font-bold text-textPrimary" />
          </div>
          <div>
            <span className="text-textSecondary">Paid: </span>
            <MoneyText amount={invoice.paidAmount} className="font-bold text-primary" />
          </div>
          <div className="bg-surface px-2.5 py-1 rounded-lg border border-mint shadow-2xs">
            <span className="text-textSecondary font-semibold">Due: </span>
            <MoneyText amount={invoice.amountLeft} className="font-black text-coral" />
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {serverError && (
            <div className="p-3 rounded-xl bg-coral/10 border border-coral/30 text-xs text-coral-700 font-semibold">
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
                  className="w-full pl-8 pr-3.5 py-2 text-xs font-mono font-bold bg-background border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-textPrimary"
                />
              </div>
            </FormField>

            <FormField label="Payment Method" error={errors.method?.message} required>
              <select
                {...register('method')}
                className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-textPrimary font-semibold cursor-pointer"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
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
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:bg-surface text-textPrimary font-medium"
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
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:bg-surface text-textPrimary font-medium"
                />
              </div>
            </FormField>
          </div>

          <FormField label="Internal Notes / Memos" error={errors.note?.message}>
            <textarea
              rows={2}
              {...register('note')}
              placeholder="e.g. Wire transfer confirmed by accounting"
              className="w-full p-3 text-xs bg-background border border-border rounded-xl focus:bg-surface text-textPrimary font-medium"
            />
          </FormField>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-textSecondary hover:bg-background rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-[#15803d] disabled:bg-primary/50 rounded-xl shadow-md shadow-primary/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
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
