import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { productsApi } from '../../api/products';
import FormField from '../../components/ui/FormField';
import MoneyText from '../../components/ui/MoneyText';
import { X, Plus, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';

const variantSchema = z.object({
  id: z.string().optional(),
  attribute: z.string().min(1, 'Attribute is required (e.g. Brand)'),
  value: z.string().min(1, 'Value is required (e.g. Odoo Edition)'),
  extraPrice: z.number().default(0),
});

const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  type: z.string().default('software'),
  salesPrice: z.number().min(0, 'Price cannot be negative'),
  costPrice: z.number().min(0, 'Cost price cannot be negative'),
  taxPercent: z.number().min(0).max(100).default(18),
  description: z.string().optional(),
  variants: z.array(variantSchema).default([]),
});

export default function ProductFormModal({
  isOpen,
  product,
  onClose,
  onSuccess,
}) {
  if (!isOpen) return null;

  const isEditing = Boolean(product && product.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      type: product?.type || 'software',
      salesPrice: product ? Number(product.salesPrice) : 49.0,
      costPrice: product ? Number(product.costPrice || 0) : 10.0,
      taxPercent: product ? Number(product.taxPercent || 18) : 18,
      description: product?.description || '',
      variants: product?.variants || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  const baseSalesPrice = watch('salesPrice', 49.0);
  const currentVariants = watch('variants');

  const onSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      const payload = {
        ...values,
        variants: values.variants.map((v, i) => ({
          ...v,
          id: v.id || `var-${Date.now()}-${i}`,
          extraPrice: Number(v.extraPrice) || 0,
        })),
      };

      if (isEditing) {
        await productsApi.update(product.id, payload);
        toast.success(`Product ${values.name} updated!`);
      } else {
        await productsApi.create(payload);
        toast.success(`Product ${values.name} added to catalog!`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-2xl bg-[var(--surface-strong)] backdrop-blur-xl rounded-3xl shadow-2xl border border-[var(--border)] overflow-hidden max-h-[90vh] flex flex-col text-textPrimary"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[var(--surface-strong)] border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white">
              {isEditing ? `Edit Product: ${product.name}` : 'New Catalog Product'}
            </h3>
            <p className="text-xs text-white/90 mt-0.5 font-medium">
              Configure base pricing, taxes, and dynamic attribute variants (e.g. Odoo brand).
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
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
                className="w-full px-3.5 py-2.5 text-xs bg-[var(--surface-strong)] border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-white font-semibold placeholder-white/40"
              />
            </FormField>

            <FormField label="Product Type" error={errors.type?.message} required>
              <select
                {...register('type')}
                className="w-full px-3.5 py-2.5 text-xs bg-[var(--surface-strong)] border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-white font-semibold cursor-pointer"
              >
                <option value="software" className="bg-[#002222] text-white">Recurring Software Module</option>
                <option value="service" className="bg-[#002222] text-white">Professional Service / Support</option>
                <option value="addon" className="bg-[#002222] text-white">User Seat / Compute Add-on</option>
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <FormField label="Sales Price ($)" error={errors.salesPrice?.message} required>
              <input
                type="number"
                step="0.01"
                {...register('salesPrice', { valueAsNumber: true })}
                className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-[var(--surface-strong)] border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-white"
              />
            </FormField>

            <FormField label="Internal Cost ($)" error={errors.costPrice?.message}>
              <input
                type="number"
                step="0.01"
                {...register('costPrice', { valueAsNumber: true })}
                className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-[var(--surface-strong)] border border-white/20 rounded-xl focus:outline-none text-white"
              />
            </FormField>

            <FormField label="Sales Tax (%)" error={errors.taxPercent?.message} required>
              <input
                type="number"
                step="0.1"
                {...register('taxPercent', { valueAsNumber: true })}
                className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-[var(--surface-strong)] border border-white/20 rounded-xl focus:outline-none text-white"
              />
            </FormField>
          </div>

          <FormField label="Description">
            <textarea
              rows={2}
              {...register('description')}
              placeholder="Module features, SLA guarantees, or variant notes..."
              className="w-full p-3 text-xs bg-[var(--surface-strong)] border border-white/20 rounded-xl focus:outline-none text-white font-medium placeholder-white/40"
            />
          </FormField>

          {/* Dynamic Variant Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Product Variants &amp; Upgrades
                </span>
                <span className="text-xs text-white/90 font-medium">
                  Add custom attributes (e.g. Attribute="Brand", Value="Odoo Edition", Extra Price=+$560.00).
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  append({
                    attribute: 'Edition',
                    value: 'Pro License',
                    extraPrice: 15.0,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0b1a1a] bg-accent hover:bg-accent-hover rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Variant</span>
              </button>
            </div>

            <div className="space-y-2 mt-3">
              {fields.map((field, idx) => {
                const extra = Number(currentVariants[idx]?.extraPrice || 0);
                const finalLivePrice = Number(baseSalesPrice) + extra;

                return (
                  <div
                    key={field.id}
                    className="p-3.5 bg-[var(--surface-strong)] rounded-2xl border border-white/20 flex flex-wrap items-center gap-3"
                  >
                    <div className="w-32">
                      <label className="text-[10px] font-bold text-white uppercase tracking-wider block mb-1">
                        Attribute
                      </label>
                      <input
                        type="text"
                        {...register(`variants.${idx}.attribute`)}
                        placeholder="e.g. Brand"
                        className="w-full px-2.5 py-1.5 text-xs bg-[var(--surface)] border border-white/20 rounded-lg text-white font-semibold"
                      />
                    </div>

                    <div className="flex-1 min-w-[140px]">
                      <label className="text-[10px] font-bold text-white uppercase tracking-wider block mb-1">
                        Value
                      </label>
                      <input
                        type="text"
                        {...register(`variants.${idx}.value`)}
                        placeholder="e.g. Odoo Edition"
                        className="w-full px-2.5 py-1.5 text-xs bg-[var(--surface)] border border-white/20 rounded-lg text-white font-semibold"
                      />
                    </div>

                    <div className="w-28">
                      <label className="text-[10px] font-bold text-white uppercase tracking-wider block mb-1">
                        Extra Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`variants.${idx}.extraPrice`, { valueAsNumber: true })}
                        className="w-full px-2.5 py-1.5 text-xs bg-[var(--surface)] border border-white/20 rounded-lg text-white font-mono font-bold"
                      />
                    </div>

                    {/* Live Calculated Price Indicator */}
                    <div className="w-36 bg-accent/20 border border-accent/40 rounded-xl px-2.5 py-1.5 text-right">
                      <span className="text-[10px] text-white block font-bold uppercase tracking-wider">Final Live Price:</span>
                      <MoneyText amount={finalLivePrice} className="text-xs font-black text-[#4ade80]" />
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="p-1.5 text-white/70 hover:text-danger rounded-lg transition-colors mt-3 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

              {fields.length === 0 && (
                <div className="text-center py-4 bg-[var(--surface-strong)] rounded-xl text-xs text-white/80 border border-dashed border-white/20">
                  No variants added. This product will be sold at standard base price.
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
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
              <span>{isEditing ? 'Save Changes' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
