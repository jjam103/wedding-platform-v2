'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { DataTableWithSuspense as DataTable, type ColumnDef } from '@/components/ui/DataTableWithSuspense';
import { CollapsibleForm } from '@/components/admin/CollapsibleForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/ToastContext';
import type { Vendor } from '@/schemas/vendorSchemas';
import { createVendorSchema, updateVendorSchema } from '@/schemas/vendorSchemas';

// Define form field type for CollapsibleForm
interface VendorFormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'date' | 'datetime-local';
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  rows?: number;
}

/**
 * Vendor Management Page
 * 
 * Provides CRUD interface for managing wedding vendors.
 * Features:
 * - Data table with sorting, filtering, and search
 * - Calculated balance column (base_cost - amount_paid)
 * - Highlight unpaid vendors in warning color
 * - Create/edit modal with form validation
 * - Delete confirmation dialog
 * - Toast notifications for success/error feedback
 * - Real-time data refresh after operations
 */
export default function VendorsPage() {
  const { addToast } = useToast();
  
  // State management
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);

  /**
   * Fetch vendors from API
   */
  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/vendors');
      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }

      const result = await response.json();
      if (result.success) {
        setVendors(result.data.vendors || []);
      } else {
        addToast({
          type: 'error',
          message: result.error?.message || 'Failed to load vendors',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to load vendors',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Load data on mount
  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  /**
   * Handle row click - open edit form
   */
  const handleRowClick = useCallback((vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsFormOpen(true);
  }, []);

  /**
   * Handle add vendor button click
   */
  const handleAddVendor = useCallback(() => {
    setSelectedVendor(null);
    setIsFormOpen(true);
  }, []);

  /**
   * Handle delete button click
   */
  const handleDeleteClick = useCallback((vendor: Vendor) => {
    setVendorToDelete(vendor);
    setIsDeleteDialogOpen(true);
  }, []);

  /**
   * Handle form submission (create or update)
   */
  const handleSubmit = useCallback(async (data: any) => {
    try {
      // Validate amount_paid <= base_cost
      if (data.amountPaid !== undefined && data.baseCost !== undefined) {
        if (data.amountPaid > data.baseCost) {
          addToast({
            type: 'error',
            message: 'Amount paid cannot exceed base cost',
          });
          return;
        }
      }

      const isEdit = !!selectedVendor;
      const url = isEdit ? `/api/admin/vendors/${selectedVendor.id}` : '/api/admin/vendors';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        addToast({
          type: 'success',
          message: isEdit ? 'Vendor updated successfully' : 'Vendor created successfully',
        });
        
        // Refresh vendor list
        await fetchVendors();
        
        // Close form
        setIsFormOpen(false);
        setSelectedVendor(null);
      } else {
        addToast({
          type: 'error',
          message: result.error?.message || 'Operation failed',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Operation failed',
      });
    }
  }, [selectedVendor, addToast, fetchVendors]);

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!vendorToDelete) return;

    try {
      const response = await fetch(`/api/admin/vendors/${vendorToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        addToast({
          type: 'success',
          message: 'Vendor deleted successfully',
        });
        
        // Refresh vendor list
        await fetchVendors();
        
        // Close dialog
        setIsDeleteDialogOpen(false);
        setVendorToDelete(null);
      } else {
        addToast({
          type: 'error',
          message: result.error?.message || 'Failed to delete vendor',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete vendor',
      });
    }
  }, [vendorToDelete, addToast, fetchVendors]);

  // Define table columns
  const columns: ColumnDef<Vendor>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Photography', value: 'photography' },
        { label: 'Flowers', value: 'flowers' },
        { label: 'Catering', value: 'catering' },
        { label: 'Music', value: 'music' },
        { label: 'Transportation', value: 'transportation' },
        { label: 'Decoration', value: 'decoration' },
        { label: 'Other', value: 'other' },
      ],
      render: (value) => {
        const labels: Record<string, string> = {
          photography: 'Photography',
          flowers: 'Flowers',
          catering: 'Catering',
          music: 'Music',
          transportation: 'Transportation',
          decoration: 'Decoration',
          other: 'Other',
        };
        return labels[value] || value;
      },
    },
    {
      key: 'baseCost',
      label: 'Base Cost',
      sortable: true,
      render: (value) => `$${value.toFixed(2)}`,
    },
    {
      key: 'amountPaid',
      label: 'Amount Paid',
      sortable: true,
      render: (value) => `$${value.toFixed(2)}`,
    },
    {
      key: 'balance',
      label: 'Balance',
      sortable: false,
      render: (_, vendor) => {
        const balance = vendor.baseCost - vendor.amountPaid;
        return `$${balance.toFixed(2)}`;
      },
    },
    {
      key: 'paymentStatus',
      label: 'Payment Status',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Unpaid', value: 'unpaid' },
        { label: 'Partial', value: 'partial' },
        { label: 'Paid', value: 'paid' },
      ],
      render: (value) => {
        const statusMap: Record<string, 'payment-unpaid' | 'payment-partial' | 'payment-paid'> = {
          unpaid: 'payment-unpaid',
          partial: 'payment-partial',
          paid: 'payment-paid',
        };
        return <StatusBadge status={statusMap[value] || 'payment-unpaid'} />;
      },
    },
  ];

  // Define form fields
  const formFields: VendorFormField[] = [
    {
      name: 'name',
      label: 'Vendor Name',
      type: 'text',
      required: true,
      placeholder: 'Enter vendor name',
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      required: true,
      options: [
        { label: 'Photography', value: 'photography' },
        { label: 'Flowers', value: 'flowers' },
        { label: 'Catering', value: 'catering' },
        { label: 'Music', value: 'music' },
        { label: 'Transportation', value: 'transportation' },
        { label: 'Decoration', value: 'decoration' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'contactName',
      label: 'Contact Name',
      type: 'text',
      required: false,
      placeholder: 'Enter contact name',
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: false,
      placeholder: 'Enter email address',
    },
    {
      name: 'phone',
      label: 'Phone',
      type: 'text',
      required: false,
      placeholder: 'Enter phone number',
    },
    {
      name: 'pricingModel',
      label: 'Pricing Model',
      type: 'select',
      required: true,
      options: [
        { label: 'Flat Rate', value: 'flat_rate' },
        { label: 'Per Guest', value: 'per_guest' },
        { label: 'Tiered', value: 'tiered' },
      ],
    },
    {
      name: 'baseCost',
      label: 'Base Cost',
      type: 'number',
      required: true,
      placeholder: 'Enter base cost',
    },
    {
      name: 'amountPaid',
      label: 'Amount Paid',
      type: 'number',
      required: false,
      placeholder: 'Enter amount paid',
    },
    {
      name: 'paymentStatus',
      label: 'Payment Status',
      type: 'select',
      required: false,
      options: [
        { label: 'Unpaid', value: 'unpaid' },
        { label: 'Partial', value: 'partial' },
        { label: 'Paid', value: 'paid' },
      ],
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      required: false,
      placeholder: 'Enter any additional notes',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-sage-900">Vendor Management</h1>
          <p className="text-sage-600 mt-1">Manage your wedding vendors and track payments</p>
        </div>
      </div>

      {/* Collapsible Add Form */}
      <CollapsibleForm
        title={selectedVendor ? 'Edit Vendor' : 'Add Vendor'}
        isOpen={isFormOpen}
        onToggle={() => {
          if (isFormOpen) {
            setIsFormOpen(false);
            setSelectedVendor(null);
          } else {
            setIsFormOpen(true);
          }
        }}
        onSubmit={handleSubmit}
        onCancel={() => {
          setIsFormOpen(false);
          setSelectedVendor(null);
        }}
        initialData={selectedVendor || {}}
        schema={selectedVendor ? updateVendorSchema : createVendorSchema}
        fields={formFields}
        submitLabel={selectedVendor ? 'Update Vendor' : 'Create Vendor'}
      />

      {/* Data Table */}
      <DataTable
        data={vendors}
        columns={columns}
        loading={loading}
        onRowClick={handleRowClick}
        onDelete={handleDeleteClick}
        totalCount={vendors.length}
        currentPage={1}
        pageSize={25}
        idField="id"
        rowClassName={(vendor) => {
          // Highlight unpaid vendors in warning color
          return vendor.paymentStatus === 'unpaid' ? 'bg-volcano-50' : '';
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setVendorToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Vendor"
        message={`Are you sure you want to delete ${vendorToDelete?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
