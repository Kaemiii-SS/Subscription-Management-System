import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { plansApi } from '../../api/plans';
import FormField from '../../components/ui/FormField';
import { X, Sliders } from 'lucide-react';
import { toast } from 'sonner';

const planSchema = z.object({
  name: z.string().min(2, 'Plan name is required'),
  price: z.number({ invalid_type_error: 'Price must be a number' }).min(0),
  billingPeriod: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  minQuantity: z.number({ invalid_type_error: 'Must be number' }).min(1),
  availableFrom: z.string().min(1, 'Start date required'),
  availableTo: z.string().min(1, 'End date required'),
  autoClose: z.boolean().default(false),
  canCloseEarly: z.boolean().default(true),
  canPause: z.boolean().default(true),
  canRenew: z.boolean().default(true),
  description: z.string().optional(),
});

export default function PlanFormModal({ isOpen, plan, onClose, onSuccess }) {
  if (!isOpen) return null;

  const isEditing = Boolean(plan?.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: '',
      price: 1500,
      billingPeriod: 'monthly',
      minQuantity: 1,
      availableFrom: new Date().toISOString().split('T')[0],
      availableTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      autoClose: false,
      canCloseEarly: true,
      canPause: true,
      canRenew: true,
      description: '',
    },
  });

  useEffect(() => {
    if (plan) {
      reset({
        name: plan.name,
        price: Number(plan.price) || 0,
        billingPeriod: plan.billingPeriod || 'monthly',
        minQuantity: Number(plan.minQuantity) || 1,
        availableFrom: plan.availableFrom || '',
        availableTo: plan.availableTo || '',
        autoClose: Boolean(plan.autoClose),
        canCloseEarly: plan.canCloseEarly !== undefined ? Boolean(plan.canCloseEarly) : true,
        canPause: plan.canPause !== undefined ? Boolean(plan.canPause) : true,
        canRenew: plan.canRenew !== undefined ? Boolean(plan.canRenew) : true,
        description: plan.description || '',
      });
    }
  }, [plan, reset]);

  const onSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      if (isEditing) {
        await plansApi.update(plan.id, values);
        toast.success(`Plan "${values.name}" updated successfully!`);
      } else {
        await plansApi.create(values);
        toast.success(`Plan "${values.name}" created successfully!`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-xl bg-surface rounded-3xl shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col text-textPrimary"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-background border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-textPrimary">
              {isEditing ? `Edit Plan: ${plan.name}` : 'Create Recurring Billing Plan'}
            </h3>
            <p className="text-xs text-textSecondary">
              Define billing cadence, minimum seat requirements, and lifecycle rule switches.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-textSecondary hover:text-textPrimary p-1.5 rounded-xl hover:bg-surface cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
          <FormField label="Plan Name" error={errors.name?.message} required>
            <input
              type="text"
              {...register('name')}
              placeholder="e.g. Monthly Enterprise Pro"
              className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-textPrimary font-semibold"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <FormField label="Base Price" error={errors.price?.message} required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('price', { valueAsNumber: true })}
                  className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-background border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-textPrimary"
                />
              </div>
            </FormField>

            <FormField label="Billing Period" error={errors.billingPeriod?.message} required>
              <select
                {...register('billingPeriod')}
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-textPrimary font-semibold capitalize cursor-pointer"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </FormField>

            <FormField label="Min. Quantity / Seats" error={errors.minQuantity?.message} required>
              <input
                type="number"
                min="1"
                {...register('minQuantity', { valueAsNumber: true })}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-background border border-border rounded-xl focus:bg-surface text-textPrimary"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField label="Available From" error={errors.availableFrom?.message} required>
              <input
                type="date"
                {...register('availableFrom')}
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-textPrimary font-medium"
              />
            </FormField>

            <FormField label="Available To" error={errors.availableTo?.message} required>
              <input
                type="date"
                {...register('availableTo')}
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-textPrimary font-medium"
              />
            </FormField>
          </div>

          <FormField label="Description / Contract Details" error={errors.description?.message}>
            <textarea
              rows={2}
              {...register('description')}
              placeholder="Terms of service, SLA guarantees or notes..."
              className="w-full p-3 text-xs bg-background border border-border rounded-xl focus:bg-surface text-textPrimary"
            />
          </FormField>

          {/* 4 Policy Switches per Spec */}
          <div className="pt-3 border-t border-border space-y-2.5">
            <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Sliders className="w-3.5 h-3.5 text-primary" />
              Subscription Lifecycle Policy Switches
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-background border border-border cursor-pointer hover:bg-sage/30 transition-colors">
                <input
                  type="checkbox"
                  {...register('autoClose')}
                  className="mt-0.5 w-4 h-4 rounded text-primary border-border focus:ring-primary"
                />
                <div>
                  <span className="text-xs font-bold text-textPrimary block">Auto-close at end</span>
                  <span className="text-[11px] text-textSecondary block">
                    Automatically close subscription when contract expiry date arrives.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-background border border-border cursor-pointer hover:bg-sage/30 transition-colors">
                <input
                  type="checkbox"
                  {...register('canCloseEarly')}
                  className="mt-0.5 w-4 h-4 rounded text-primary border-border focus:ring-primary"
                />
                <div>
                  <span className="text-xs font-bold text-textPrimary block">Can close early</span>
                  <span className="text-[11px] text-textSecondary block">
                    Allows staff or customer to terminate prior to full expiration.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-background border border-border cursor-pointer hover:bg-sage/30 transition-colors">
                <input
                  type="checkbox"
                  {...register('canPause')}
                  className="mt-0.5 w-4 h-4 rounded text-primary border-border focus:ring-primary"
                />
                <div>
                  <span className="text-xs font-bold text-textPrimary block">Can pause</span>
                  <span className="text-[11px] text-textSecondary block">
                    Temporarily halt recurring billing generation without closing.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-background border border-border cursor-pointer hover:bg-sage/30 transition-colors">
                <input
                  type="checkbox"
                  {...register('canRenew')}
                  className="mt-0.5 w-4 h-4 rounded text-primary border-border focus:ring-primary"
                />
                <div>
                  <span className="text-xs font-bold text-textPrimary block">Can renew</span>
                  <span className="text-[11px] text-textSecondary block">
                    Permits rolling renewal into the subsequent billing cycle.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
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
              className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-[#15803d] disabled:bg-primary/50 rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              )}
              <span>{isEditing ? 'Save Plan' : 'Create Plan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
