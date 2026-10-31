import React, { useState } from 'react';
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
  name: z.string().min(2, 'Name is required'),
  code: z.string().min(2, 'Code is required').toUpperCase(),
  type: z.enum(['percent', 'fixed']),
  value: z.number().min(0, 'Value must be positive'),
  minSeats: z.number().int().min(1, 'Min seats must be at least 1'),
  usageLimit: z.number().int().min(1, 'Limit must be at least 1'),
  usedCount: z.number().int().default(0),
  appliesTo: z.enum(['total', 'product']).default('total'),
  targetProductId: z.string().optional(),
});

export default function DiscountFormModal({
  isOpen,
  discount,
  onClose,
  onSuccess,
}) {
  if (!isOpen) return null;

  const isEditing = Boolean(discount && discount.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: products = { items: [] } } = useQuery({
    queryKey: ['products-select'],
    queryFn: () => productsApi.getAll({ size: 100 }),
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      name: discount?.name || '',
      code: discount?.code || '',
      type: discount?.type || 'percent',
      value: discount ? Number(discount.value) : 10,
      minSeats: discount ? Number(discount.minSeats) : 1,
      usageLimit: discount ? Number(discount.usageLimit) : 100,
      usedCount: discount ? Number(discount.usedCount) : 0,
      appliesTo: discount?.appliesTo || 'total',
      targetProductId: discount?.targetProductId || '',
    },
  });

  const discountType = watch('type');
  const appliesToVal = watch('appliesTo');

  const onSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      const payload = {
        ...values,
        code: values.code.trim().toUpperCase(),
        targetProductName:
          values.appliesTo === 'product'
            ? products.items.find((p) => p.id === values.targetProductId)?.name || ''
            : '',
      };

      if (isEditing) {
        await discountsApi.update(discount.id, payload);
        toast.success(`Discount ${values.name} updated!`);
      } else {
        await discountsApi.create(payload);
        toast.success(`Discount ${values.name} created!`);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save discount');
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
              {isEditing ? `Edit Discount Rule: ${discount.name}` : 'New Discount Rule'}
            </h3>
            <p className="text-xs text-white/90 mt-0.5 font-medium">
              Define redemption codes, seat minimums, and usage quota thresholds.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField label="Discount Name" error={errors.name?.message} required>
              <input
                type="text"
                {...register('name')}
                placeholder="e.g. Enterprise Volume 15%"
                className="w-full px-3.5 py-2 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-textPrimary font-semibold"
              />
            </FormField>

            <FormField label="Coupon Code" error={errors.code?.message} required>
              <input
                type="text"
                {...register('code')}
                placeholder="e.g. VOL15"
                className="w-full px-3.5 py-2 text-xs font-mono uppercase bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-accent font-bold"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField label="Discount Type" error={errors.type?.message} required>
              <select
                {...register('type')}
                className="w-full px-3.5 py-2 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none text-textPrimary font-semibold cursor-pointer"
              >
                <option value="percent" className="bg-[#002222] text-[#f2f5e8]">Percentage (%) off total</option>
                <option value="fixed" className="bg-[#002222] text-[#f2f5e8]">Fixed Dollar ($) amount off</option>
              </select>
            </FormField>

            <FormField
              label={discountType === 'percent' ? 'Discount Value (%)' : 'Discount Value ($)'}
              error={errors.value?.message}
              required
            >
              <input
                type="number"
                step="0.01"
                {...register('value', { valueAsNumber: true })}
                className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none text-textPrimary"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField label="Minimum Seats Required" error={errors.minSeats?.message} required>
              <input
                type="number"
                min="1"
                {...register('minSeats', { valueAsNumber: true })}
                className="w-full px-3.5 py-2 text-xs font-mono bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none text-textPrimary"
              />
            </FormField>

            <FormField label="Total Usage Limit (Quota)" error={errors.usageLimit?.message} required>
              <input
                type="number"
                min="1"
                {...register('usageLimit', { valueAsNumber: true })}
                className="w-full px-3.5 py-2 text-xs font-mono bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none text-textPrimary"
              />
            </FormField>
          </div>

          <div className="pt-2">
            <FormField label="Applies To">
              <div className="flex items-center gap-4 text-xs font-medium text-textPrimary pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="total"
                    {...register('appliesTo')}
                    className="text-accent focus:ring-accent"
                  />
                  <span>Entire Order Total</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="product"
                    {...register('appliesTo')}
                    className="text-accent focus:ring-accent"
                  />
                  <span>Specific Product Only</span>
                </label>
              </div>
            </FormField>

            {appliesToVal === 'product' && (
              <FormField label="Select Target Product" error={errors.targetProductId?.message} required>
                <select
                  {...register('targetProductId')}
                  className="w-full px-3.5 py-2 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none text-textPrimary font-semibold cursor-pointer"
                >
                  <option value="" className="bg-[#002222] text-[#f2f5e8]">Select a product...</option>
                  {products.items.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#002222] text-[#f2f5e8]">
                      {p.name}
                    </option>
                  ))}
                </select>
              </FormField>
            )}
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
              className="px-5 py-2 text-xs font-bold text-[#0b1a1a] bg-accent hover:bg-accent-hover disabled:opacity-50 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Save Discount
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
