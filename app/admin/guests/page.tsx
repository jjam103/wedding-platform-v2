'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { DataTableWithSuspense as DataTable, type ColumnDef } from '@/components/ui/DataTableWithSuspense';
import { CollapsibleForm } from '@/components/admin/CollapsibleForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import { ComponentErrorBoundary } from '@/components/ui/ErrorBoundary';
import type { Guest } from '@/schemas/guestSchemas';
import { createGuestSchema, updateGuestSchema } from '@/schemas/guestSchemas';
import { exportToCSV as exportGuestsToCSV, importFromCSV as importGuestsFromCSV } from '@/services/guestService';
import { Loader2 } from 'lucide-react';

// Lazy load InlineRSVPEditor for better performance
const InlineRSVPEditor = lazy(() => 
  import('@/components/admin/InlineRSVPEditor').then(mod => ({ default: mod.InlineRSVPEditor }))
);

interface Group {
  id: string;
  name: string;
  description?: string | null;
  guestCount?: number;
}

interface Activity {
  id: string;
  name: string;
}

interface GuestFormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'date' | 'datetime-local';
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  rows?: number;
}

/**
 * Guest Management Page
 * 
 * Provides CRUD interface for managing wedding guests.
 * Features:
 * - Data table with sorting, filtering, and search
 * - Create/edit modal with form validation
 * - Delete confirmation dialog
 * - Toast notifications for success/error feedback
 * - Real-time data refresh after operations
 */
