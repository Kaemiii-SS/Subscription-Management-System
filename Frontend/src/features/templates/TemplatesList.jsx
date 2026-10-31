import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templatesApi } from '../../api/templates';
import { ROUTES } from '../../constants/routes';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import FilterBar from '../../components/ui/FilterBar';
import TemplateFormModal from './TemplateFormModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Plus, Repeat, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TemplatesList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteTemplate, setDeleteTemplate] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['templates', page, search],
    queryFn: () => templatesApi.getAll({ page, size: 8, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => templatesApi.delete(id),
    onSuccess: () => {
      toast.success('Template deleted');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setDeleteTemplate(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to delete template'),
  });

  const handleCreateSubscriptionFromTemplate = (templateId) => {
    navigate(`${ROUTES.SUBSCRIPTION_NEW}?templateId=${templateId}`);
  };

  const columns = [
    {
      key: 'name',
      header: 'Template Name',
      render: (row) => (
        <div>
          <span className="font-bold text-textPrimary">{row.name}</span>
          <p className="text-[11px] text-textSecondary max-w-sm truncate">
            {row.notes || 'Configured package bundle'}
          </p>
        </div>
      ),
    },
    {
      key: 'validityDays',
      header: 'Validity Period',
      render: (row) => (
        <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-background text-textPrimary border border-border">
          {row.validityDays} Days
        </span>
      ),
    },
    {
      key: 'linesCount',
      header: 'Product Lines',
      render: (row) => (
        <span className="text-xs text-primary font-bold">
          {row.lines?.length || 0} product item(s)
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          {/* Main button: "Create subscription from this template" */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCreateSubscriptionFromTemplate(row.id);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0b1a1a] bg-accent hover:bg-accent-hover rounded-xl shadow-xs transition-all cursor-pointer"
            title="Create subscription from this template"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Create Subscription</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditingTemplate(row);
              setModalOpen(true);
            }}
            className="p-1.5 text-textSecondary hover:text-accent hover:bg-[var(--accent-soft)] rounded-lg transition-colors cursor-pointer"
            title="Edit Template"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTemplate(row);
            }}
            className="p-1.5 text-textSecondary hover:text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer"
            title="Delete Template"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotation Templates"
        subtitle="Standardized product bundles and proposal agreements for high-velocity sales."
        action={
          <button
            onClick={() => {
              setEditingTemplate(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#0b1a1a] bg-accent hover:bg-accent-hover rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Template</span>
          </button>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search template by name or proposal description..."
      />

      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        total={data?.total || 0}
        page={page}
        size={8}
        onPageChange={setPage}
        onRowClick={(row) => handleCreateSubscriptionFromTemplate(row.id)}
        emptyTitle="No quotation templates"
        emptyDescription="Create reusable templates to quickly generate proposals and subscriptions."
      />

      <TemplateFormModal
        isOpen={modalOpen}
        template={editingTemplate}
        onClose={() => setModalOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['templates'] })}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTemplate)}
        title={`Delete "${deleteTemplate?.name}"?`}
        message="Are you sure you want to delete this proposal template?"
        confirmLabel="Delete Template"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTemplate.id)}
        onClose={() => setDeleteTemplate(null)}
      />
    </div>
  );
}
