import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { discountsApi } from '../../api/discounts';
import { productsApi } from '../../api/products';
import { useQuery } from '@tanstack/react-query';
import FormField from '../../components/ui/FormField';
import { X } from 'lucide-react';
import { toast } from 'sonner';

const discountSchema = z.object({
  name: z.string().min(2, 'Discount name is required'),
  code: z.string().min(2, 'Code is required').toUpperCase(),
  type: z.enum(['percent', 'fixed']),
  value: z.number({ invalid_type_error: 'Value must be a number' }).min(0),
  minPurchase: z.number().min(0).default(0),
  minQuantity: z.number().min(1).default(1),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().min(1, 'End date required'),
  usageLimit: z.number().min(1, 'Usage limit must be at least 1'),
  appliesTo: z.enum(['subscription', 'product']),
  targetProductId: z.string().optional().nullable(),
});

export default function DiscountFormModal({ isOpen, discount, onClose, onSuccess }) {
  if (!isOpen) return null;

  const isEditing = Boolean(discount?.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: products = { items: [] } } = useQuery({
    queryKey: ['products-for-discount'],
    queryFn: () => productsApi.getAll({ size: 100 }),
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      name: '',
      code: 'PROMO10',
      type: 'percent',
      value: 10,
      minPurchase: 0,
      minQuantity: 1,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      usageLimit: 25,
      appliesTo: 'subscription',
      targetProductId: null,
    },
  });

  const appliesToVal = watch('appliesTo');
  const typeVal = watch('type');

  useEffect(() => {
    if (discount) {
      reset({
        name: discount.name,
        code: discount.code || '',
        type: discount.type || 'percent',
        value: Number(discount.value) || 0,
        minPurchase: Number(discount.minPurchase) || 0,
        minQuantity: Number(discount.minQuantity) || 1,
        startDate: discount.startDate || '',
        endDate: discount.endDate || '',
        usageLimit: Number(discount.usageLimit) || 10,
        appliesTo: discount.appliesTo || 'subscription',
        targetProductId: discount.targetProductId || null,
      });
    }
  }, [discount, reset]);

  const onSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      if (isEditing) {
        await discountsApi.update(discount.id, values);
        toast.success(`Discount rule "${values.name}" updated!`);
      } else {
        await discountsApi.create(values);
        toast.success(`Discount rule "${values.name}" created!`);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save discount rule');
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
              {isEditing ? `Edit Discount Rule: ${discount.name}` : 'New Discount Rule'}
            </h3>
            <p className="text-xs text-textSecondary">
              Define redemption codes, seat minimums, and usage quota thresholds.
            </p>
          </div>
          <button onClick={onClose} className="text-textSecondary hover:text-textPrimary p-1.5 rounded-xl cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField label="Discount Name" error={errors.name?.message} required>
              <input
                type="text"
                {...register('name')}
                placeholder="e.g. Enterprise Volume 15%"
                className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:bg-surface text-textPrimary font-semibold"
              />
            </FormField>

            <FormField label="Coupon Code" error={errors.code?.message} required>
              <input
                type="text"
                {...register('code')}
                placeholder="e.g. VOL15"
                className="w-full px-3.5 py-2 text-xs font-mono font-bold uppercase bg-background border border-border rounded-xl focus:bg-surface text-textPrimary"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField label="Discount Type" error={errors.type?.message} required>
              <select
                {...register('type')}
                className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:bg-surface text-textPrimary font-semibold cursor-pointer"
              >
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </FormField>

            <FormField
              label={typeVal === 'percent' ? 'Percentage Off (%)' : 'Amount Off ($)'}
              error={errors.value?.message}
              required
            >
              <input
                type="number"
                step="0.01"
                {...register('value', { valueAsNumber: true })}
                className="w-full px-3.5 py-2 text-xs font-mono bg-background border border-border rounded-xl focus:bg-surface text-textPrimary font-bold"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <FormField label="Min. Purchase ($)" error={errors.minPurchase?.message}>
              <input
                type="number"
                step="0.01"
                {...register('minPurchase', { valueAsNumber: true })}
                className="w-full px-3.5 py-2 text-xs font-mono bg-background border border-border rounded-xl focus:bg-surface text-textPrimary"
              />
            </FormField>

            <FormField label="Min. Seats / Qty" error={errors.minQuantity?.message}>
              <input
                type="number"
                min="1"
                {...register('minQuantity', { valueAsNumber: true })}
                className="w-full px-3.5 py-2 text-xs font-mono bg-background border border-border rounded-xl focus:bg-surface text-textPrimary"
              />
            </FormField>

            <FormField label="Usage Quota Limit" error={errors.usageLimit?.message} required>
              <input
                type="number"
                min="1"
                {...register('usageLimit', { valueAsNumber: true })}
                className="w-full px-3.5 py-2 text-xs font-mono bg-background border border-border rounded-xl focus:bg-surface text-textPrimary font-bold"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField label="Start Date" error={errors.startDate?.message} required>
              <input
                type="date"
                {...register('startDate')}
                className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:bg-surface text-textPrimary"
              />
            </FormField>

            <FormField label="End Date" error={errors.endDate?.message} required>
              <input
                type="date"
                {...register('endDate')}
                className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:bg-surface text-textPrimary"
              />
            </FormField>
          </div>

          <div className="pt-2 border-t border-border space-y-3">
            <FormField label="Applies To" error={errors.appliesTo?.message} required>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-textPrimary font-semibold cursor-pointer">
                  <input
                    type="radio"
                    value="subscription"
                    {...register('appliesTo')}
                    className="text-primary focus:ring-primary"
                  />
                  <span>Whole Subscription Subtotal</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-textPrimary font-semibold cursor-pointer">
                  <input
                    type="radio"
                    value="product"
                    {...register('appliesTo')}
                    className="text-primary focus:ring-primary"
                  />
                  <span>Specific Product Only</span>
                </label>
              </div>
            </FormField>

            {appliesToVal === 'product' && (
              <FormField label="Select Target Product" error={errors.targetProductId?.message} required>
                <select
                  {...register('targetProductId')}
                  className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:bg-surface text-textPrimary font-semibold cursor-pointer"
                >
                  <option value="">Select a product...</option>
                  {products.items.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </FormField>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-textSecondary hover:bg-background rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-[#15803d] disabled:bg-primary/50 rounded-xl shadow-sm cursor-pointer"
            >
              Save Discount
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
