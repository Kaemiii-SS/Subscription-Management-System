import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { plansApi } from '../../api/plans';
import FormField from '../../components/ui/FormField';
import { BILLING_PERIODS } from '../../constants/status';
import { X } from 'lucide-react';
import { toast } from 'sonner';

const planSchema = z.object({
  name: z.string().min(2, 'Plan name must be at least 2 characters'),
  price: z.number().min(0, 'Price cannot be negative'),
  billingPeriod: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  minSeats: z.number().int().min(1, 'Minimum seats must be at least 1'),
  canPause: z.boolean().default(true),
  canRenew: z.boolean().default(true),
  canCloseEarly: z.boolean().default(true),
  autoInvoice: z.boolean().default(true),
});

export default function PlanFormModal({ isOpen, plan, onClose, onSuccess }) {
  if (!isOpen) return null;

  const isEditing = Boolean(plan && plan.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: plan?.name || '',
      price: plan ? Number(plan.price) : 29.0,
      billingPeriod: plan?.billingPeriod || 'monthly',
      minSeats: plan ? Number(plan.minSeats || 1) : 1,
      canPause: plan?.canPause ?? true,
      canRenew: plan?.canRenew ?? true,
      canCloseEarly: plan?.canCloseEarly ?? true,
      autoInvoice: plan?.autoInvoice ?? true,
    },
  });

  const onSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      if (isEditing) {
        await plansApi.update(plan.id, values);
        toast.success(`Plan ${values.name} updated!`);
      } else {
        await plansApi.create(values);
        toast.success(`Plan ${values.name} created!`);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-xl bg-[var(--surface-strong)] backdrop-blur-xl rounded-3xl shadow-2xl border border-[var(--border)] overflow-hidden max-h-[90vh] flex flex-col text-textPrimary"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-[var(--surface-strong)] border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white">
              {isEditing ? `Edit Plan: ${plan.name}` : 'Create Recurring Billing Plan'}
            </h3>
            <p className="text-xs text-white/90 mt-0.5 font-medium">
              Define billing cadence, minimum seat requirements, and lifecycle rule switches.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
          <FormField label="Plan Name" error={errors.name?.message} required>
            <input
              type="text"
              {...register('name')}
              placeholder="e.g. Monthly Enterprise Pro"
              className="w-full px-3.5 py-2.5 text-xs bg-[var(--surface-strong)] border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-white font-semibold placeholder-white/40"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <FormField label="Base Price" error={errors.price?.message} required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/80 text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('price', { valueAsNumber: true })}
                  className="w-full pl-7 pr-3 py-2.5 text-xs font-mono font-bold bg-[var(--surface-strong)] border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-white"
                />
              </div>
            </FormField>

            <FormField label="Billing Period" error={errors.billingPeriod?.message} required>
              <select
                {...register('billingPeriod')}
                className="w-full px-3 py-2.5 text-xs bg-[var(--surface-strong)] border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-white font-semibold capitalize cursor-pointer"
              >
                <option value="daily" className="bg-[#002222] text-white">Daily</option>
                <option value="weekly" className="bg-[#002222] text-white">Weekly</option>
                <option value="monthly" className="bg-[#002222] text-white">Monthly</option>
                <option value="yearly" className="bg-[#002222] text-white">Yearly</option>
              </select>
            </FormField>

            <FormField label="Min Seats" error={errors.minSeats?.message} required>
              <input
                type="number"
                min="1"
                {...register('minSeats', { valueAsNumber: true })}
                className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-[var(--surface-strong)] border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-white"
              />
            </FormField>
          </div>

          {/* Rule Switches (4 policy controls) */}
          <div className="pt-2">
            <label className="text-xs font-bold text-white uppercase tracking-wider block mb-2">
              Lifecycle Policy Controls
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-start gap-3 p-3 rounded-2xl border border-white/20 bg-[var(--surface-strong)] cursor-pointer hover:border-accent transition-all">
                <input
                  type="checkbox"
                  {...register('canPause')}
                  className="mt-0.5 rounded text-accent border-white/30 focus:ring-accent"
                />
                <div>
                  <span className="text-xs font-bold text-white block">Can pause</span>
                  <span className="text-xs text-white/80 block mt-0.5 font-medium">
                    Customer or staff can pause billing without terminating contract.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-2xl border border-white/20 bg-[var(--surface-strong)] cursor-pointer hover:border-accent transition-all">
                <input
                  type="checkbox"
                  {...register('canCloseEarly')}
                  className="mt-0.5 rounded text-accent border-white/30 focus:ring-accent"
                />
                <div>
                  <span className="text-xs font-bold text-white block">Can close early</span>
                  <span className="text-xs text-white/80 block mt-0.5 font-medium">
                    Allows cancellation prior to the contracted expiry term.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-2xl border border-white/20 bg-[var(--surface-strong)] cursor-pointer hover:border-accent transition-all">
                <input
                  type="checkbox"
                  {...register('autoInvoice')}
                  className="mt-0.5 rounded text-accent border-white/30 focus:ring-accent"
                />
                <div>
                  <span className="text-xs font-bold text-white block">Auto invoice</span>
                  <span className="text-xs text-white/80 block mt-0.5 font-medium">
                    Generates recurring invoices automatically at start of cycle.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-2xl border border-white/20 bg-[var(--surface-strong)] cursor-pointer hover:border-accent transition-all">
                <input
                  type="checkbox"
                  {...register('canRenew')}
                  className="mt-0.5 rounded text-accent border-white/30 focus:ring-accent"
                />
                <div>
                  <span className="text-xs font-bold text-white block">Can renew</span>
                  <span className="text-xs text-white/80 block mt-0.5 font-medium">
                    Permits rolling renewal into the subsequent billing cycle.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
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
              className="px-5 py-2 text-xs font-bold text-[#0b1a1a] bg-accent hover:bg-accent-hover disabled:opacity-50 rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting && (
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              )}
              <span>{isEditing ? 'Save Plan' : 'Create Plan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
