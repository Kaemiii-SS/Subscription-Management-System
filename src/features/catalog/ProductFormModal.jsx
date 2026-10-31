import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { productsApi } from '../../api/products';
import { taxesApi } from '../../api/taxes';
import { useQuery } from '@tanstack/react-query';
import FormField from '../../components/ui/FormField';
import MoneyText from '../../components/ui/MoneyText';
import { X, Plus, Trash2, Tag, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  type: z.string().min(1, 'Type is required'),
  salesPrice: z.number({ invalid_type_error: 'Sales price must be a number' }).min(0),
  costPrice: z.number({ invalid_type_error: 'Cost price must be a number' }).min(0),
  taxPercent: z.number().min(0).max(100),
  notes: z.string().optional(),
  variants: z.array(
    z.object({
      id: z.string().optional(),
      attribute: z.string().min(1, 'Attribute is required (e.g. Brand)'),
      value: z.string().min(1, 'Value is required (e.g. Odoo Edition)'),
      extraPrice: z.number({ invalid_type_error: 'Must be number' }).min(0),
    })
  ),
});

export default function ProductFormModal({ isOpen, product, onClose, onSuccess }) {
  if (!isOpen) return null;

  const isEditing = Boolean(product?.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: taxes = [] } = useQuery({
    queryKey: ['taxes-options'],
    queryFn: () => taxesApi.getAll(),
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      type: 'Software / SaaS',
      salesPrice: 1000,
      costPrice: 300,
      taxPercent: 18,
      notes: '',
      variants: [{ id: 'var-new-1', attribute: 'Brand', value: 'Odoo Edition', extraPrice: 560 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        type: product.type || 'Software / SaaS',
        salesPrice: Number(product.salesPrice) || 0,
        costPrice: Number(product.costPrice) || 0,
        taxPercent: Number(product.taxPercent) || 18,
        notes: product.notes || '',
        variants: product.variants || [],
      });
    } else {
      reset({
        name: '',
        type: 'Software / SaaS',
        salesPrice: 1000,
        costPrice: 300,
        taxPercent: 18,
        notes: '',
        variants: [{ id: 'var-1', attribute: 'Brand', value: 'Odoo Edition', extraPrice: 560 }],
      });
    }
  }, [product, reset]);

  const baseSalesPrice = watch('salesPrice') || 0;
  const currentVariants = watch('variants') || [];

  const onSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      if (isEditing) {
        await productsApi.update(product.id, values);
        toast.success(`Product "${values.name}" updated successfully!`);
      } else {
        await productsApi.create(values);
        toast.success(`Product "${values.name}" created successfully!`);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-2xl bg-surface rounded-3xl shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col text-textPrimary"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-background border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-textPrimary">
              {isEditing ? `Edit Product: ${product.name}` : 'New Catalog Product'}
            </h3>
            <p className="text-xs text-textSecondary">
              Configure base pricing, taxes, and dynamic attribute variants (e.g. Odoo brand).
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-textSecondary hover:text-textPrimary p-1.5 rounded-xl hover:bg-surface cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Product Name" error={errors.name?.message} required>
              <input
                type="text"
                {...register('name')}
                placeholder="e.g. Brightloop Cloud ERP"
                className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-textPrimary font-semibold"
              />
            </FormField>

            <FormField label="Product Type" error={errors.type?.message} required>
              <select
                {...register('type')}
                className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-textPrimary font-semibold cursor-pointer"
              >
                <option value="Software / SaaS">Software / SaaS</option>
                <option value="Service">Service / Support</option>
                <option value="Add-on Module">Add-on Module</option>
                <option value="Infrastructure">Infrastructure</option>
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Base Sales Price" error={errors.salesPrice?.message} required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('salesPrice', { valueAsNumber: true })}
                  className="w-full pl-7 pr-3 py-2 text-xs bg-background border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-textPrimary font-mono font-bold"
                />
              </div>
            </FormField>

            <FormField label="Cost Price" error={errors.costPrice?.message} required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('costPrice', { valueAsNumber: true })}
                  className="w-full pl-7 pr-3 py-2 text-xs bg-background border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-textPrimary font-mono font-bold"
                />
              </div>
            </FormField>

            <FormField label="Applicable Tax" error={errors.taxPercent?.message} required>
              <select
                {...register('taxPercent', { valueAsNumber: true })}
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-textPrimary font-semibold cursor-pointer"
              >
                {taxes.map((t) => (
                  <option key={t.id} value={t.percent}>
                    {t.name} ({t.percent}%)
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Notes / Description" error={errors.notes?.message}>
            <textarea
              rows={2}
              {...register('notes')}
              placeholder="Internal product specs or customer facing description..."
              className="w-full p-3 text-xs bg-background border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-textPrimary"
            />
          </FormField>

          {/* Variants Section with Live Price Preview */}
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-primary" />
                  Product Variants & Price Add-ons
                </h4>
                <p className="text-[11px] text-textSecondary">
                  Example: Brand = Odoo Edition (+560 extra price). Final price is updated live.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  append({
                    id: `var-${Date.now()}`,
                    attribute: 'Brand',
                    value: 'Custom Variant',
                    extraPrice: 0,
                  })
                }
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-primary bg-sage hover:bg-mint/40 border border-mint rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Add Variant Row
              </button>
            </div>

            <div className="space-y-2.5">
              {fields.map((field, idx) => {
                const extra = Number(currentVariants[idx]?.extraPrice || 0);
                const finalLivePrice = Number(baseSalesPrice) + extra;

                return (
                  <div
                    key={field.id}
                    className="p-3 bg-background rounded-2xl border border-border flex flex-wrap items-center gap-3"
                  >
                    <div className="w-32">
                      <label className="text-[10px] font-bold text-textSecondary uppercase">
                        Attribute
                      </label>
                      <input
                        type="text"
                        {...register(`variants.${idx}.attribute`)}
                        placeholder="e.g. Brand"
                        className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-lg text-textPrimary font-semibold"
                      />
                    </div>

                    <div className="flex-1 min-w-[140px]">
                      <label className="text-[10px] font-bold text-textSecondary uppercase">
                        Value
                      </label>
                      <input
                        type="text"
                        {...register(`variants.${idx}.value`)}
                        placeholder="e.g. Odoo Edition"
                        className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-lg text-textPrimary font-semibold"
                      />
                    </div>

                    <div className="w-28">
                      <label className="text-[10px] font-bold text-textSecondary uppercase">
                        Extra Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`variants.${idx}.extraPrice`, { valueAsNumber: true })}
                        className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-lg text-textPrimary font-mono font-bold"
                      />
                    </div>

                    {/* Live Calculated Price Indicator */}
                    <div className="w-36 bg-sage/60 border border-mint rounded-xl px-2.5 py-1.5 text-right">
                      <span className="text-[10px] text-primary block font-bold">Final Live Price:</span>
                      <MoneyText amount={finalLivePrice} className="text-xs font-black text-[#14532d]" />
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="p-1.5 text-textSecondary hover:text-coral rounded-lg transition-colors mt-3 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

              {fields.length === 0 && (
                <div className="text-center py-4 bg-background rounded-xl text-xs text-textSecondary border border-dashed border-border">
                  No variants added. This product will be sold at standard base price.
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
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
              <span>{isEditing ? 'Save Changes' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
