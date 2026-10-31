import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi } from '../../api/subscriptions';
import { invoicesApi } from '../../api/invoices';
import { plansApi } from '../../api/plans';
import { ROUTES } from '../../constants/routes';
import { SUBSCRIPTION_STATUS } from '../../constants/status';
import { formatDate } from '../../lib/utils';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import MoneyText from '../../components/ui/MoneyText';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import RecordPaymentModal from '../payments/RecordPaymentModal';
import { MascotBanner } from '../../components/mascot/MascotGuide';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Play,
  Pause,
  XCircle,
  Repeat,
  Send,
  FileText,
  CreditCard,
  History,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SubscriptionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('lines');

  const [confirmAction, setConfirmAction] = useState(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);

  const { data: sub, isLoading, error } = useQuery({
    queryKey: ['subscription-detail', id],
    queryFn: () => subscriptionsApi.getById(id),
  });

  const { data: plan } = useQuery({
    queryKey: ['plan-for-sub', sub?.planId],
    queryFn: () => plansApi.getById(sub.planId),
    enabled: Boolean(sub?.planId),
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['sub-invoices', sub?.subscriptionNumber],
    queryFn: () => invoicesApi.getAll({ search: sub?.subscriptionNumber, size: 50 }),
    enabled: Boolean(sub?.subscriptionNumber),
  });

  const statusMutation = useMutation({
    mutationFn: ({ newStatus, reason }) =>
      subscriptionsApi.updateStatus(sub.id, newStatus, reason),
    onSuccess: (updatedSub) => {
      toast.success(`Subscription transitioned to ${updatedSub.status}`);
      queryClient.invalidateQueries({ queryKey: ['subscription-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['sub-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setConfirmAction(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Status transition failed');
      setConfirmAction(null);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse max-w-5xl mx-auto">
        <div className="h-8 bg-background rounded-lg w-1/3"></div>
        <div className="h-40 bg-surface rounded-2xl border border-border"></div>
        <div className="h-64 bg-surface rounded-2xl border border-border"></div>
      </div>
    );
  }

  if (error || !sub) {
    return (
      <div className="text-center py-16 bg-[var(--surface-strong)] backdrop-blur-xl rounded-2xl border border-[var(--border)] max-w-md mx-auto">
        <XCircle className="w-12 h-12 text-danger mx-auto mb-3" />
        <h3 className="text-base font-bold text-textPrimary mb-1">Subscription Not Found</h3>
        <p className="text-xs text-textSecondary mb-6">{error?.message || 'Could not load details'}</p>
        <Link
          to={ROUTES.SUBSCRIPTIONS}
          className="px-4 py-2 text-xs font-bold text-[#0b1a1a] bg-accent hover:bg-accent-hover rounded-xl inline-block"
        >
          Return to list
        </Link>
      </div>
    );
  }

  const stepperStages = [
    SUBSCRIPTION_STATUS.DRAFT,
    SUBSCRIPTION_STATUS.QUOTATION,
    SUBSCRIPTION_STATUS.CONFIRMED,
    SUBSCRIPTION_STATUS.ACTIVE,
    SUBSCRIPTION_STATUS.CLOSED,
  ];

  const currentStageIndex = stepperStages.indexOf(sub.status);
  const isPaused = sub.status === SUBSCRIPTION_STATUS.PAUSED;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title={`Subscription ${sub.subscriptionNumber}`}
        subtitle={`Account: ${sub.customerName} • Billing: ${sub.planName} (${sub.billingPeriod})`}
        badge={<StatusBadge status={sub.status} />}
        backButton={
          <Link
            to={ROUTES.SUBSCRIPTIONS}
            className="p-2 text-textSecondary hover:text-textPrimary hover:bg-surface rounded-xl transition-colors inline-block"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        }
      />

      {/* Mascot Lifecycle Guidance Banner */}
      <MascotBanner
        title={`Hop's Lifecycle Monitor: ${sub.status} Stage`}
        tip="Guided Stage"
        message={
          sub.status === 'Draft'
            ? 'This subscription is a draft quote. You can review product lines and click "Send as Quotation" below to prepare it for customer acceptance.'
            : sub.status === 'Quotation'
            ? 'The proposal is waiting for client confirmation. Once confirmed by the customer, click "Confirm Proposal" to move forward!'
            : sub.status === 'Confirmed'
            ? 'Proposal confirmed! Click "Activate & Generate Invoice" to trigger the automated recurring billing schedule.'
            : sub.status === 'Active'
            ? 'This subscription is fully active and automatically billing recurring periods. You can pause, renew, or close early depending on the plan policies.'
            : sub.status === 'Paused'
            ? 'This subscription is paused. Billing cycles are frozen until you click "Resume Active".'
            : 'This subscription is closed.'
        }
      />

      {/* Visual Status Stepper Bar */}
      <div className="bg-[var(--surface)] backdrop-blur-md p-5 rounded-2xl border border-[var(--border)] shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-textSecondary uppercase tracking-wider">
            Lifecycle Progression
          </span>
          {isPaused && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-warning/20 text-warning border border-warning/40 animate-pulse">
              ⏸ Subscription is currently Paused
            </span>
          )}
        </div>

        <div className="grid grid-cols-5 gap-2 relative">
          {stepperStages.map((stage, idx) => {
            const isCompleted = currentStageIndex > idx && !isPaused;
            const isCurrent = currentStageIndex === idx && !isPaused;
            const isPast = currentStageIndex > idx;

            return (
              <div key={stage} className="flex flex-col items-center text-center relative z-10">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                    isCurrent
                      ? 'bg-accent text-[#0b1a1a] ring-4 ring-accent/30 font-bold scale-105'
                      : isPast
                      ? 'bg-[var(--accent-soft)] text-accent border border-[var(--border)] font-bold'
                      : 'bg-[var(--surface-strong)] text-textSecondary border border-[var(--border)]'
                  }`}
                >
                  {isPast ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={`mt-2 text-xs font-bold capitalize ${
                    isCurrent ? 'text-accent' : isPast ? 'text-textPrimary' : 'text-textSecondary'
                  }`}
                >
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Header Info & Action Controls */}
      <div className="bg-[var(--surface)] backdrop-blur-md p-6 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
          <div>
            <span className="text-[11px] font-bold text-textSecondary uppercase">Customer</span>
            <p className="text-xs font-bold text-textPrimary mt-0.5">{sub.customerName}</p>
            <p className="text-[11px] text-textSecondary truncate">{sub.customerEmail}</p>
          </div>

          <div>
            <span className="text-[11px] font-bold text-textSecondary uppercase">Dates</span>
            <p className="text-xs font-semibold text-textPrimary mt-0.5">
              Start: {formatDate(sub.startDate)}
            </p>
            <p className="text-[11px] text-textSecondary">Exp: {formatDate(sub.expiryDate)}</p>
          </div>

          <div>
            <span className="text-[11px] font-bold text-textSecondary uppercase">Next Billing</span>
            <p className="text-xs font-bold text-accent font-mono mt-0.5">
              {formatDate(sub.nextBillingDate)}
            </p>
            <p className="text-[11px] text-textSecondary">Terms: {sub.paymentTerms}</p>
          </div>

          <div>
            <span className="text-[11px] font-bold text-textSecondary uppercase">Total / Cycle</span>
            <p className="mt-0.5">
              <MoneyText amount={sub.total} className="text-base font-black text-textPrimary" />
            </p>
            <span className="text-[11px] text-textSecondary capitalize">cadence: {sub.billingPeriod}</span>
          </div>
        </div>

        {/* Action Buttons conditioned strictly on status */}
        <div className="flex flex-wrap items-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-[var(--border)]">
          {sub.status === SUBSCRIPTION_STATUS.DRAFT && (
            <>
              <button
                type="button"
                onClick={() =>
                  setConfirmAction({
                    title: 'Send Quotation to Customer?',
                    message:
                      'This moves the draft proposal to Quotation status and prepares it for client agreement.',
                    newStatus: SUBSCRIPTION_STATUS.QUOTATION,
                  })
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#0b1a1a] bg-accent hover:bg-accent-hover rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send as Quotation</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setConfirmAction({
                    title: 'Cancel Proposal?',
                    message: 'Are you sure you want to cancel and close this draft subscription?',
                    newStatus: SUBSCRIPTION_STATUS.CLOSED,
                    isDestructive: true,
                  })
                }
                className="px-3 py-2 text-xs font-bold text-danger hover:bg-danger/10 border border-danger/30 rounded-xl transition-colors cursor-pointer"
              >
                Cancel Draft
              </button>
            </>
          )}

          {sub.status === SUBSCRIPTION_STATUS.QUOTATION && (
            <>
              <button
                type="button"
                onClick={() =>
                  setConfirmAction({
                    title: 'Confirm Proposal?',
                    message:
                      'Customer has approved the quotation terms. Moves subscription into Confirmed stage.',
                    newStatus: SUBSCRIPTION_STATUS.CONFIRMED,
                  })
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#0b1a1a] bg-accent hover:bg-accent-hover rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Confirm Proposal</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setConfirmAction({
                    title: 'Reject Quotation?',
                    message: 'Mark this quotation as closed/rejected.',
                    newStatus: SUBSCRIPTION_STATUS.CLOSED,
                    isDestructive: true,
                  })
                }
                className="px-3 py-2 text-xs font-bold text-danger hover:bg-danger/10 border border-danger/30 rounded-xl transition-colors cursor-pointer"
              >
                Reject / Cancel
              </button>
            </>
          )}

          {sub.status === SUBSCRIPTION_STATUS.CONFIRMED && (
            <button
              type="button"
              onClick={() =>
                setConfirmAction({
                  title: 'Activate Subscription & Issue Invoice?',
                  message:
                    'Activating starts the billing schedule and automatically generates the first invoice.',
                  newStatus: SUBSCRIPTION_STATUS.ACTIVE,
                })
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#0b1a1a] bg-accent hover:bg-accent-hover rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Activate & Generate Invoice</span>
            </button>
          )}

          {sub.status === SUBSCRIPTION_STATUS.ACTIVE && (
            <>
              {plan?.canPause !== false && (
                <button
                  type="button"
                  onClick={() =>
                    setConfirmAction({
                      title: 'Pause Subscription?',
                      message:
                        'Recurring billing cycles will be temporarily suspended until resumed.',
                      newStatus: SUBSCRIPTION_STATUS.PAUSED,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-warning bg-warning/15 hover:bg-warning/25 border border-warning/40 rounded-xl transition-colors cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
              )}

              {plan?.canRenew !== false && (
                <button
                  type="button"
                  onClick={() => {
                    toast.success('Subscription renewed for next cycle!');
                    queryClient.invalidateQueries({ queryKey: ['subscription-detail', id] });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-accent bg-[var(--accent-soft)] hover:bg-accent hover:text-[#0b1a1a] border border-[var(--border)] rounded-xl transition-colors cursor-pointer"
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>Renew Cycle</span>
                </button>
              )}

              {plan?.canCloseEarly !== false && (
                <button
                  type="button"
                  onClick={() =>
                    setConfirmAction({
                      title: 'Close Subscription Early?',
                      message:
                        'Are you sure you want to terminate this active subscription contract?',
                      newStatus: SUBSCRIPTION_STATUS.CLOSED,
                      isDestructive: true,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-danger hover:bg-danger/10 border border-danger/30 rounded-xl transition-colors cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Close Early</span>
                </button>
              )}
            </>
          )}

          {sub.status === SUBSCRIPTION_STATUS.PAUSED && (
            <button
              type="button"
              onClick={() =>
                setConfirmAction({
                  title: 'Resume Subscription?',
                  message: 'Reactivate the subscription and resume regular billing cycles.',
                  newStatus: SUBSCRIPTION_STATUS.ACTIVE,
                })
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#0b1a1a] bg-accent hover:bg-accent-hover rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Resume Active</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-[var(--border)] flex gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('lines')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'lines'
              ? 'border-accent text-accent font-bold'
              : 'border-transparent text-textSecondary hover:text-textPrimary'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Product Lines ({sub.lines?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'invoices'
              ? 'border-accent text-accent font-bold'
              : 'border-transparent text-textSecondary hover:text-textPrimary'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Generated Invoices ({invoicesData?.items?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'activity'
              ? 'border-accent text-accent font-bold'
              : 'border-transparent text-textSecondary hover:text-textPrimary'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Activity Log ({sub.activityLog?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: Product Lines */}
      {activeTab === 'lines' && (
        <div className="bg-[var(--surface)] backdrop-blur-md rounded-2xl border border-[var(--border)] shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs text-textPrimary">
            <thead className="bg-[var(--surface-strong)] text-textSecondary font-bold uppercase tracking-wider border-b border-[var(--border)]">
              <tr>
                <th className="px-5 py-3">Product Description</th>
                <th className="px-5 py-3">Variant</th>
                <th className="px-5 py-3">Qty</th>
                <th className="px-5 py-3">Unit Price</th>
                <th className="px-5 py-3">Tax</th>
                <th className="px-5 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/60">
              {sub.lines?.map((line, idx) => (
                <tr key={line.id || idx}>
                  <td className="px-5 py-3.5 font-bold text-textPrimary">{line.productName}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-0.5 rounded text-[11px] bg-[var(--accent-soft)] text-accent font-bold border border-[var(--border)]">
                      {line.variantName || 'Standard Edition'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono">{line.quantity}</td>
                  <td className="px-5 py-3.5 font-mono font-medium">
                    <MoneyText amount={line.unitPrice} />
                  </td>
                  <td className="px-5 py-3.5 font-mono text-textSecondary">{line.taxPercent}%</td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-textPrimary">
                    <MoneyText amount={line.amount} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Breakdown calculation footer */}
          <div className="p-6 bg-[var(--surface-strong)]/60 border-t border-[var(--border)] flex flex-col items-end gap-1.5 text-xs text-textSecondary">
            <div className="flex justify-between w-64">
              <span>Lines Subtotal:</span>
              <MoneyText amount={sub.subtotal} className="text-textPrimary font-bold" />
            </div>
            {sub.discountAmount > 0 && (
              <div className="flex justify-between w-64 text-accent font-bold">
                <span>Discount ({sub.discountCode || 'Promo'}):</span>
                <span>-<MoneyText amount={sub.discountAmount} /></span>
              </div>
            )}
            <div className="flex justify-between w-64">
              <span>Taxes ({sub.taxPercent}%):</span>
              <MoneyText amount={sub.taxAmount} className="text-textPrimary font-bold" />
            </div>
            <div className="flex justify-between w-64 pt-2 border-t border-[var(--border)] text-sm font-black text-textPrimary">
              <span>Total / Cycle:</span>
              <MoneyText amount={sub.total} className="text-accent font-black" />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Invoices */}
      {activeTab === 'invoices' && (
        <div className="bg-[var(--surface)] backdrop-blur-md rounded-2xl border border-[var(--border)] shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs text-textPrimary">
            <thead className="bg-[var(--surface-strong)] text-textSecondary font-bold uppercase tracking-wider border-b border-[var(--border)]">
              <tr>
                <th className="px-5 py-3">Invoice #</th>
                <th className="px-5 py-3">Invoice Date</th>
                <th className="px-5 py-3">Due Date</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Amount Left</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/60">
              {!invoicesData?.items?.length ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-textSecondary">
                    No invoices generated yet. Activating this subscription will issue the first cycle invoice automatically.
                  </td>
                </tr>
              ) : (
                invoicesData.items.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[var(--accent-soft)]/20">
                    <td className="px-5 py-3.5 font-mono font-bold text-accent">
                      <Link to={`${ROUTES.INVOICES}/${inv.id}`} className="hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-textSecondary">{formatDate(inv.invoiceDate)}</td>
                    <td className="px-5 py-3.5 text-textSecondary">{formatDate(inv.dueDate)}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-textPrimary">
                      <MoneyText amount={inv.total} />
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-textPrimary">
                      <MoneyText amount={inv.amountLeft} />
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {inv.amountLeft > 0 && (
                        <button
                          type="button"
                          onClick={() => setPaymentModalInvoice(inv)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-[#0b1a1a] bg-accent hover:bg-accent-hover rounded-lg shadow-2xs cursor-pointer"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Pay</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Activity Log */}
      {activeTab === 'activity' && (
        <div className="bg-[var(--surface)] backdrop-blur-md p-6 rounded-2xl border border-[var(--border)] shadow-xs space-y-4">
          <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider">
            Audit Trail & Status History
          </h4>

          <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-[var(--border)]">
            {sub.activityLog?.map((act, idx) => (
              <div key={idx} className="flex items-start gap-4 relative">
                <div className="w-7 h-7 rounded-full bg-[var(--accent-soft)] text-accent flex items-center justify-center shrink-0 border-2 border-[var(--border)] shadow-xs">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 bg-[var(--surface-strong)] p-3 rounded-xl border border-[var(--border)]">
                  <p className="text-xs text-textPrimary font-semibold">{act.action}</p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-textSecondary">
                    <span>{act.user}</span>
                    <span>•</span>
                    <span>{act.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmAction)}
        title={confirmAction?.title}
        message={confirmAction?.message}
        confirmLabel="Proceed"
        isDestructive={confirmAction?.isDestructive}
        isLoading={statusMutation.isPending}
        onConfirm={() =>
          statusMutation.mutate({
            newStatus: confirmAction.newStatus,
          })
        }
        onClose={() => setConfirmAction(null)}
      />

      {/* Record Payment Dialog */}
      {paymentModalInvoice && (
        <RecordPaymentModal
          isOpen={true}
          invoice={paymentModalInvoice}
          onClose={() => setPaymentModalInvoice(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['sub-invoices'] });
            queryClient.invalidateQueries({ queryKey: ['subscription-detail', id] });
          }}
        />
      )}
    </div>
  );
}
