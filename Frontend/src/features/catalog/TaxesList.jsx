import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taxesApi } from '../../api/taxes';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import FormField from '../../components/ui/FormField';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxesList() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [deleteTax, setDeleteTax] = useState(null);

  const [formName, setFormName] = useState('');
  const [formPercent, setFormPercent] = useState(18);
  const [formDesc, setFormDesc] = useState('');

  const { data: taxes = [], isLoading } = useQuery({
    queryKey: ['taxes'],
    queryFn: () => taxesApi.getAll(),
  });

  const openForm = (tax = null) => {
    setEditingTax(tax);
    if (tax) {
      setFormName(tax.name);
      setFormPercent(tax.percent);
      setFormDesc(tax.description || '');
    } else {
      setFormName('');
      setFormPercent(18);
      setFormDesc('');
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Tax name is required');
      return;
    }
    try {
      if (editingTax) {
        await taxesApi.update(editingTax.id, {
          name: formName,
          percent: Number(formPercent),
          description: formDesc,
        });
        toast.success('Tax rule updated');
      } else {
        await taxesApi.create({
          name: formName,
          percent: Number(formPercent),
          description: formDesc,
        });
        toast.success('Tax rule created');
      }
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      setModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to save tax rule');
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => taxesApi.delete(id),
    onSuccess: () => {
      toast.success('Tax rule deleted');
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      setDeleteTax(null);
    },
  });

  const columns = [
    {
      key: 'name',
      header: 'Tax Rule Name',
      render: (row) => (
        <div>
          <span className="font-bold text-white text-sm block">{row.name}</span>
          {row.description && <p className="text-xs text-white/80">{row.description}</p>}
        </div>
      ),
    },
    {
      key: 'percent',
      header: 'Rate (%)',
      render: (row) => (
        <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-accent/20 text-accent border border-accent/40">
          {row.percent}%
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
                onClick={() => openForm(row)}
                className="p-1.5 text-textSecondary hover:text-primary hover:bg-sage/40 rounded-lg transition-colors cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDeleteTax(row)}
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
        title="Tax Rules & Rates"
        subtitle="Automatic tax percentages applied during quotation and recurring invoice generation."
        action={
          isAdmin && (
            <button
              onClick={() => openForm()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#0b1a1a] bg-accent hover:bg-accent-hover rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Tax Rule</span>
            </button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={taxes}
        isLoading={isLoading}
        total={taxes.length}
        emptyTitle="No tax rules configured"
      />

      {/* Tax Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[var(--surface-strong)] backdrop-blur-xl rounded-3xl shadow-2xl border border-[var(--border)] overflow-hidden text-textPrimary">
            <div className="px-6 py-4 bg-[var(--surface-strong)]/80 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="text-base font-bold text-textPrimary">
                {editingTax ? 'Edit Tax Rule' : 'New Tax Rule'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-textSecondary hover:text-textPrimary p-1 rounded-lg hover:bg-[var(--accent-soft)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <FormField label="Tax Name" required>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Standard GST (18%)"
                  className="w-full px-3.5 py-2 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-textPrimary font-semibold"
                  required
                />
              </FormField>

              <FormField label="Tax Percentage (%)" required>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formPercent}
                  onChange={(e) => setFormPercent(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-mono bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-textPrimary font-bold"
                  required
                />
              </FormField>

              <FormField label="Description">
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="e.g. Mandatory software and digital services tax"
                  className="w-full px-3.5 py-2 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none text-textPrimary font-medium"
                />
              </FormField>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-textSecondary hover:text-textPrimary hover:bg-[var(--accent-soft)] rounded-xl border border-[var(--border)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-[#0b1a1a] bg-accent hover:bg-accent-hover rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Save Tax
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTax)}
        title={`Delete Tax "${deleteTax?.name}"?`}
        message="Are you sure you want to delete this tax rule?"
        isDestructive={true}
        onConfirm={() => deleteMutation.mutate(deleteTax.id)}
        onClose={() => setDeleteTax(null)}
      />
    </div>
  );
}
