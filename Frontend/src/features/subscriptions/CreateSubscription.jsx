import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { subscriptionsApi } from '../../api/subscriptions';
import { templatesApi } from '../../api/templates';
import { productsApi } from '../../api/products';
import { plansApi } from '../../api/plans';
import { discountsApi } from '../../api/discounts';
import { getStoredData, STORAGE_KEYS } from '../../lib/storage';
import { ROUTES } from '../../constants/routes';
import PageHeader from '../../components/ui/PageHeader';
import FormField from '../../components/ui/FormField';
import MoneyText from '../../components/ui/MoneyText';
import { MascotBanner } from '../../components/mascot/MascotGuide';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Tag,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const subSchema = z.object({
  customerId: z.string().min(1, 'Please select a customer'),
  planId: z.string().min(1, 'Please select a billing plan'),
  startDate: z.string().min(1, 'Start date is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  paymentTerms: z.string().min(1, 'Payment terms are required'),
  discountCode: z.string().optional(),
  lines: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product required'),
        productName: z.string().optional(),
        variantId: z.string().optional().nullable(),
        variantName: z.string().optional(),
        quantity: z.number().min(1, 'Min 1 qty'),
        unitPrice: z.number().min(0),
        taxPercent: z.number().min(0),
        amount: z.number().min(0),
      })
    )
    .min(1, 'At least one line item is required'),
});

