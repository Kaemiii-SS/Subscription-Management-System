import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { templatesApi } from '../../api/templates';
import { productsApi } from '../../api/products';
import { plansApi } from '../../api/plans';
import { useQuery } from '@tanstack/react-query';
import FormField from '../../components/ui/FormField';
import MoneyText from '../../components/ui/MoneyText';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const lineSchema = z.object({
  productId: z.string().min(1, 'Please select a product'),
  productName: z.string().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().default(0),
});

const templateSchema = z.object({
  name: z.string().min(2, 'Template name is required'),
  planId: z.string().min(1, 'Default plan is required'),
  validityDays: z.number().int().min(1, 'Validity days must be at least 1'),
  lines: z.array(lineSchema).min(1, 'Add at least one product line to this template'),
  termsAndConditions: z.string().optional(),
});

export default function TemplateFormModal({
  isOpen,
  template,
  onClose,
  onSuccess,
}) {
  if (!isOpen) return null;

  const isEditing = Boolean(template && template.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: productsData = { items: [] } } = useQuery({
    queryKey: ['products-select'],
    queryFn: () => productsApi.getAll({ size: 100 }),
  });

  const { data: plansData = { items: [] } } = useQuery({
    queryKey: ['plans-select'],
    queryFn: () => plansApi.getAll({ size: 100 }),
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name || '',
      planId: template?.planId || (plansData.items[0]?.id || ''),
      validityDays: template?.validityDays || 30,
      lines: template?.lines || [
        {
          productId: productsData.items[0]?.id || '',
          productName: productsData.items[0]?.name || '',
          quantity: 1,
          unitPrice: Number(productsData.items[0]?.salesPrice || 49),
        },
      ],
      termsAndConditions:
        template?.termsAndConditions ||
        'Standard Brightloop Service Agreement. Net 30 payment terms.',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  const handleProductChange = (index, prodId) => {
    const prod = productsData.items.find((p) => p.id === prodId);
    if (prod) {
      setValue(`lines.${index}.productId`, prod.id);
      setValue(`lines.${index}.productName`, prod.name);
      setValue(`lines.${index}.unitPrice`, Number(prod.salesPrice));
    }
  };

  const onSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      const selectedPlan = plansData.items.find((p) => p.id === values.planId);
      const payload = {
        ...values,
        planName: selectedPlan?.name || '',
        billingPeriod: selectedPlan?.billingPeriod || 'monthly',
      };

      if (isEditing) {
        await templatesApi.update(template.id, payload);
        toast.success(`Template ${values.name} updated!`);
      } else {
        await templatesApi.create(payload);
        toast.success(`Template ${values.name} created!`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-2xl bg-[var(--surface-strong)] backdrop-blur-xl rounded-3xl shadow-2xl border border-[var(--border)] overflow-hidden max-h-[90vh] flex flex-col text-textPrimary"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-[var(--surface-strong)] border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white">
              {isEditing ? `Edit Template: ${template.name}` : 'New Quotation Template'}
            </h3>
            <p className="text-xs text-white/90 mt-0.5 font-medium">
              Pre-configure subscription plans and default line packages for rapid sales quotes.
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
            <FormField label="Template Title" error={errors.name?.message} required>
              <input
                type="text"
                {...register('name')}
                placeholder="e.g. Standard SMB Odoo Setup"
                className="w-full px-3.5 py-2 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-textPrimary font-semibold"
              />
            </FormField>

            <FormField label="Validity (Days)" error={errors.validityDays?.message} required>
              <input
                type="number"
                min="1"
                {...register('validityDays', { valueAsNumber: true })}
                className="w-full px-3.5 py-2 text-xs font-mono bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none text-textPrimary"
              />
            </FormField>
          </div>

          <FormField label="Default Billing Plan" error={errors.planId?.message} required>
            <select
              {...register('planId')}
              className="w-full px-3.5 py-2 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none text-textPrimary font-semibold cursor-pointer"
            >
              <option value="" className="bg-[#002222] text-[#f2f5e8]">Select a plan cadence...</option>
              {plansData.items.map((plan) => (
                <option key={plan.id} value={plan.id} className="bg-[#002222] text-[#f2f5e8]">
                  {plan.name} (${plan.price} / {plan.billingPeriod})
                </option>
              ))}
            </select>
          </FormField>

          {/* Lines */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-textPrimary uppercase tracking-wider block">
                Pre-configured Line Items
              </span>
              <button
                type="button"
                onClick={() =>
                  append({
                    productId: productsData.items[0]?.id || '',
                    productName: productsData.items[0]?.name || '',
                    quantity: 1,
                    unitPrice: Number(productsData.items[0]?.salesPrice || 29),
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-accent bg-[var(--accent-soft)] hover:bg-accent hover:text-[#0b1a1a] border border-[var(--border)] rounded-xl transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>

            {errors.lines?.message && (
              <p className="text-xs text-danger mb-2 font-medium">{errors.lines?.message}</p>
            )}

            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  className="p-3 bg-[var(--surface)] rounded-2xl border border-[var(--border)] flex flex-wrap items-center gap-3"
                >
                  <div className="flex-1 min-w-[200px]">
                    <select
                      {...register(`lines.${idx}.productId`)}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-[var(--surface-strong)] border border-[var(--border)] rounded-xl text-textPrimary font-semibold cursor-pointer"
                    >
                      {productsData.items.map((prod) => (
                        <option key={prod.id} value={prod.id} className="bg-[#002222] text-[#f2f5e8]">
                          {prod.name} (${prod.salesPrice})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      {...register(`lines.${idx}.quantity`, { valueAsNumber: true })}
                      placeholder="Qty"
                      className="w-full px-2 py-1.5 text-xs font-mono bg-[var(--surface-strong)] border border-[var(--border)] rounded-xl text-textPrimary"
                    />
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      step="0.01"
                      {...register(`lines.${idx}.unitPrice`, { valueAsNumber: true })}
                      placeholder="Unit Price"
                      className="w-full px-2 py-1.5 text-xs font-mono font-bold bg-[var(--surface-strong)] border border-[var(--border)] rounded-xl text-textPrimary"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="p-1.5 text-textSecondary hover:text-danger rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
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
              className="px-5 py-2 text-xs font-bold text-[#0b1a1a] bg-accent hover:bg-accent-hover disabled:opacity-50 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Save Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
