import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../../api/products';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import FilterBar from '../../components/ui/FilterBar';
import MoneyText from '../../components/ui/MoneyText';
import ProductFormModal from './ProductFormModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductsList() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search],
    queryFn: () => productsApi.getAll({ page, size: 8, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => productsApi.delete(id),
    onSuccess: () => {
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteProduct(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to delete product'),
  });

  const columns = [
    {
      key: 'name',
      header: 'Product Name',
      render: (row) => (
        <div>
          <div className="font-bold text-textPrimary flex items-center gap-2">
            <span>{row.name}</span>
            {row.variants && row.variants.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sage text-primary border border-mint">
                <Tag className="w-2.5 h-2.5" />
                {row.variants.length} variants
              </span>
            )}
          </div>
          <div className="text-[11px] text-textSecondary max-w-sm truncate">{row.notes || row.type}</div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-background text-textPrimary border border-border">
          {row.type}
        </span>
      ),
    },
    {
      key: 'salesPrice',
      header: 'Sales Price',
      render: (row) => <MoneyText amount={row.salesPrice} className="font-black text-textPrimary" />,
    },
    {
      key: 'costPrice',
      header: 'Cost Price',
      render: (row) => <MoneyText amount={row.costPrice} className="text-textSecondary" />,
    },
    {
      key: 'taxPercent',
      header: 'Tax',
      render: (row) => (
        <span className="text-xs font-mono text-textPrimary font-bold">
          {row.taxPercent || 0}%
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
                  setEditingProduct(row);
                  setModalOpen(true);
                }}
                className="p-1.5 text-textSecondary hover:text-primary hover:bg-sage/50 rounded-lg transition-colors cursor-pointer"
                title="Edit Product"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteProduct(row);
                }}
                className="p-1.5 text-textSecondary hover:text-coral hover:bg-coral/10 rounded-lg transition-colors cursor-pointer"
                title="Delete Product"
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
        title="Products & Variants Catalog"
        subtitle="Manage software products, recurring service modules, and dynamic pricing variants."
        action={
          isAdmin && (
            <button
              onClick={() => {
                setEditingProduct(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-[#15803d] rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
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
        searchPlaceholder="Search product by name, specs or type..."
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
            setEditingProduct(row);
            setModalOpen(true);
          }
        }}
        emptyTitle="No products in catalog"
        emptyDescription="Add your software subscriptions or add-on modules to get started."
      />

      <ProductFormModal
        isOpen={modalOpen}
        product={editingProduct}
        onClose={() => setModalOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['products'] })}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteProduct)}
        title={`Delete "${deleteProduct?.name}"?`}
        message="Are you sure you want to remove this product from the catalog?"
        confirmLabel="Delete Product"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteProduct.id)}
        onClose={() => setDeleteProduct(null)}
      />
    </div>
  );
}
