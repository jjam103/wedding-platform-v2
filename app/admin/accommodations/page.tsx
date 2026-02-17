'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DataTableWithSuspense as DataTable, type ColumnDef } from '@/components/ui/DataTableWithSuspense';
import { CollapsibleForm } from '@/components/admin/CollapsibleForm';
import { InlineSectionEditor } from '@/components/admin/InlineSectionEditor';
import { LocationSelector } from '@/components/admin/LocationSelector';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import type { Accommodation } from '@/schemas/accommodationSchemas';
import { createAccommodationSchema, updateAccommodationSchema } from '@/schemas/accommodationSchemas';
import type { FormField } from '@/components/ui/DynamicForm';
import { useRouter } from 'next/navigation';

interface Location {
  id: string;
  name: string;
  parentLocationId?: string | null;
}

interface Event {
  id: string;
  name: string;
  slug?: string | null;
}

/**
 * Accommodation Management Page
 * 
 * Provides CRUD interface for managing wedding accommodations with collapsible forms.
 * Features:
 * - Data table with sorting, filtering, and search
 * - Collapsible inline form for create/edit operations
 * - LocationSelector with hierarchical location support
 * - Room types management navigation
 * - Section editor integration
 * - Delete confirmation dialog
 * - Toast notifications for success/error feedback
 * - Real-time data refresh after operations
 * 
 * Requirements: 10.1-10.7, 28.1-28.8
 */
