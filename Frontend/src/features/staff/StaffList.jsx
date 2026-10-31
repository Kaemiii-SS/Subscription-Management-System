import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '../../api/staff';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import FormField from '../../components/ui/FormField';
import { formatDate } from '../../lib/utils';
import { Plus, Shield, X } from 'lucide-react';
import { toast } from 'sonner';

export default function StaffList() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Customer Success');

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => staffApi.create(payload),
    onSuccess: (newStaff) => {
      toast.success(`Staff member "${newStaff.name}" added successfully!`);
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setModalOpen(false);
      setName('');
      setEmail('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to add staff');
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Name and email are required');
      return;
    }
    createMutation.mutate({ name, email, department });
  };

  const columns = [
    {
      key: 'name',
      header: 'Staff Member',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center text-xs uppercase border border-accent/40">
            {row.name.charAt(0)}
          </div>
          <div>
            <span className="font-bold text-white text-sm block">{row.name}</span>
            <p className="text-xs text-white/80">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department / Team',
      render: (row) => (
        <span className="text-xs text-white font-semibold">{row.department || 'Operations'}</span>
      ),
    },
    {
      key: 'role',
      header: 'Access Role',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
            row.role === 'admin'
              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
              : 'bg-accent/20 text-accent border border-accent/40'
          }`}
        >
          <Shield className="w-3 h-3" />
          {row.role}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Onboarding Date',
      render: (row) => <span className="text-xs text-white font-medium">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff & User Management"
        subtitle="Manage internal operations and sales rep permissions (Admin Only)."
        action={
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#0b1a1a] bg-accent hover:bg-accent-hover rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={staff}
        isLoading={isLoading}
        total={staff.length}
        emptyTitle="No staff members registered"
      />

      {/* Add Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[var(--surface-strong)] backdrop-blur-xl rounded-3xl shadow-2xl border border-[var(--border)] overflow-hidden text-textPrimary">
            <div className="px-6 py-4 bg-[var(--surface-strong)]/80 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="text-base font-bold text-textPrimary">Add Internal Staff Member</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-textSecondary hover:text-textPrimary p-1.5 rounded-lg hover:bg-[var(--accent-soft)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <FormField label="Full Name" required>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. David Miller"
                  className="w-full px-3.5 py-2 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-textPrimary font-semibold"
                  required
                />
              </FormField>

              <FormField label="Work Email" required>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. david@brightloop.com"
                  className="w-full px-3.5 py-2 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-textPrimary font-semibold"
                  required
                />
              </FormField>

              <FormField label="Department / Assignment" required>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none text-textPrimary font-semibold cursor-pointer"
                >
                  <option value="Customer Success" className="bg-[#002222] text-[#f2f5e8]">Customer Success</option>
                  <option value="Sales Operations" className="bg-[#002222] text-[#f2f5e8]">Sales Operations</option>
                  <option value="Finance & Accounting" className="bg-[#002222] text-[#f2f5e8]">Finance & Accounting</option>
                  <option value="Technical Support" className="bg-[#002222] text-[#f2f5e8]">Technical Support</option>
                </select>
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
                  disabled={createMutation.isPending}
                  className="px-5 py-2 text-xs font-bold text-[#0b1a1a] bg-accent hover:bg-accent-hover disabled:opacity-50 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
