import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plansApi } from '../../api/plans';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import FilterBar from '../../components/ui/FilterBar';
import MoneyText from '../../components/ui/MoneyText';
import PlanFormModal from './PlanFormModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatDate } from '../../lib/utils';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PlansList() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [deletePlan, setDeletePlan] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['plans', page, search, periodFilter],
    queryFn: () => plansApi.getAll({ page, size: 8, search, period: periodFilter }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => plansApi.delete(id),
    onSuccess: () => {
      toast.success('Plan deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setDeletePlan(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to delete plan'),
  });

  const columns = [
    {
      key: 'name',
      header: 'Plan Name',
      render: (row) => (
        <div>
          <div className="font-bold text-textPrimary">{row.name}</div>
          <div className="text-[11px] text-textSecondary max-w-xs truncate">{row.description || 'Standard plan'}</div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price / Cycle',
      render: (row) => (
        <div>
          <MoneyText amount={row.price} className="font-bold text-textPrimary" />
          <span className="text-[11px] text-textSecondary ml-1">/ {row.billingPeriod}</span>
        </div>
      ),
    },
    {
      key: 'minQuantity',
      header: 'Min Qty / Seats',
      render: (row) => (
        <span className="text-xs font-mono font-bold text-textPrimary">
          {row.minQuantity} {row.minQuantity === 1 ? 'unit' : 'units'}
        </span>
      ),
    },
    {
      key: 'policies',
      header: 'Allowed Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.canPause && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber/20 text-amber-700 border border-amber">
              Pause
            </span>
          )}
          {row.canRenew && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sage text-primary border border-mint">
              Renew
            </span>
          )}
          {row.canCloseEarly && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-lavender/30 text-[#6d28d9] border border-lavender">
              Close Early
            </span>
          )}
          {row.autoClose && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-background text-textSecondary border border-border">
              Auto-Close
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'availability',
      header: 'Validity Period',
      render: (row) => (
        <span className="text-[11px] text-textSecondary">
          {formatDate(row.availableFrom)} – {formatDate(row.availableTo)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {isAdmin ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingPlan(row);
                  setModalOpen(true);
                }}
                className="p-1.5 text-textSecondary hover:text-primary hover:bg-sage/40 rounded-lg transition-colors cursor-pointer"
                title="Edit Plan"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletePlan(row);
                }}
                className="p-1.5 text-textSecondary hover:text-coral hover:bg-coral/10 rounded-lg transition-colors cursor-pointer"
                title="Delete Plan"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <span className="text-[11px] text-textSecondary italic">View-only</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Plans"
        subtitle="Manage billing cycles, seat minimums, and subscription lifecycle constraints."
        action={
          isAdmin && (
            <button
              onClick={() => {
                setEditingPlan(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-[#15803d] rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Plan</span>
            </button>
          )
        }
      />

      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search plans by name or terms..."
        statusFilter={periodFilter}
        onStatusChange={(val) => {
          setPeriodFilter(val);
          setPage(1);
        }}
        statusOptions={[
          { label: 'Daily', value: 'daily' },
          { label: 'Weekly', value: 'weekly' },
          { label: 'Monthly', value: 'monthly' },
          { label: 'Yearly', value: 'yearly' },
        ]}
      />

      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        total={data?.total || 0}
        page={page}
        size={8}
        onPageChange={setPage}
        onRowClick={(row) => {
          if (isAdmin) {
            setEditingPlan(row);
            setModalOpen(true);
          }
        }}
        emptyTitle="No plans configured"
        emptyDescription="Create your first subscription billing cycle to link with products."
      />

      <PlanFormModal
        isOpen={modalOpen}
        plan={editingPlan}
        onClose={() => setModalOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['plans'] })}
      />

      <ConfirmDialog
        isOpen={Boolean(deletePlan)}
        title={`Delete Plan "${deletePlan?.name}"?`}
        message="Are you sure you want to delete this billing plan? Subscriptions currently active under this plan will keep their existing terms."
        confirmLabel="Delete Plan"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deletePlan.id)}
        onClose={() => setDeletePlan(null)}
      />
    </div>
  );
}
