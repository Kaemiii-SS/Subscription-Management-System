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
          <div className="w-8 h-8 rounded-full bg-sage text-primary font-bold flex items-center justify-center text-xs uppercase border border-mint">
            {row.name.charAt(0)}
          </div>
          <div>
            <span className="font-bold text-textPrimary">{row.name}</span>
            <p className="text-[11px] text-textSecondary">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department / Team',
      render: (row) => (
        <span className="text-xs text-textPrimary font-semibold">{row.department || 'Operations'}</span>
      ),
    },
    {
      key: 'role',
      header: 'Access Role',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
            row.role === 'admin'
              ? 'bg-lavender/30 text-[#6d28d9] border border-lavender'
              : 'bg-sage text-primary border border-mint'
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
      render: (row) => <span className="text-xs text-textSecondary">{formatDate(row.createdAt)}</span>,
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
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-[#15803d] rounded-xl shadow-xs transition-all cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface rounded-3xl shadow-2xl border border-border overflow-hidden text-textPrimary">
            <div className="px-6 py-4 bg-background border-b border-border flex items-center justify-between">
              <h3 className="text-base font-bold text-textPrimary">Add Internal Staff Member</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-textSecondary hover:text-textPrimary p-1 cursor-pointer"
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
                  className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl text-textPrimary font-semibold"
                  required
                />
              </FormField>

              <FormField label="Work Email" required>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. david@brightloop.com"
                  className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl text-textPrimary font-semibold"
                  required
                />
              </FormField>

              <FormField label="Department / Assignment" required>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl text-textPrimary font-semibold cursor-pointer"
                >
                  <option value="Customer Success">Customer Success</option>
                  <option value="Sales Operations">Sales Operations</option>
                  <option value="Finance & Accounting">Finance & Accounting</option>
                  <option value="Technical Support">Technical Support</option>
                </select>
              </FormField>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-textSecondary hover:bg-background rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-[#15803d] disabled:bg-primary/50 rounded-xl cursor-pointer"
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