export default function GuestsPage() {
  const { addToast } = useToast();
  
  // State management
  const [guests, setGuests] = useState<Guest[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [guestToDelete, setGuestToDelete] = useState<Guest | null>(null);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  const [csvImportErrors, setCsvImportErrors] = useState<string[]>([]);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  
  // Group management state
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [isGroupDeleteDialogOpen, setIsGroupDeleteDialogOpen] = useState(false);
  
  // Advanced filter state
  const [rsvpStatusFilter, setRsvpStatusFilter] = useState<string>('');
  const [activityFilter, setActivityFilter] = useState<string>('');
  const [transportationFilter, setTransportationFilter] = useState<string>('');
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>('');
  const [airportFilter, setAirportFilter] = useState<string>('');
  const [groupingField, setGroupingField] = useState<string>('');
  const [expandedGuestIds, setExpandedGuestIds] = useState<Set<string>>(new Set());

  /**
   * Fetch guests from API with filters
   */
  const fetchGuests = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (rsvpStatusFilter) params.append('rsvpStatus', rsvpStatusFilter);
      if (activityFilter) params.append('activityId', activityFilter);
      if (transportationFilter) params.append('hasTransportation', transportationFilter);
      if (ageGroupFilter) params.append('ageType', ageGroupFilter);
      if (airportFilter) params.append('airportCode', airportFilter);
      
      const url = `/api/admin/guests${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch guests');
      }

      const result = await response.json();
      if (result.success) {
        setGuests(result.data.guests || []);
      } else {
        addToast({
          type: 'error',
          message: result.error?.message || 'Failed to load guests',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to load guests',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast, rsvpStatusFilter, activityFilter, transportationFilter, ageGroupFilter, airportFilter]);

  /**
   * Fetch groups for filter dropdown
   */
  const fetchGroups = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/guest-groups');
      if (!response.ok) {
        return;
      }

      const result = await response.json();
      if (result.success) {
        setGroups(result.data || []);
      }
    } catch (error) {
      // Silently fail for groups - not critical
      console.error('Failed to fetch groups:', error);
    }
  }, []);

  /**
   * Fetch activities for filter dropdown
   */
  const fetchActivities = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/activities');
      if (!response.ok) {
        return;
      }

      const result = await response.json();
      if (result.success) {
        // Handle paginated response - extract activities array
        const activitiesData = result.data?.activities || result.data || [];
        setActivities(Array.isArray(activitiesData) ? activitiesData : []);
      }
    } catch (error) {
      // Silently fail for activities - not critical
      console.error('Failed to fetch activities:', error);
    }
  }, []);

  // Load data on mount and when filters change
  useEffect(() => {
    fetchGuests();
    fetchGroups();
    fetchActivities();
  }, [fetchGuests, fetchGroups, fetchActivities]);

  /**
   * Set up real-time subscription for guest changes
   */
  useEffect(() => {
    // Create Supabase client for real-time subscriptions
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables for real-time subscriptions');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Subscribe to guest table changes
    const channel = supabase
      .channel('guests-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'guests',
        },
        (payload) => {
          console.log('Guest change detected:', payload);

          // Show notification when data is updated by another user
          if (payload.eventType === 'INSERT') {
            addToast({
              type: 'info',
              message: 'A new guest was added by another user',
            });
          } else if (payload.eventType === 'UPDATE') {
            addToast({
              type: 'info',
              message: 'A guest was updated by another user',
            });
          } else if (payload.eventType === 'DELETE') {
            addToast({
              type: 'info',
              message: 'A guest was deleted by another user',
            });
          }

          // Refresh the guest list
          fetchGuests();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchGuests, addToast]);

  /**
   * Handle row click - open edit form
   */
  const handleRowClick = useCallback((guest: Guest) => {
    setSelectedGuest(guest);
    setIsFormOpen(true);
  }, []);

  /**
   * Toggle RSVP expansion for a guest
   */
  const toggleRSVPExpansion = useCallback((guestId: string) => {
    setExpandedGuestIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(guestId)) {
        newSet.delete(guestId);
      } else {
        newSet.add(guestId);
      }
      return newSet;
    });
  }, []);

  /**
   * Handle add guest button click
   */
  const handleAddGuest = useCallback(() => {
    setSelectedGuest(null);
    setIsFormOpen(true);
  }, []);

  /**
   * Handle delete button click
   */
  const handleDeleteClick = useCallback((guest: Guest) => {
    setGuestToDelete(guest);
    setIsDeleteDialogOpen(true);
  }, []);

  /**
   * Handle form submission (create or update)
   */
  const handleSubmit = useCallback(async (data: any) => {
    try {
      const isEdit = !!selectedGuest;
      const url = isEdit ? `/api/admin/guests/${selectedGuest.id}` : '/api/admin/guests';
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
          message: isEdit ? 'Guest updated successfully' : 'Guest created successfully',
        });
        
        // Refresh guest list
        await fetchGuests();
        
        // Close form
        setIsFormOpen(false);
        setSelectedGuest(null);
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
  }, [selectedGuest, addToast, fetchGuests]);

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!guestToDelete) return;

    try {
      const response = await fetch(`/api/admin/guests/${guestToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        addToast({
          type: 'success',
          message: 'Guest deleted successfully',
        });
        
        // Refresh guest list
        await fetchGuests();
        
        // Close dialog
        setIsDeleteDialogOpen(false);
        setGuestToDelete(null);
      } else {
        addToast({
          type: 'error',
          message: result.error?.message || 'Failed to delete guest',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete guest',
      });
    }
  }, [guestToDelete, addToast, fetchGuests]);

  /**
   * Handle bulk delete
   */
  const handleBulkDelete = useCallback(async (ids: string[]) => {
    setSelectedGuestIds(ids);
    setIsBulkDeleteDialogOpen(true);
  }, []);

  /**
   * Handle CSV import
   */
  const handleImportCSV = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Read file content
      const content = await file.text();
      
      // Import guests
      const result = await importGuestsFromCSV(content);
      
      if (result.success) {
        addToast({
          type: 'success',
          message: `Successfully imported ${result.data.length} guests`,
        });
        
        // Refresh guest list
        await fetchGuests();
        
        // Clear any previous errors
        setCsvImportErrors([]);
      } else {
        // Display validation errors
        const errorMessages = Array.isArray(result.error?.details) 
          ? result.error.details.map((detail: any) => 
              `Row ${detail.row || 'unknown'}: ${detail.message || detail.path?.join('.') || 'Validation error'}`
            )
          : [result.error?.message || 'Import failed'];
        
        setCsvImportErrors(errorMessages);
        setIsImportDialogOpen(true);
        
        addToast({
          type: 'error',
          message: 'CSV import failed. Please check the errors.',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to import CSV',
      });
    }
    
    // Reset file input
    event.target.value = '';
  }, [addToast, fetchGuests]);

  /**
   * Handle CSV export
   */
  const handleExportCSV = useCallback(async () => {
    try {
      // Export all guests (not just filtered ones)
      const result = await exportGuestsToCSV(guests);
      
      if (result.success) {
        // Create blob and download
        const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `guests-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        addToast({
          type: 'success',
          message: `Exported ${guests.length} guests to CSV`,
        });
      } else {
        addToast({
          type: 'error',
          message: result.error?.message || 'Failed to export CSV',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to export CSV',
      });
    }
  }, [guests, addToast]);

  /**
   * Handle bulk delete confirmation
   */
  const handleBulkDeleteConfirm = useCallback(async () => {
    if (selectedGuestIds.length === 0) return;

    try {
      let successCount = 0;
      let errorCount = 0;

      // Delete each guest sequentially
      for (const id of selectedGuestIds) {
        try {
          const response = await fetch(`/api/admin/guests/${id}`, {
            method: 'DELETE',
          });

          const result = await response.json();
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch {
          errorCount++;
        }
      }

      // Show result toast
      if (successCount > 0) {
        addToast({
          type: 'success',
          message: `Successfully deleted ${successCount} guest${successCount > 1 ? 's' : ''}`,
        });
      }

      if (errorCount > 0) {
        addToast({
          type: 'error',
          message: `Failed to delete ${errorCount} guest${errorCount > 1 ? 's' : ''}`,
        });
      }

      // Refresh guest list
      await fetchGuests();

      // Close dialog
      setIsBulkDeleteDialogOpen(false);
      setSelectedGuestIds([]);
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Bulk delete failed',
      });
    }
  }, [selectedGuestIds, addToast, fetchGuests]);

  /**
   * Handle group form submission (create or update)
   */
  const handleGroupSubmit = useCallback(async (data: any) => {
    try {
      const isEdit = !!selectedGroup;
      const url = isEdit ? `/api/admin/guest-groups/${selectedGroup.id}` : '/api/admin/guest-groups';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include', // Important: Include cookies for authentication
      });

      const result = await response.json();

      if (result.success) {
        addToast({
          type: 'success',
          message: isEdit ? 'Group updated successfully' : 'Group created successfully',
        });
        
        // Refresh groups list
        await fetchGroups();
        
        // Clear selected group (form will stay open for creating more)
        setSelectedGroup(null);
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
  }, [selectedGroup, addToast, fetchGroups]);

  /**
   * Handle group delete click
   */
  const handleGroupDeleteClick = useCallback((group: Group) => {
    setGroupToDelete(group);
    setIsGroupDeleteDialogOpen(true);
  }, []);

  /**
   * Handle group delete confirmation
   */
  const handleGroupDeleteConfirm = useCallback(async () => {
    if (!groupToDelete) return;

    try {
      const response = await fetch(`/api/admin/guest-groups/${groupToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        addToast({
          type: 'success',
          message: 'Group deleted successfully',
        });
        
        // Refresh groups list
        await fetchGroups();
        
        // Close dialog
        setIsGroupDeleteDialogOpen(false);
        setGroupToDelete(null);
      } else {
        addToast({
          type: 'error',
          message: result.error?.message || 'Failed to delete group',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete group',
      });
    }
  }, [groupToDelete, addToast, fetchGroups]);

  // Define table columns
  const columns: ColumnDef<Guest>[] = [
    {
      key: 'rsvpExpand',
      label: '',
      render: (_, guest) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleRSVPExpansion(guest.id);
          }}
          className="text-sage-600 hover:text-sage-900 p-1"
          aria-label={expandedGuestIds.has(guest.id) ? 'Collapse RSVPs' : 'Expand RSVPs'}
        >
          {expandedGuestIds.has(guest.id) ? '▼' : '▶'}
        </button>
      ),
    },
    {
      key: 'firstName',
      label: 'First Name',
      sortable: true,
    },
    {
      key: 'lastName',
      label: 'Last Name',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value) => value || '-',
    },
    {
      key: 'groupId',
      label: 'Group',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: groups.map(g => ({ label: g.name, value: g.id })),
      render: (value) => {
        const group = groups.find(g => g.id === value);
        return group?.name || '-';
      },
    },
    {
      key: 'guestType',
      label: 'Guest Type',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Wedding Party', value: 'wedding_party' },
        { label: 'Wedding Guest', value: 'wedding_guest' },
        { label: 'Pre-wedding Only', value: 'prewedding_only' },
        { label: 'Post-wedding Only', value: 'postwedding_only' },
      ],
      render: (value) => {
        const labels: Record<string, string> = {
          wedding_party: 'Wedding Party',
          wedding_guest: 'Wedding Guest',
          prewedding_only: 'Pre-wedding Only',
          postwedding_only: 'Post-wedding Only',
        };
        return labels[value] || value;
      },
    },
    {
      key: 'ageType',
      label: 'Age Type',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Adult', value: 'adult' },
        { label: 'Child', value: 'child' },
        { label: 'Senior', value: 'senior' },
      ],
      render: (value) => {
        const labels: Record<string, string> = {
          adult: 'Adult',
          child: 'Child',
          senior: 'Senior',
        };
        return labels[value] || value;
      },
    },
    {
      key: 'airportCode',
      label: 'Airport',
      sortable: true,
      render: (value) => value || '-',
    },
  ];

  // Define form fields - memoized to update when groups change
  const formFields: GuestFormField[] = useMemo(() => [
    {
      name: 'groupId',
      label: 'Group',
      type: 'select',
      required: true,
      options: groups.map(g => ({ label: g.name, value: g.id })),
    },
    {
      name: 'firstName',
      label: 'First Name',
      type: 'text',
      required: true,
      placeholder: 'Enter first name',
    },
    {
      name: 'lastName',
      label: 'Last Name',
      type: 'text',
      required: true,
      placeholder: 'Enter last name',
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
      name: 'ageType',
      label: 'Age Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Adult', value: 'adult' },
        { label: 'Child', value: 'child' },
        { label: 'Senior', value: 'senior' },
      ],
    },
    {
      name: 'guestType',
      label: 'Guest Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Wedding Party', value: 'wedding_party' },
        { label: 'Wedding Guest', value: 'wedding_guest' },
        { label: 'Pre-wedding Only', value: 'prewedding_only' },
        { label: 'Post-wedding Only', value: 'postwedding_only' },
      ],
    },
    {
      name: 'dietaryRestrictions',
      label: 'Dietary Restrictions',
      type: 'textarea',
      required: false,
      placeholder: 'Enter any dietary restrictions',
      rows: 3,
    },
    // Travel Information Section
    {
      name: 'arrivalDate',
      label: 'Arrival Date',
      type: 'date',
      required: false,
    },
    {
      name: 'departureDate',
      label: 'Departure Date',
      type: 'date',
      required: false,
    },
    {
      name: 'airportCode',
      label: 'Airport',
      type: 'select',
      required: false,
      options: [
        { label: 'SJO (San José)', value: 'SJO' },
        { label: 'LIR (Liberia)', value: 'LIR' },
        { label: 'Other', value: 'Other' },
      ],
    },
    {
      name: 'flightNumber',
      label: 'Flight Number',
      type: 'text',
      required: false,
      placeholder: 'Enter flight number',
    },
    // Plus-One Information Section
    {
      name: 'plusOneName',
      label: 'Plus-One Name',
      type: 'text',
      required: false,
      placeholder: 'Enter plus-one name',
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      required: false,
      placeholder: 'Enter any additional notes',
      rows: 3,
    },
  ], [groups]); // Re-create formFields when groups change

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-sage-900">Guest Management</h1>
          <p className="text-sage-600 mt-1">Manage your wedding guest list and groups</p>
        </div>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <Button
              variant="secondary"
              onClick={() => document.getElementById('csv-import-input')?.click()}
              aria-label="Import guests from CSV"
            >
              Import CSV
            </Button>
            <input
              id="csv-import-input"
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
          </label>
          <Button
            variant="secondary"
            onClick={handleExportCSV}
            aria-label="Export guests to CSV"
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Manage Groups Section */}
      <div className="bg-white rounded-lg shadow-sm border border-sage-200">
        {/* Header */}
        <button
          onClick={() => setIsGroupFormOpen(!isGroupFormOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-sage-50 hover:bg-sage-100 transition-colors rounded-t-lg"
          aria-expanded={isGroupFormOpen}
        >
          <div className="flex-1 text-left">
            <h2 className="text-lg font-semibold text-sage-900">Manage Groups</h2>
            <p className="text-sm text-sage-600 mt-1">
              {groups.length} group{groups.length !== 1 ? 's' : ''} • Click to {isGroupFormOpen ? 'collapse' : 'expand'}
            </p>
          </div>
          <span 
            className={`text-sage-600 transition-transform duration-300 ${isGroupFormOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            ▼
          </span>
        </button>

        {/* Collapsible Content */}
        {isGroupFormOpen && (
          <div className="p-4 space-y-4 border-t border-sage-200">
            {/* Add Group Form */}
            <div className="bg-sage-50 p-4 rounded-lg border border-sage-200">
              <h3 className="text-md font-semibold text-sage-900 mb-3">
                {selectedGroup ? 'Edit Group' : 'Add New Group'}
              </h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const formData = new FormData(form);
                  const data = {
                    name: formData.get('name') as string,
                    description: formData.get('description') as string || null,
                  };
                  
                  // Call submit handler
                  await handleGroupSubmit(data);
                  
                  // Reset form only if not editing (editing closes the form)
                  if (!selectedGroup && form) {
                    form.reset();
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label htmlFor="group-name" className="block text-sm font-medium text-sage-700 mb-1">
                    Group Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="group-name"
                    name="name"
                    type="text"
                    required
                    defaultValue={selectedGroup?.name || ''}
                    placeholder="e.g., Smith Family, Bride's Friends"
                    className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jungle-500"
                  />
                </div>
                <div>
                  <label htmlFor="group-description" className="block text-sm font-medium text-sage-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="group-description"
                    name="description"
                    rows={2}
                    defaultValue={selectedGroup?.description || ''}
                    placeholder="Optional description of the group"
                    className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jungle-500"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-jungle-600 text-white rounded-lg hover:bg-jungle-700 transition-colors font-medium shadow-sm"
                  >
                    {selectedGroup ? 'Update Group' : 'Create Group'}
                  </button>
                  {selectedGroup && (
                    <button
                      type="button"
                      onClick={() => setSelectedGroup(null)}
                      className="px-4 py-2 bg-sage-200 text-sage-800 rounded-lg hover:bg-sage-300 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Current Groups List */}
            {groups.length > 0 && (
              <div>
                <h3 className="text-md font-semibold text-sage-900 mb-3">Current Groups</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-sage-200 hover:border-jungle-300 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sage-900 truncate">{group.name}</p>
                        {group.description && (
                          <p className="text-sm text-sage-600 truncate">{group.description}</p>
                        )}
                        {group.guestCount !== undefined && (
                          <p className="text-xs text-sage-500 mt-1">
                            {group.guestCount} guest{group.guestCount !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-3">
                        <button
                          onClick={() => setSelectedGroup(group)}
                          className="text-ocean-600 hover:text-ocean-800 text-sm font-medium"
                          aria-label={`Edit ${group.name}`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleGroupDeleteClick(group)}
                          className="text-volcano-600 hover:text-volcano-800 text-sm font-medium"
                          aria-label={`Delete ${group.name}`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add New Guest Section - Collapsible */}
      <div className="bg-white rounded-lg shadow-sm border border-sage-200">
        {/* Header */}
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-sage-50 hover:bg-sage-100 transition-colors rounded-t-lg"
          aria-expanded={isFormOpen}
        >
          <div className="flex-1 text-left">
            <h2 className="text-lg font-semibold text-sage-900">Add New Guest</h2>
            <p className="text-sm text-sage-600 mt-1">
              Click to {isFormOpen ? 'collapse' : 'expand'}
            </p>
          </div>
          <span 
            className={`text-sage-600 transition-transform duration-300 ${isFormOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            ▼
          </span>
        </button>

        {/* Collapsible Form Content */}
        {isFormOpen && (
          <div className="p-4 border-t border-sage-200">
            <CollapsibleForm
              title={selectedGuest ? 'Edit Guest' : 'Add Guest'}
              fields={formFields}
              schema={selectedGuest ? updateGuestSchema : createGuestSchema}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedGuest(null);
              }}
              initialData={selectedGuest || {}}
              isOpen={true}
              onToggle={() => {}}
              submitLabel={selectedGuest ? 'Update' : 'Create'}
            />
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-sage-200">
        <h2 className="text-lg font-semibold text-sage-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* RSVP Status Filter */}
          <div>
            <label htmlFor="rsvpStatus" className="block text-sm font-medium text-sage-700 mb-1">
              RSVP Status
            </label>
            <select
              id="rsvpStatus"
              value={rsvpStatusFilter}
              onChange={(e) => setRsvpStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-500"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="attending">Attending</option>
              <option value="declined">Declined</option>
              <option value="maybe">Maybe</option>
            </select>
          </div>

          {/* Activity Filter */}
          <div>
            <label htmlFor="activity" className="block text-sm font-medium text-sage-700 mb-1">
              Activity
            </label>
            <select
              id="activity"
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-500"
            >
              <option value="">All</option>
              {activities.map(activity => (
                <option key={activity.id} value={activity.id}>
                  {activity.name}
                </option>
              ))}
            </select>
          </div>

          {/* Transportation Filter */}
          <div>
            <label htmlFor="transportation" className="block text-sm font-medium text-sage-700 mb-1">
              Transportation
            </label>
            <select
              id="transportation"
              value={transportationFilter}
              onChange={(e) => setTransportationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-500"
            >
              <option value="">All</option>
              <option value="true">Has Transportation</option>
              <option value="false">No Transportation</option>
            </select>
          </div>

          {/* Age Group Filter */}
          <div>
            <label htmlFor="ageGroup" className="block text-sm font-medium text-sage-700 mb-1">
              Age Group
            </label>
            <select
              id="ageGroup"
              value={ageGroupFilter}
              onChange={(e) => setAgeGroupFilter(e.target.value)}
              className="w-full px-3 py-2 border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-500"
            >
              <option value="">All</option>
              <option value="adult">Adult</option>
              <option value="child">Child</option>
              <option value="senior">Senior</option>
            </select>
          </div>

          {/* Airport Filter */}
          <div>
            <label htmlFor="airport" className="block text-sm font-medium text-sage-700 mb-1">
              Airport
            </label>
            <select
              id="airport"
              value={airportFilter}
              onChange={(e) => setAirportFilter(e.target.value)}
              className="w-full px-3 py-2 border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-500"
            >
              <option value="">All</option>
              <option value="SJO">SJO (San José)</option>
              <option value="LIR">LIR (Liberia)</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Grouping Options */}
        <div className="mt-4">
          <label htmlFor="grouping" className="block text-sm font-medium text-sage-700 mb-1">
            Group By
          </label>
          <select
            id="grouping"
            value={groupingField}
            onChange={(e) => setGroupingField(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-500"
          >
            <option value="">None</option>
            <option value="groupId">Group</option>
            <option value="guestType">Guest Type</option>
            <option value="ageType">Age Type</option>
            <option value="airportCode">Airport</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        <div className="mt-4">
          <Button
            variant="secondary"
            onClick={() => {
              setRsvpStatusFilter('');
              setActivityFilter('');
              setTransportationFilter('');
              setAgeGroupFilter('');
              setAirportFilter('');
              setGroupingField('');
            }}
          >
            Clear All Filters
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <ComponentErrorBoundary componentName="Guest Table">
        <DataTable
          data={guests}
          columns={columns}
          loading={loading}
          onRowClick={handleRowClick}
          onDelete={handleDeleteClick}
          totalCount={guests.length}
          currentPage={1}
          pageSize={50}
          idField="id"
          selectable={true}
          onBulkDelete={handleBulkDelete}
          entityType="guests"
          showBulkEmail={true}
        />
        
        {/* Inline RSVP Management */}
        {guests.map(guest => (
          expandedGuestIds.has(guest.id) && (
            <div key={`rsvp-${guest.id}`} className="mt-2 p-4 bg-sage-50 rounded-lg border border-sage-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-sage-900">
                  RSVP Management for {guest.firstName} {guest.lastName}
                </h3>
                <button
                  onClick={() => toggleRSVPExpansion(guest.id)}
                  className="text-sm text-sage-600 hover:text-sage-900"
                  aria-label="Close RSVP management"
                >
                  Close
                </button>
              </div>
              <Suspense 
                fallback={
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                    <span className="ml-2 text-gray-600">Loading RSVP editor...</span>
                  </div>
                }
              >
                <InlineRSVPEditor 
                  guestId={guest.id} 
                  onUpdate={fetchGuests}
                />
              </Suspense>
            </div>
          )
        ))}
      </ComponentErrorBoundary>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setGuestToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Guest"
        message={`Are you sure you want to delete ${guestToDelete?.firstName} ${guestToDelete?.lastName}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleteDialogOpen}
        onClose={() => {
          setIsBulkDeleteDialogOpen(false);
          setSelectedGuestIds([]);
        }}
        onConfirm={handleBulkDeleteConfirm}
        title="Delete Multiple Guests"
        message={`Are you sure you want to delete ${selectedGuestIds.length} guest${selectedGuestIds.length > 1 ? 's' : ''}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />

      {/* CSV Import Errors Dialog */}
      {isImportDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-sage-200">
              <h2 className="text-xl font-semibold text-sage-900">CSV Import Errors</h2>
            </div>
            <div className="p-6 overflow-y-auto max-h-96">
              <p className="text-sm text-sage-700 mb-3">
                The following errors were found in your CSV file. Please fix them and try again.
              </p>
              <div className="bg-sage-50 p-4 rounded border border-sage-200 space-y-2">
                {csvImportErrors.map((error, index) => (
                  <div key={index} className="text-sm text-red-600">
                    • {error}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-sage-200 flex justify-end">
              <Button
                variant="primary"
                onClick={() => {
                  setIsImportDialogOpen(false);
                  setCsvImportErrors([]);
                }}
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Group Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isGroupDeleteDialogOpen}
        onClose={() => {
          setIsGroupDeleteDialogOpen(false);
          setGroupToDelete(null);
        }}
        onConfirm={handleGroupDeleteConfirm}
        title="Delete Group"
        message={
          groupToDelete?.guestCount && groupToDelete.guestCount > 0
            ? `Cannot delete "${groupToDelete?.name}" because it has ${groupToDelete.guestCount} guest${groupToDelete.guestCount > 1 ? 's' : ''}. Please reassign or delete the guests first.`
            : `Are you sure you want to delete "${groupToDelete?.name}"? This action cannot be undone.`
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