export default function AccommodationsPage() {
  const { addToast } = useToast();
  const router = useRouter();
  
  // State management
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null);
  const [accommodationToDelete, setAccommodationToDelete] = useState<Accommodation | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  
  // Ref for scrolling to newly created accommodation
  const newAccommodationRef = useRef<string | null>(null);

  /**
   * Fetch accommodations from API
   */
  const fetchAccommodations = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/accommodations');
      if (!response.ok) {
        throw new Error('Failed to fetch accommodations');
      }

      const result = await response.json();
      if (result.success) {
        setAccommodations(result.data.accommodations || []);
      } else {
        addToast({
          type: 'error',
          message: result.error?.message || 'Failed to load accommodations',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to load accommodations',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  /**
   * Fetch locations for dropdown
   */
  const fetchLocations = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/locations');
      if (!response.ok) {
        return;
      }

      const result = await response.json();
      if (result.success) {
        setLocations(result.data || []);
      }
    } catch (error) {
      // Silently fail for locations - not critical
      console.error('Failed to fetch locations:', error);
    }
  }, []);

  /**
   * Fetch events for dropdown
   */
  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/events');
      if (!response.ok) {
        return;
      }

      const result = await response.json();
      if (result.success) {
        setEvents(result.data.events || []);
      }
    } catch (error) {
      // Silently fail for events - not critical
      console.error('Failed to fetch events:', error);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchAccommodations();
    fetchLocations();
    fetchEvents();
  }, [fetchAccommodations, fetchLocations, fetchEvents]);

  /**
   * Handle row click - open edit form
   */
  const handleRowClick = useCallback((accommodation: Accommodation) => {
    setSelectedAccommodation(accommodation);
    setSelectedLocationId(accommodation.locationId || '');
    setIsFormOpen(true);
  }, []);

  /**
   * Handle add accommodation button click
   */
  const handleAddAccommodation = useCallback(() => {
    setSelectedAccommodation(null);
    setSelectedLocationId('');
    setIsFormOpen(true);
  }, []);

  /**
   * Handle delete button click
   */
  const handleDeleteClick = useCallback((accommodation: Accommodation) => {
    setAccommodationToDelete(accommodation);
    setIsDeleteDialogOpen(true);
  }, []);

  /**
   * Handle room types button click
   */
  const handleRoomTypes = useCallback((accommodation: Accommodation) => {
    // Navigate to room types page for this accommodation
    router.push(`/admin/accommodations/${accommodation.id}/room-types`);
  }, [router]);

  /**
   * Handle form submission (create or update)
   */
  const handleSubmit = useCallback(async (data: any) => {
    try {
      const isEdit = !!selectedAccommodation;
      
      // Add selected location to data
      const submitData = {
        ...data,
        locationId: selectedLocationId || null,
      };
      
      const url = isEdit ? `/api/admin/accommodations/${selectedAccommodation.id}` : '/api/admin/accommodations';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.success) {
        addToast({
          type: 'success',
          message: isEdit ? 'Accommodation updated successfully' : 'Accommodation created successfully',
        });
        
        // Store new accommodation ID for scrolling
        if (!isEdit && result.data?.id) {
          newAccommodationRef.current = result.data.id;
        }
        
        // Refresh accommodation list with a small delay to ensure database commit
        await new Promise(resolve => setTimeout(resolve, 100));
        await fetchAccommodations();
        
        // Close form
        setIsFormOpen(false);
        setSelectedAccommodation(null);
        setSelectedLocationId('');
        
        // Scroll to new accommodation after a short delay
        if (newAccommodationRef.current) {
          setTimeout(() => {
            const element = document.querySelector(`[data-row-id="${newAccommodationRef.current}"]`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            newAccommodationRef.current = null;
          }, 100);
        }
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
  }, [selectedAccommodation, selectedLocationId, addToast, fetchAccommodations]);

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!accommodationToDelete) return;

    try {
      const response = await fetch(`/api/admin/accommodations/${accommodationToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        addToast({
          type: 'success',
          message: 'Accommodation deleted successfully',
        });
        
        // Refresh accommodation list
        await fetchAccommodations();
        
        // Close dialog
        setIsDeleteDialogOpen(false);
        setAccommodationToDelete(null);
      } else {
        addToast({
          type: 'error',
          message: result.error?.message || 'Failed to delete accommodation',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete accommodation',
      });
    }
  }, [accommodationToDelete, addToast, fetchAccommodations]);

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Define table columns
  const columns: ColumnDef<Accommodation>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'locationId',
      label: 'Location',
      sortable: true,
      render: (value) => {
        if (!value) return '-';
        const location = locations.find(l => l.id === value);
        return location?.name || '-';
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
      key: 'checkInDate',
      label: 'Check-in',
      sortable: true,
      render: (value) => value ? formatDate(value as string) : '-',
    },
    {
      key: 'checkOutDate',
      label: 'Check-out',
      sortable: true,
      render: (value) => value ? formatDate(value as string) : '-',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      render: (value) => {
        const labels: Record<string, string> = {
          draft: 'Draft',
          published: 'Published',
        };
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              value === 'draft'
                ? 'bg-sage-100 text-sage-800'
                : 'bg-jungle-100 text-jungle-800'
            }`}
          >
            {labels[value as string] || value}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => {
        const accommodation = row as Accommodation;
        
        return (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`/accommodation/${accommodation.slug || accommodation.id}`, '_blank');
              }}
              title="View accommodation detail page"
            >
              View
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRoomTypes(accommodation);
              }}
            >
              Room Types
            </Button>
          </div>
        );
      },
    },
  ];

  // Define form fields
  const formFields: FormField[] = [
    {
      name: 'name',
      label: 'Accommodation Name',
      type: 'text',
      required: true,
      placeholder: 'Enter accommodation name',
    },
    {
      name: 'address',
      label: 'Address',
      type: 'text',
      required: false,
      placeholder: 'Enter address',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'richtext',
      required: false,
      placeholder: 'Enter accommodation description',
      helpText: 'Rich text editor for detailed accommodation description',
    },
    {
      name: 'checkInDate',
      label: 'Check-in Date',
      type: 'date',
      required: false,
      helpText: 'Default check-in date for this accommodation',
    },
    {
      name: 'checkOutDate',
      label: 'Check-out Date',
      type: 'date',
      required: false,
      helpText: 'Default check-out date for this accommodation',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-sage-900">Accommodation Management</h1>
          <p className="text-sage-600 mt-1">Manage wedding accommodations and lodging</p>
        </div>
        <Button
          variant="primary"
          onClick={handleAddAccommodation}
          aria-label="Create new accommodation"
          data-action="add-new"
        >
          + Add Accommodation
        </Button>
      </div>

      {/* Collapsible Form */}
      <CollapsibleForm
        isOpen={isFormOpen}
        onToggle={() => {
          setIsFormOpen(!isFormOpen);
          if (isFormOpen) {
            setSelectedAccommodation(null);
            setSelectedLocationId('');
          }
        }}
        title={selectedAccommodation ? 'Edit Accommodation' : 'Add New Accommodation'}
        fields={formFields}
        schema={selectedAccommodation ? updateAccommodationSchema : createAccommodationSchema}
        onSubmit={handleSubmit}
        onCancel={() => {
          setIsFormOpen(false);
          setSelectedAccommodation(null);
          setSelectedLocationId('');
        }}
        initialData={selectedAccommodation || {}}
        submitLabel={selectedAccommodation ? 'Update Accommodation' : 'Create Accommodation'}
      >
        {/* Location Selector - Custom field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-sage-700 mb-2">
            Location
          </label>
          <LocationSelector
            locations={locations}
            selectedLocationId={selectedLocationId}
            onSelect={setSelectedLocationId}
            placeholder="Select accommodation location"
          />
          <p className="mt-1 text-sm text-sage-500">
            Select the location where this accommodation is situated
          </p>
        </div>
      </CollapsibleForm>

      {/* Inline Section Editor - Shows when editing an existing accommodation */}
      {isFormOpen && selectedAccommodation && (
        <InlineSectionEditor
          pageType="accommodation"
          pageId={selectedAccommodation.id}
          entityName={selectedAccommodation.name}
          defaultExpanded={false}
        />
      )}

      {/* Data Table */}
      <DataTable
        data={accommodations}
        columns={columns}
        loading={loading}
        onRowClick={handleRowClick}
        onDelete={handleDeleteClick}
        totalCount={accommodations.length}
        currentPage={1}
        pageSize={25}
        idField="id"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setAccommodationToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Accommodation"
        message={`Are you sure you want to delete "${accommodationToDelete?.name}"? This will also remove all associated room types. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
