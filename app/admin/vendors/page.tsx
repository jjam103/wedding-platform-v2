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
import type { VendorBooking } from '@/schemas/vendorBookingSchemas';
import { createVendorBookingSchema, updateVendorBookingSchema } from '@/schemas/vendorBookingSchemas';

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

interface Activity {
  id: string;
  name: string;
}

interface Event {
  id: string;
  name: string;
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
  
  // Vendor bookings state
  const [vendorBookings, setVendorBookings] = useState<VendorBooking[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isBookingsOpen, setIsBookingsOpen] = useState(false);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<VendorBooking | null>(null);
  const [bookingToDelete, setBookingToDelete] = useState<VendorBooking | null>(null);
  const [isBookingDeleteDialogOpen, setIsBookingDeleteDialogOpen] = useState(false);

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
    fetchVendorBookings();
    fetchActivities();
    fetchEvents();
  }, [fetchVendors]);

  /**
   * Fetch vendor bookings from API
   */
  const fetchVendorBookings = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/vendor-bookings');
      if (!response.ok) {
        throw new Error('Failed to fetch vendor bookings');
      }

      const result = await response.json();
      if (result.success) {
        setVendorBookings(result.data.bookings || []);
      }
    } catch (error) {
      console.error('Failed to fetch vendor bookings:', error);
    }
  }, []);

  /**
   * Fetch activities for booking dropdown
   */
  const fetchActivities = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/activities?pageSize=100');
      if (!response.ok) {
        console.error('Failed to fetch activities:', response.status, response.statusText);
        return;
      }

      const result = await response.json();
      console.log('Activities API response:', result);
      
      if (result.success && result.data) {
        // The API returns { success: true, data: { activities: [...], total, page, ... } }
        const activitiesData = result.data.activities || result.data;
        setActivities(Array.isArray(activitiesData) ? activitiesData : []);
        console.log('Activities loaded:', activitiesData.length);
      } else {
        console.error('Activities API returned error:', result.error);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  }, []);

  /**
   * Fetch events for booking dropdown
   */
  const fetchEvents = useCallback(async () => {
    try {
      // Max pageSize is 100 per schema validation
      const response = await fetch('/api/admin/events?pageSize=100');
      if (!response.ok) {
        console.error('Failed to fetch events:', response.status, response.statusText);
        return;
      }

      const result = await response.json();
      console.log('Events API response:', result);
      
      if (result.success && result.data) {
        // The API returns { success: true, data: { events: [...], total, page, ... } }
        const eventsData = result.data.events || result.data;
        setEvents(Array.isArray(eventsData) ? eventsData : []);
        console.log('Events loaded:', eventsData.length);
      } else {
        console.error('Events API returned error:', result.error);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  }, []);

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

  /**
   * Handle booking form submission (create or update)
   */
  const handleBookingSubmit = useCallback(async (data: any) => {
    try {
      const isEdit = !!selectedBooking;
      const url = isEdit ? `/api/admin/vendor-bookings/${selectedBooking.id}` : '/api/admin/vendor-bookings';
      const method = isEdit ? 'PUT' : 'POST';

      // Convert empty strings to null for optional fields
      const cleanedData = {
        ...data,
        activityId: data.activityId === '' ? null : data.activityId,
        eventId: data.eventId === '' ? null : data.eventId,
        guestCount: data.guestCount === '' ? null : data.guestCount,
        hostSubsidy: data.hostSubsidy === '' ? 0 : data.hostSubsidy,
        notes: data.notes === '' ? null : data.notes,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData),
      });

      const result = await response.json();

      if (result.success) {
        addToast({
          type: 'success',
          message: isEdit ? 'Booking updated successfully' : 'Booking created successfully',
        });
        
        // Refresh bookings list
        await fetchVendorBookings();
        
        // Close form
        setIsBookingFormOpen(false);
        setSelectedBooking(null);
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
  }, [selectedBooking, addToast, fetchVendorBookings]);

  /**
   * Handle booking delete confirmation
   */
  const handleBookingDeleteConfirm = useCallback(async () => {
    if (!bookingToDelete) return;

    try {
      const response = await fetch(`/api/admin/vendor-bookings/${bookingToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        addToast({
          type: 'success',
          message: 'Booking deleted successfully',
        });
        
        // Refresh bookings list
        await fetchVendorBookings();
        
        // Close dialog
        setIsBookingDeleteDialogOpen(false);
        setBookingToDelete(null);
      } else {
        addToast({
          type: 'error',
          message: result.error?.message || 'Failed to delete booking',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete booking',
      });
    }
  }, [bookingToDelete, addToast, fetchVendorBookings]);

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

  // Define booking table columns
  const bookingColumns: ColumnDef<VendorBooking>[] = [
    {
      key: 'vendorId',
      label: 'Vendor',
      sortable: true,
      render: (value) => {
        const vendor = vendors.find(v => v.id === value);
        return vendor?.name || '-';
      },
    },
    {
      key: 'activityId',
      label: 'Activity',
      sortable: true,
      render: (value) => {
        if (!value) return '-';
        const activity = activities.find(a => a.id === value);
        return activity?.name || '-';
      },
    },
    {
      key: 'eventId',
      label: 'Event',
      sortable: true,
      render: (value) => {
        if (!value) return '-';
        const event = events.find(e => e.id === value);
        return event?.name || '-';
      },
    },
    {
      key: 'bookingDate',
      label: 'Booking Date',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'pricingModel',
      label: 'Pricing',
      sortable: true,
      render: (value) => value === 'flat_rate' ? 'Flat Rate' : 'Per Guest',
    },
    {
      key: 'guestCount',
      label: 'Guests',
      sortable: true,
      render: (value) => value || '-',
    },
    {
      key: 'totalCost',
      label: 'Total Cost',
      sortable: true,
      render: (value) => `$${(value as number).toFixed(2)}`,
    },
    {
      key: 'hostSubsidy',
      label: 'Host Subsidy',
      sortable: true,
      render: (value) => `$${(value as number).toFixed(2)}`,
    },
    {
      key: 'notes',
      label: 'Notes',
      sortable: false,
      render: (value) => value || '-',
    },
  ];

  // Define booking form fields
  const bookingFormFields: VendorFormField[] = [
    {
      name: 'vendorId',
      label: 'Vendor',
      type: 'select',
      required: true,
      options: vendors.map(v => ({ label: v.name, value: v.id })),
    },
    {
      name: 'activityId',
      label: 'Activity (Optional)',
      type: 'select',
      required: false,
      options: [
        { label: 'None', value: '' },
        ...activities.map(a => ({ label: a.name, value: a.id })),
      ],
    },
    {
      name: 'eventId',
      label: 'Event (Optional)',
      type: 'select',
      required: false,
      options: [
        { label: 'None', value: '' },
        ...events.map(e => ({ label: e.name, value: e.id })),
      ],
    },
    {
      name: 'bookingDate',
      label: 'Booking Date',
      type: 'date',
      required: true,
    },
    {
      name: 'pricingModel',
      label: 'Pricing Model',
      type: 'select',
      required: true,
      options: [
        { label: 'Flat Rate', value: 'flat_rate' },
        { label: 'Per Guest', value: 'per_guest' },
      ],
    },
    {
      name: 'baseCost',
      label: 'Base Cost',
      type: 'number',
      required: true,
      placeholder: '0.00',
    },
    {
      name: 'guestCount',
      label: 'Guest Count (required for per-guest pricing)',
      type: 'number',
      required: false,
      placeholder: 'Enter number of guests',
    },
    {
      name: 'hostSubsidy',
      label: 'Host Subsidy',
      type: 'number',
      required: false,
      placeholder: '0.00',
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      required: false,
      placeholder: 'Enter any additional notes',
      rows: 3,
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
        <Button
          variant="primary"
          onClick={handleAddVendor}
          aria-label="Create new vendor"
          data-action="add-new"
        >
          + Add Vendor
        </Button>
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

      {/* Vendor Bookings Section */}
      <div className="bg-white rounded-lg shadow-sm border border-sage-200">
        {/* Header */}
        <button
          onClick={() => setIsBookingsOpen(!isBookingsOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-sage-50 hover:bg-sage-100 transition-colors rounded-t-lg"
          aria-expanded={isBookingsOpen}
        >
          <div className="flex-1 text-left">
            <h2 className="text-lg font-semibold text-sage-900">Vendor Bookings</h2>
            <p className="text-sm text-sage-600 mt-1">
              {vendorBookings.length} booking{vendorBookings.length !== 1 ? 's' : ''} • Link vendors to activities and events
            </p>
          </div>
          <span 
            className={`text-sage-600 transition-transform duration-300 ${isBookingsOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            ▼
          </span>
        </button>

        {/* Collapsible Content */}
        {isBookingsOpen && (
          <div className="p-4 space-y-4 border-t border-sage-200">
            {/* Add Booking Button */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-semibold text-sage-900">Manage Vendor Bookings</h3>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  console.log('Add Booking clicked');
                  setSelectedBooking(null);
                  setIsBookingFormOpen(true);
                }}
              >
                + Add Booking
              </Button>
            </div>

            {/* Booking Form */}
            {isBookingFormOpen && (
              <div className="bg-sage-50 p-4 rounded-lg border border-sage-200">
                <CollapsibleForm
                  title={selectedBooking ? 'Edit Booking' : 'Add New Booking'}
                  isOpen={true}
                  onToggle={() => {
                    setIsBookingFormOpen(false);
                    setSelectedBooking(null);
                  }}
                  onSubmit={handleBookingSubmit}
                  onCancel={() => {
                    setIsBookingFormOpen(false);
                    setSelectedBooking(null);
                  }}
                  initialData={selectedBooking || {}}
                  schema={selectedBooking ? updateVendorBookingSchema : createVendorBookingSchema}
                  fields={bookingFormFields}
                  submitLabel={selectedBooking ? 'Update Booking' : 'Create Booking'}
                />
              </div>
            )}

            {/* Bookings Table */}
            <DataTable
              data={vendorBookings}
              columns={bookingColumns}
              loading={false}
              onRowClick={(booking) => {
                setSelectedBooking(booking);
                setIsBookingFormOpen(true);
              }}
              onDelete={(booking) => {
                setBookingToDelete(booking);
                setIsBookingDeleteDialogOpen(true);
              }}
              totalCount={vendorBookings.length}
              currentPage={1}
              pageSize={25}
              idField="id"
            />
          </div>
        )}
      </div>

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

      {/* Booking Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isBookingDeleteDialogOpen}
        onClose={() => {
          setIsBookingDeleteDialogOpen(false);
          setBookingToDelete(null);
        }}
        onConfirm={handleBookingDeleteConfirm}
        title="Delete Vendor Booking"
        message="Are you sure you want to delete this vendor booking? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
