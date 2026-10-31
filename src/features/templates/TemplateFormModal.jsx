import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { templatesApi } from '../../api/templates';
import { productsApi } from '../../api/products';
import { plansApi } from '../../api/plans';
import { useQuery } from '@tanstack/react-query';
import FormField from '../../components/ui/FormField';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const templateSchema = z.object({
  name: z.string().min(2, 'Template name is required'),
  validityDays: z.number({ invalid_type_error: 'Validity days must be a number' }).min(1),
  planId: z.string().min(1, 'Please select a billing plan'),
  notes: z.string().optional(),
  lines: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product required'),
        variantId: z.string().optional().nullable(),
        quantity: z.number().min(1),
        unitPrice: z.number().min(0),
      })
    )
    .min(1, 'At least one product line is required'),
});

export default function TemplateFormModal({ isOpen, template, onClose, onSuccess }) {
  if (!isOpen) return null;

  const isEditing = Boolean(template?.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: productsData = { items: [] } } = useQuery({
    queryKey: ['products-for-template'],
    queryFn: () => productsApi.getAll({ size: 100 }),
  });

  const { data: plansData = { items: [] } } = useQuery({
    queryKey: ['plans-for-template'],
    queryFn: () => plansApi.getAll({ size: 100 }),
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      validityDays: 15,
      planId: '',
      notes: '',
      lines: [{ productId: '', variantId: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  useEffect(() => {
    if (template) {
      reset({
        name: template.name,
        validityDays: Number(template.validityDays) || 15,
        planId: template.planId || '',
        notes: template.notes || '',
        lines: template.lines || [{ productId: '', variantId: '', quantity: 1, unitPrice: 0 }],
      });
    }
  }, [template, reset]);

  const handleProductSelect = (idx, productId) => {
    setValue(`lines.${idx}.productId`, productId);
    const prod = productsData.items.find((p) => p.id === productId);
    if (prod) {
      setValue(`lines.${idx}.unitPrice`, prod.salesPrice || 0);
      setValue(`lines.${idx}.variantId`, prod.variants?.[0]?.id || '');
    }
  };

  const onSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      if (isEditing) {
        await templatesApi.update(template.id, values);
        toast.success(`Template "${values.name}" updated!`);
      } else {
        await templatesApi.create(values);
        toast.success(`Template "${values.name}" created!`);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save template');
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
        <div className="px-6 py-4 bg-background border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-textPrimary">
              {isEditing ? `Edit Template: ${template.name}` : 'New Quotation Template'}
            </h3>
            <p className="text-xs text-textSecondary">
              Pre-configure subscription plans and default line packages for rapid sales quotes.
            </p>
          </div>
          <button onClick={onClose} className="text-textSecondary hover:text-textPrimary p-1.5 rounded-xl cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField label="Template Title" error={errors.name?.message} required>
              <input
                type="text"
                {...register('name')}
                placeholder="e.g. Standard SMB Odoo Setup"
                className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:bg-surface text-textPrimary font-semibold"
              />
            </FormField>

            <FormField label="Validity (Days)" error={errors.validityDays?.message} required>
              <input
                type="number"
                min="1"
                {...register('validityDays', { valueAsNumber: true })}
                className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-background border border-border rounded-xl text-textPrimary"
              />
            </FormField>
          </div>

          <FormField label="Default Billing Plan" error={errors.planId?.message} required>
            <select
              {...register('planId')}
              className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:bg-surface text-textPrimary font-semibold cursor-pointer"
            >
              <option value="">Select a billing plan...</option>
              {plansData.items.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} (${plan.price} / {plan.billingPeriod})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Notes / Proposal Terms" error={errors.notes?.message}>
            <textarea
              rows={2}
              {...register('notes')}
              placeholder="Commercial stipulations or service level agreements..."
              className="w-full p-3 text-xs bg-background border border-border rounded-xl focus:bg-surface text-textPrimary"
            />
          </FormField>

          {/* Product Line Items */}
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider">
                  Template Product Lines
                </h4>
                <p className="text-[11px] text-textSecondary">
                  Predefined modules with quantities and negotiated base rates.
                </p>
              </div>

              <button
                type="button"
                onClick={() => append({ productId: '', variantId: '', quantity: 1, unitPrice: 0 })}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-primary bg-sage hover:bg-mint/40 border border-mint rounded-xl cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Add Product Line
              </button>
            </div>

            <div className="space-y-2.5">
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  className="p-3 bg-background rounded-2xl border border-border flex flex-wrap items-center gap-2.5"
                >
                  <div className="flex-1 min-w-[180px]">
                    <label className="text-[10px] font-bold text-textSecondary uppercase">
                      Product
                    </label>
                    <select
                      {...register(`lines.${idx}.productId`)}
                      onChange={(e) => handleProductSelect(idx, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-lg text-textPrimary font-semibold cursor-pointer"
                    >
                      <option value="">Select product...</option>
                      {productsData.items.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (${p.salesPrice})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <label className="text-[10px] font-bold text-textSecondary uppercase">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      {...register(`lines.${idx}.quantity`, { valueAsNumber: true })}
                      className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-lg font-mono font-bold text-textPrimary"
                    />
                  </div>

                  <div className="w-28">
                    <label className="text-[10px] font-bold text-textSecondary uppercase">
                      Unit Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`lines.${idx}.unitPrice`, { valueAsNumber: true })}
                      className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-lg font-mono font-bold text-textPrimary"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="p-1.5 text-textSecondary hover:text-coral rounded-lg mt-3 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
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
              Save Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