export default function CreateSubscription() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateIdParam = searchParams.get('templateId');

  const [selectedTemplateId, setSelectedTemplateId] = useState(templateIdParam || '');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reference queries
  const { data: templatesData = { items: [] } } = useQuery({
    queryKey: ['templates-options'],
    queryFn: () => templatesApi.getAll({ size: 100 }),
  });

  const { data: productsData = { items: [] } } = useQuery({
    queryKey: ['products-options'],
    queryFn: () => productsApi.getAll({ size: 100 }),
  });

  const { data: plansData = { items: [] } } = useQuery({
    queryKey: ['plans-options'],
    queryFn: () => plansApi.getAll({ size: 100 }),
  });

  const { data: discountsData = { items: [] } } = useQuery({
    queryKey: ['discounts-options'],
    queryFn: () => discountsApi.getAll({ size: 100 }),
  });

  const customers = getStoredData(STORAGE_KEYS.USERS).filter((u) => u.role === 'customer');

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(subSchema),
    defaultValues: {
      customerId: '',
      planId: '',
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentTerms: 'Net 30',
      discountCode: '',
      lines: [
        {
          productId: '',
          productName: '',
          variantId: '',
          variantName: '',
          quantity: 1,
          unitPrice: 0,
          taxPercent: 18,
          amount: 0,
        },
      ],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'lines',
  });

  const lines = watch('lines') || [];
  const discountCodeVal = watch('discountCode');

  // Load from template
  useEffect(() => {
    if (selectedTemplateId && templatesData.items.length > 0) {
      const template = templatesData.items.find((t) => t.id === selectedTemplateId);
      if (template) {
        setValue('planId', template.planId || '');
        const mappedLines = (template.lines || []).map((tl) => {
          const product = productsData.items.find((p) => p.id === tl.productId);
          const variant = product?.variants?.find((v) => v.id === tl.variantId);
          const unitPrice =
            tl.unitPrice ||
            (product ? Number(product.salesPrice) + Number(variant?.extraPrice || 0) : 0);
          const amount = unitPrice * (tl.quantity || 1);

          return {
            productId: tl.productId,
            productName: product?.name || 'Software Product',
            variantId: tl.variantId || '',
            variantName: variant?.value || 'Standard Edition',
            quantity: tl.quantity || 1,
            unitPrice,
            taxPercent: product?.taxPercent || 18,
            amount,
          };
        });

        if (mappedLines.length > 0) {
          replace(mappedLines);
        }
      }
    }
  }, [selectedTemplateId, templatesData.items, productsData.items, setValue, replace]);

  const handleProductChange = (idx, productId) => {
    setValue(`lines.${idx}.productId`, productId);
    const product = productsData.items.find((p) => p.id === productId);
    if (product) {
      setValue(`lines.${idx}.productName`, product.name);
      setValue(`lines.${idx}.taxPercent`, product.taxPercent || 18);

      const firstVariant = product.variants?.[0];
      const extra = firstVariant ? Number(firstVariant.extraPrice || 0) : 0;
      const unitPrice = Number(product.salesPrice) + extra;

      setValue(`lines.${idx}.variantId`, firstVariant ? firstVariant.id : '');
      setValue(`lines.${idx}.variantName`, firstVariant ? firstVariant.value : 'Standard');
      setValue(`lines.${idx}.unitPrice`, unitPrice);

      const currentQty = lines[idx]?.quantity || 1;
      setValue(`lines.${idx}.amount`, unitPrice * currentQty);
    }
  };

  const handleVariantChange = (idx, variantId) => {
    setValue(`lines.${idx}.variantId`, variantId);
    const productId = lines[idx]?.productId;
    const product = productsData.items.find((p) => p.id === productId);
    if (product) {
      const variant = product.variants?.find((v) => v.id === variantId);
      const extra = variant ? Number(variant.extraPrice || 0) : 0;
      const unitPrice = Number(product.salesPrice) + extra;

      setValue(`lines.${idx}.variantName`, variant ? variant.value : 'Standard');
      setValue(`lines.${idx}.unitPrice`, unitPrice);

      const currentQty = lines[idx]?.quantity || 1;
      setValue(`lines.${idx}.amount`, unitPrice * currentQty);
    }
  };

  const handleQuantityChange = (idx, qty) => {
    const numericQty = Math.max(1, Number(qty) || 1);
    setValue(`lines.${idx}.quantity`, numericQty);
    const unitPrice = Number(lines[idx]?.unitPrice || 0);
    setValue(`lines.${idx}.amount`, unitPrice * numericQty);
  };

  const subtotal = lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);

  const handleApplyDiscount = () => {
    setDiscountError('');
    if (!discountCodeVal || !discountCodeVal.trim()) {
      setAppliedDiscount(null);
      return;
    }
    const found = discountsData.items.find(
      (d) => d.code.toUpperCase() === discountCodeVal.trim().toUpperCase()
    );
    if (!found) {
      setDiscountError('Invalid promotion code');
      setAppliedDiscount(null);
      return;
    }
    if (found.usedCount >= found.usageLimit) {
      setDiscountError('This promo code has reached its maximum usage limit');
      setAppliedDiscount(null);
      return;
    }
    if (found.minPurchase && subtotal < found.minPurchase) {
      setDiscountError(`Requires a minimum subtotal of $${found.minPurchase}`);
      setAppliedDiscount(null);
      return;
    }
    setAppliedDiscount(found);
    toast.success(`Coupon code ${found.code} applied!`);
  };

  let discountAmount = 0;
  if (appliedDiscount) {
    if (appliedDiscount.type === 'percent') {
      discountAmount = parseFloat(((subtotal * appliedDiscount.value) / 100).toFixed(2));
    } else {
      discountAmount = parseFloat(appliedDiscount.value.toFixed(2));
    }
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const effectiveTaxPercent = lines[0]?.taxPercent || 18;
  const taxAmount = parseFloat(((taxableAmount * effectiveTaxPercent) / 100).toFixed(2));
  const finalTotal = parseFloat((taxableAmount + taxAmount).toFixed(2));

  const onSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      const customer = customers.find((c) => c.id === values.customerId);
      const plan = plansData.items.find((p) => p.id === values.planId);

      const payload = {
        ...values,
        customerName: customer?.companyName || customer?.name || 'Customer Account',
        customerEmail: customer?.email || '',
        planName: plan?.name || 'Subscription Plan',
        billingPeriod: plan?.billingPeriod || 'monthly',
        discountAmount,
        taxPercent: effectiveTaxPercent,
        taxAmount,
        subtotal,
        total: finalTotal,
      };

      const newSub = await subscriptionsApi.create(payload);
      toast.success(`Subscription proposal ${newSub.subscriptionNumber} created!`);
      navigate(`${ROUTES.SUBSCRIPTIONS}/${newSub.id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to create subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <PageHeader
        title="Create Subscription Proposal"
        subtitle="Configure recurring terms, product bundles, quotation template pre-fills, and discount rules."
        backButton={
          <Link
            to={ROUTES.SUBSCRIPTIONS}
            className="p-2 text-textSecondary hover:text-textPrimary hover:bg-surface rounded-xl transition-colors inline-block"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        }
      />

      {/* Mascot Guide Banner */}
      <MascotBanner
        title="Hop's Proposal Checklist"
        tip="Guided Setup"
        message="I'm by your side! Select a customer and billing plan below. You can apply promotion codes (like VOL15 or ODOOFIRST200) and I'll calculate discounts and taxes live for you!"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Template Quick Loader */}
        <div className="p-4 bg-[var(--surface)] backdrop-blur-md border border-[var(--border)] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] border border-[var(--border)] text-accent flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wide">
                Load from Quotation Template
              </h4>
              <p className="text-[11px] text-textSecondary">
                Instantly populate pre-packaged products, pricing, and recommended billing plans.
              </p>
            </div>
          </div>

          <div className="min-w-[220px]">
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-[var(--surface-strong)] border border-[var(--border)] rounded-xl text-textPrimary font-bold focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="">Start from Scratch...</option>
              {templatesData.items.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Primary Settings */}
        <div className="bg-[var(--surface)] backdrop-blur-md p-6 rounded-2xl border border-[var(--border)] shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-textPrimary uppercase tracking-wider mb-2">
            General Contract Agreement
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Customer Account" error={errors.customerId?.message} required>
              <select
                {...register('customerId')}
                className="w-full px-3.5 py-2 text-xs bg-[var(--surface-strong)] border border-[var(--border)] rounded-xl focus:border-accent text-textPrimary font-semibold cursor-pointer"
              >
                <option value="">Select customer account...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName || c.name} ({c.email})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Recurring Billing Plan" error={errors.planId?.message} required>
              <select
                {...register('planId')}
                className="w-full px-3.5 py-2 text-xs bg-[var(--surface-strong)] border border-[var(--border)] rounded-xl focus:border-accent text-textPrimary font-semibold cursor-pointer"
              >
                <option value="">Select a plan cadence...</option>
                {plansData.items.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${p.price} / {p.billingPeriod})
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Start Date" error={errors.startDate?.message} required>
              <input
                type="date"
                {...register('startDate')}
                className="w-full px-3.5 py-2 text-xs bg-[var(--surface-strong)] border border-[var(--border)] rounded-xl text-textPrimary font-medium focus:border-accent"
              />
            </FormField>

            <FormField label="Expiry Date" error={errors.expiryDate?.message} required>
              <input
                type="date"
                {...register('expiryDate')}
                className="w-full px-3.5 py-2 text-xs bg-[var(--surface-strong)] border border-[var(--border)] rounded-xl text-textPrimary font-medium focus:border-accent"
              />
            </FormField>

            <FormField label="Payment Terms" error={errors.paymentTerms?.message} required>
              <select
                {...register('paymentTerms')}
                className="w-full px-3.5 py-2 text-xs bg-[var(--surface-strong)] border border-[var(--border)] rounded-xl text-textPrimary font-semibold focus:border-accent cursor-pointer"
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 60">Net 60 Days</option>
              </select>
            </FormField>
          </div>
        </div>

        {/* Subscription Lines Table */}
        <div className="bg-[var(--surface)] backdrop-blur-md rounded-2xl border border-[var(--border)] shadow-xs overflow-hidden">
          <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-textPrimary uppercase tracking-wider">
                Product & Variant Lines
              </h3>
              <p className="text-[11px] text-textSecondary">
                Add products and customize attributes with live unit price computation.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                append({
                  productId: '',
                  productName: '',
                  variantId: '',
                  variantName: '',
                  quantity: 1,
                  unitPrice: 0,
                  taxPercent: 18,
                  amount: 0,
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0b1a1a] bg-accent hover:bg-accent-hover rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product Row</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-textPrimary">
              <thead className="bg-[var(--surface-strong)] text-textSecondary font-bold uppercase tracking-wider border-b border-[var(--border)]">
                <tr>
                  <th className="px-5 py-3 w-1/3">Product</th>
                  <th className="px-5 py-3 w-1/4">Variant</th>
                  <th className="px-5 py-3 w-20">Qty</th>
                  <th className="px-5 py-3">Unit Price</th>
                  <th className="px-5 py-3">Line Total</th>
                  <th className="px-5 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/60">
                {fields.map((field, idx) => {
                  const currentLine = lines[idx];
                  const selectedProduct = productsData.items.find(
                    (p) => p.id === currentLine?.productId
                  );

                  return (
                    <tr key={field.id} className="hover:bg-[var(--accent-soft)]/20">
                      <td className="px-5 py-3">
                        <select
                          value={currentLine?.productId || ''}
                          onChange={(e) => handleProductChange(idx, e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-[var(--surface-strong)] border border-[var(--border)] rounded-lg text-textPrimary font-semibold focus:border-accent cursor-pointer"
                        >
                          <option value="">Select product...</option>
                          {productsData.items.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (${p.salesPrice})
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-5 py-3">
                        <select
                          value={currentLine?.variantId || ''}
                          onChange={(e) => handleVariantChange(idx, e.target.value)}
                          disabled={!selectedProduct || !selectedProduct.variants?.length}
                          className="w-full px-2.5 py-1.5 text-xs bg-[var(--surface-strong)] border border-[var(--border)] rounded-lg text-textPrimary disabled:opacity-50 font-medium focus:border-accent cursor-pointer"
                        >
                          {selectedProduct?.variants?.length ? (
                            selectedProduct.variants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.value} (+${v.extraPrice})
                              </option>
                            ))
                          ) : (
                            <option value="">Standard (No variant)</option>
                          )}
                        </select>
                      </td>

                      <td className="px-5 py-3">
                        <input
                          type="number"
                          min="1"
                          value={currentLine?.quantity || 1}
                          onChange={(e) => handleQuantityChange(idx, e.target.value)}
                          className="w-16 px-2 py-1.5 text-xs font-mono bg-[var(--surface-strong)] border border-[var(--border)] rounded-lg text-textPrimary focus:border-accent"
                        />
                      </td>

                      <td className="px-5 py-3 font-mono font-semibold text-textPrimary">
                        <MoneyText amount={currentLine?.unitPrice || 0} />
                      </td>

                      <td className="px-5 py-3 font-mono font-bold text-textPrimary">
                        <MoneyText amount={currentLine?.amount || 0} />
                      </td>

                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => remove(idx)}
                          disabled={fields.length === 1}
                          className="p-1 text-textSecondary hover:text-danger disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Financial Totals & Discounts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Discount Code Box */}
          <div className="bg-[var(--surface)] backdrop-blur-md p-5 rounded-2xl border border-[var(--border)] shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-accent" />
              Promotion or Volume Discount
            </h4>

            <div className="flex gap-2">
              <input
                type="text"
                {...register('discountCode')}
                placeholder="Enter promo code (VOL15, ODOOFIRST200)"
                className="flex-1 px-3.5 py-2 text-xs font-mono font-bold uppercase bg-[var(--surface-strong)] border border-[var(--border)] rounded-xl focus:border-accent text-textPrimary"
              />
              <button
                type="button"
                onClick={handleApplyDiscount}
                className="px-4 py-2 text-xs font-bold text-[#0b1a1a] bg-accent hover:bg-accent-hover rounded-xl transition-colors cursor-pointer"
              >
                Apply Code
              </button>
            </div>

            {discountError && (
              <p className="text-xs text-danger flex items-center gap-1 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{discountError}</span>
              </p>
            )}

            {appliedDiscount && (
              <div className="p-3 bg-[var(--accent-soft)] border border-[var(--border)] rounded-xl text-xs text-accent flex items-center justify-between">
                <div>
                  <span className="font-bold">{appliedDiscount.name}</span>
                  <span className="ml-1 text-[11px] text-textSecondary font-mono">
                    ({appliedDiscount.code})
                  </span>
                </div>
                <span className="font-bold font-mono">
                  -{appliedDiscount.type === 'percent' ? `${appliedDiscount.value}%` : `$${appliedDiscount.value}`}
                </span>
              </div>
            )}
          </div>

          {/* Live Calculated Totals Card */}
          <div className="bg-[var(--surface-strong)] backdrop-blur-xl text-textPrimary p-6 rounded-3xl shadow-2xl space-y-3 border border-[var(--border)]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-accent mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              <span>Subscription Live Totals</span>
            </h4>

            <div className="flex justify-between text-xs text-textSecondary">
              <span>Lines Subtotal</span>
              <MoneyText amount={subtotal} className="text-textPrimary font-semibold" />
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-xs text-accent font-semibold">
                <span>Discount Applied</span>
                <span>-<MoneyText amount={discountAmount} /></span>
              </div>
            )}

            <div className="flex justify-between text-xs text-textSecondary">
              <span>Estimated Taxes ({effectiveTaxPercent}%)</span>
              <MoneyText amount={taxAmount} className="text-textPrimary font-semibold" />
            </div>

            <div className="pt-3 border-t border-[var(--border)] flex justify-between items-baseline">
              <span className="text-sm font-bold text-textPrimary">Recurring Total Due</span>
              <MoneyText amount={finalTotal} className="text-2xl font-black text-accent" />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-50 text-[#0b1a1a] font-bold text-xs shadow-lg shadow-accent/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-[#0b1a1a] border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Generate Subscription Proposal</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
