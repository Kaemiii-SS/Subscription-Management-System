import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discountsApi } from '../../api/discounts';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import FilterBar from '../../components/ui/FilterBar';
import DiscountFormModal from './DiscountFormModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatDate } from '../../lib/utils';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DiscountsList() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [deleteDiscount, setDeleteDiscount] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['discounts', page, search],
    queryFn: () => discountsApi.getAll({ page, size: 8, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => discountsApi.delete(id),
    onSuccess: () => {
      toast.success('Discount deleted');
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      setDeleteDiscount(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to delete discount'),
  });

  const columns = [
    {
      key: 'name',
      header: 'Discount & Code',
      render: (row) => (
        <div>
          <div className="font-bold text-textPrimary flex items-center gap-2">
            <span>{row.name}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-lavender/30 text-[#6d28d9] border border-lavender">
              {row.code}
            </span>
          </div>
          <p className="text-[11px] text-textSecondary capitalize">
            Applies to {row.appliesTo === 'product' ? 'Specific Product' : 'Whole Subscription'}
          </p>
        </div>
      ),
    },
    {
      key: 'value',
      header: 'Benefit',
      render: (row) => (
        <span className="text-xs font-bold text-primary font-mono">
          {row.type === 'percent' ? `${row.value}% Off` : `$${row.value} Off`}
        </span>
      ),
    },
    {
      key: 'usage',
      header: 'Usage Quota',
      render: (row) => {
        const used = row.usedCount || 0;
        const limit = row.usageLimit || 1;
        const percent = Math.min(100, Math.round((used / limit) * 100));

        return (
          <div className="w-36">
            <div className="flex justify-between text-[11px] font-bold text-textPrimary mb-1">
              <span>used {used} of {limit}</span>
              <span className="text-textSecondary">{percent}%</span>
            </div>
            <div className="w-full bg-background rounded-full h-1.5 overflow-hidden border border-border">
              <div
                className={`h-full rounded-full ${
                  percent >= 90 ? 'bg-coral' : 'bg-primary'
                }`}
                style={{ width: `${percent}%` }}
              ></div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'validity',
      header: 'Valid Dates',
      render: (row) => (
        <span className="text-[11px] text-textSecondary">
          {formatDate(row.startDate)} – {formatDate(row.endDate)}
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
                  setEditingDiscount(row);
                  setModalOpen(true);
                }}
                className="p-1.5 text-textSecondary hover:text-primary hover:bg-sage/40 rounded-lg transition-colors cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteDiscount(row);
                }}
                className="p-1.5 text-textSecondary hover:text-coral hover:bg-coral/10 rounded-lg transition-colors cursor-pointer"
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
        title="Promotions & Discount Rules"
        subtitle="Incentivize long-term contract commitments and volume expansion."
        action={
          isAdmin && (
            <button
              onClick={() => {
                setEditingDiscount(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#0b1a1a] bg-accent hover:bg-accent-hover rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Discount Rule</span>
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
        searchPlaceholder="Search discount by name or promo code..."
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
            setEditingDiscount(row);
            setModalOpen(true);
          }
        }}
        emptyTitle="No discounts created"
      />

      <DiscountFormModal
        isOpen={modalOpen}
        discount={editingDiscount}
        onClose={() => setModalOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['discounts'] })}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteDiscount)}
        title={`Delete "${deleteDiscount?.name}"?`}
        message="Are you sure you want to delete this promotion? Active subscriptions with this discount will retain their applied rate."
        confirmLabel="Delete Discount"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteDiscount.id)}
        onClose={() => setDeleteDiscount(null)}
      />
    </div>
  );
}
