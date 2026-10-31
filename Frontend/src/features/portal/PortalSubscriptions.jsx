import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi } from '../../api/subscriptions';
import { formatDate } from '../../lib/utils';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import MoneyText from '../../components/ui/MoneyText';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Eye, CheckCircle2, PauseCircle, PlayCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PortalSubscriptions() {
  const queryClient = useQueryClient();
  const [selectedSub, setSelectedSub] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['portal-subscriptions'],
    queryFn: () => subscriptionsApi.getAll({ size: 50 }),
  });

  const mutation = useMutation({
    mutationFn: ({ subId, newStatus }) => subscriptionsApi.updateStatus(subId, newStatus),
    onSuccess: (updated) => {
      toast.success(`Subscription ${updated.subscriptionNumber} updated to ${updated.status}`);
      queryClient.invalidateQueries(['portal-subscriptions']);
      setConfirmAction(null);
      if (selectedSub && selectedSub.id === updated.id) {
        setSelectedSub(updated);
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Operation failed');
      setConfirmAction(null);
    },
  });

  const columns = [
    {
      key: 'subscriptionNumber',
      header: 'Subscription #',
      render: (row) => (
        <span className="font-mono font-bold text-accent">{row.subscriptionNumber}</span>
      ),
    },
    {
      key: 'planName',
      header: 'Plan & Billing Cadence',
      render: (row) => (
        <div>
          <span className="font-semibold text-textPrimary">{row.planName}</span>
          <span className="text-[11px] text-textSecondary capitalize block">
            Billed {row.billingPeriod}
          </span>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Recurring Fee',
      render: (row) => <MoneyText amount={row.total} className="font-bold text-textPrimary" />,
    },
    {
      key: 'dates',
      header: 'Term Dates',
      render: (row) => (
        <span className="text-xs text-textSecondary">
          {formatDate(row.startDate)} – {formatDate(row.expiryDate)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Self-Service Controls',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          {/* If Active, customer may pause or close if plan allows */}
          {row.status === 'Active' && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmAction({
                    subId: row.id,
                    newStatus: 'Paused',
                    title: 'Pause Your Subscription?',
                    message:
                      'Your subscription and recurring services will be temporarily put on hold.',
                  });
                }}
                className="px-2.5 py-1 text-xs font-semibold text-warning bg-warning/10 hover:bg-warning/20 border border-warning/30 rounded-lg cursor-pointer transition-colors"
              >
                Pause
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmAction({
                    subId: row.id,
                    newStatus: 'Closed',
                    title: 'Cancel Subscription?',
                    message:
                      'Are you sure you want to terminate your subscription contract early?',
                    isDestructive: true,
                  });
                }}
                className="px-2.5 py-1 text-xs font-semibold text-danger bg-danger/10 hover:bg-danger/20 border border-danger/30 rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </>
          )}

          {row.status === 'Paused' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmAction({
                  subId: row.id,
                  newStatus: 'Active',
                  title: 'Resume Subscription?',
                  message: 'Reactivate your subscription and resume regular service delivery.',
                });
              }}
              className="px-3 py-1 text-xs font-bold text-accent bg-[var(--accent-soft)] hover:bg-accent hover:text-[#0b1a1a] border border-[var(--border)] rounded-lg cursor-pointer transition-colors"
            >
              Resume
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedSub(row);
            }}
            className="p-1.5 text-textSecondary hover:text-textPrimary hover:bg-[var(--accent-soft)] rounded-lg cursor-pointer transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Active Subscriptions"
        subtitle="Manage your recurring services, add-ons, plan pause status, and renewals."
      />

      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        total={data?.total || 0}
        onRowClick={(row) => setSelectedSub(row)}
        emptyTitle="No active subscriptions found"
        emptyDescription="You currently do not have any recurring contracts with Brightloop."
      />

      {/* Subscription Quick View Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-xl bg-[var(--surface-strong)] backdrop-blur-xl rounded-3xl shadow-2xl border border-[var(--border)] overflow-hidden max-h-[90vh] flex flex-col text-textPrimary">
            <div className="p-6 bg-[var(--surface-strong)]/80 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-textPrimary">
                  {selectedSub.subscriptionNumber}
                </h3>
                <p className="text-xs text-textSecondary">{selectedSub.planName}</p>
              </div>
              <StatusBadge status={selectedSub.status} />
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-textSecondary block">Start Date:</span>
                  <span className="font-semibold text-textPrimary">
                    {formatDate(selectedSub.startDate)}
                  </span>
                </div>
                <div>
                  <span className="text-textSecondary block">Renewal / Expiry:</span>
                  <span className="font-semibold text-textPrimary">
                    {formatDate(selectedSub.expiryDate)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border)]">
                <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider mb-2">
                  Enrolled Products
                </h4>
                <div className="space-y-2">
                  {selectedSub.lines?.map((line, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-textPrimary">{line.productName}</span>
                        <span className="text-textSecondary ml-2">({line.variantName || 'Standard'})</span>
                        <span className="text-textSecondary block text-[11px]">Qty: {line.quantity}</span>
                      </div>
                      <MoneyText amount={line.amount} className="font-bold text-textPrimary" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex justify-between items-baseline">
                <span className="text-xs font-semibold text-textSecondary">Recurring Price:</span>
                <MoneyText amount={selectedSub.total} className="text-lg font-black text-accent" />
              </div>
            </div>

            <div className="p-4 bg-[var(--surface-strong)]/80 border-t border-[var(--border)] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 text-xs font-semibold text-textSecondary hover:text-textPrimary hover:bg-[var(--accent-soft)] border border-[var(--border)] rounded-xl transition-colors cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmAction)}
        title={confirmAction?.title}
        message={confirmAction?.message}
        isDestructive={confirmAction?.isDestructive}
        isLoading={mutation.isPending}
        confirmLabel={confirmAction?.newStatus === 'Closed' ? 'Confirm Cancellation' : 'Confirm'}
        onConfirm={() =>
          mutation.mutate({
            subId: confirmAction.subId,
            newStatus: confirmAction.newStatus,
          })
        }
        onClose={() => setConfirmAction(null)}
      />
    </div>
  );
}
