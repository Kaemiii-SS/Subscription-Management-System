import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi } from '../../api/subscriptions';
import { plansApi } from '../../api/plans';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../lib/utils';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import MoneyText from '../../components/ui/MoneyText';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Repeat, Pause, Play, XCircle, ArrowRight, Eye, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function PortalSubscriptions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSub, setSelectedSub] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { sub, action, newStatus, title, message }

  const { data, isLoading } = useQuery({
    queryKey: ['portal-subscriptions', user?.id],
    queryFn: () => subscriptionsApi.getAll({ size: 50 }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ subId, newStatus, reason }) =>
      subscriptionsApi.updateStatus(subId, newStatus, reason),
    onSuccess: () => {
      toast.success('Your subscription was successfully updated!');
      queryClient.invalidateQueries({ queryKey: ['portal-subscriptions'] });
      setConfirmAction(null);
      setSelectedSub(null);
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
        <span className="font-mono font-bold text-blue-600">{row.subscriptionNumber}</span>
      ),
    },
    {
      key: 'planName',
      header: 'Plan & Billing Cadence',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900">{row.planName}</span>
          <span className="text-[11px] text-slate-400 capitalize block">
            Billed {row.billingPeriod}
          </span>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Recurring Fee',
      render: (row) => <MoneyText amount={row.total} className="font-bold text-slate-900" />,
    },
    {
      key: 'dates',
      header: 'Term Dates',
      render: (row) => (
        <span className="text-xs text-slate-500">
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
                className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg"
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
                className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg"
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
              className="px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg"
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
            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg"
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
        title="My Subscriptions"
        subtitle={`Active services and contracts registered to ${user?.companyName || user?.name}.`}
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Customer Isolation Guarded
          </span>
        }
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedSub.subscriptionNumber}
                </h3>
                <p className="text-xs text-slate-500">{selectedSub.planName}</p>
              </div>
              <StatusBadge status={selectedSub.status} />
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Start Date:</span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(selectedSub.startDate)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Renewal / Expiry:</span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(selectedSub.expiryDate)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Enrolled Products
                </h4>
                <div className="space-y-2">
                  {selectedSub.lines?.map((line, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-800">{line.productName}</span>
                        <span className="text-slate-400 ml-2">({line.variantName || 'Standard'})</span>
                        <span className="text-slate-400 block text-[11px]">Qty: {line.quantity}</span>
                      </div>
                      <MoneyText amount={line.amount} className="font-bold text-slate-900" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-xs font-semibold text-slate-600">Recurring Price:</span>
                <MoneyText amount={selectedSub.total} className="text-lg font-bold text-blue-600" />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
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
        isLoading={statusMutation.isPending}
        onConfirm={() =>
          statusMutation.mutate({
            subId: confirmAction.subId,
            newStatus: confirmAction.newStatus,
          })
        }
        onClose={() => setConfirmAction(null)}
      />
    </div>
  );
}
