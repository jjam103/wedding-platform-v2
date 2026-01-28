'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DataTableWithSuspense as DataTable, type ColumnDef } from '@/components/ui/DataTableWithSuspense';
import { CollapsibleForm } from '@/components/admin/CollapsibleForm';
import { LocationSelector } from '@/components/admin/LocationSelector';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/ToastContext';
import type { Event } from '@/schemas/eventSchemas';
import { createEventSchema, updateEventSchema } from '@/schemas/eventSchemas';
import type { FormField } from '@/components/ui/DynamicForm';
import { useRouter } from 'next/navigation';

interface Location {
  id: string;
  name: string;
  parentLocationId?: string | null;
}

/**
 * Event Management Page
 * 
 * Provides CRUD interface for managing wedding events with collapsible forms.
 * Features:
 * - Data table with sorting, filtering, and search
 * - Collapsible inline form for create/edit operations
 * - LocationSelector with hierarchical location support
 * - Scheduling conflict detection
 * - Section editor integration
 * - Delete confirmation dialog
 * - Toast notifications for success/error feedback
 * - Real-time data refresh after operations
 * 
 * Requirements: 6.1-6.8, 28.1-28.8
 */
export default function EventsPage() {
  const { addToast } = useToast();
  const router = useRouter();
  
  // State management
  const [events, setEvents] = useState<Event[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [conflictError, setConflictError] = useState<string | null>(null);
  
  // Ref for scrolling to newly created event
  const newEventRef = useRef<string | null>(null);

  /**
   * Fetch events from API
   */
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const result = await response.json();
      if (result.success) {
        setEvents(result.data.events || []);
      } else {
        addToast({
          type: 'error',
          message: result.error?.message || 'Failed to load events',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to load events',
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
        setLocations(result.data.locations || []);
      }
    } catch (error) {
      // Silently fail for locations - not critical
      console.error('Failed to fetch locations:', error);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchEvents();
    fetchLocations();
  }, [fetchEvents, fetchLocations]);

  /**
   * Handle row click - open edit form
   */
  const handleRowClick = useCallback((event: Event) => {
    setSelectedEvent(event);
    setSelectedLocationId(event.locationId || '');
    setConflictError(null);
    setIsFormOpen(true);
  }, []);

  /**
   * Handle add event button click
   */
  const handleAddEvent = useCallback(() => {
    setSelectedEvent(null);
    setSelectedLocationId('');
    setConflictError(null);
    setIsFormOpen(true);
  }, []);

  /**
   * Handle delete button click
   */
  const handleDeleteClick = useCallback((event: Event) => {
    setEventToDelete(event);
    setIsDeleteDialogOpen(true);
  }, []);

  /**
   * Handle manage sections button click
   */
  const handleManageSections = useCallback((event: Event) => {
    // Navigate to section editor for this event
    router.push(`/admin/events/${event.id}/sections`);
  }, [router]);

  /**
   * Handle form submission (create or update)
   */
  const handleSubmit = useCallback(async (data: any) => {
    try {
      setConflictError(null);
      const isEdit = !!selectedEvent;
      
      // Add selected location to data
      const submitData = {
        ...data,
        locationId: selectedLocationId || null,
      };
      
      const url = isEdit ? `/api/admin/events/${selectedEvent.id}` : '/api/admin/events';
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
          message: isEdit ? 'Event updated successfully' : 'Event created successfully',
        });
        
        // Store new event ID for scrolling
        if (!isEdit && result.data?.id) {
          newEventRef.current = result.data.id;
        }
        
        // Refresh event list
        await fetchEvents();
        
        // Close form
        setIsFormOpen(false);
        setSelectedEvent(null);
        setSelectedLocationId('');
        
        // Scroll to new event after a short delay
        if (newEventRef.current) {
          setTimeout(() => {
            const element = document.querySelector(`[data-row-id="${newEventRef.current}"]`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            newEventRef.current = null;
          }, 100);
        }
      } else {
        // Check for scheduling conflict
        if (result.error?.code === 'SCHEDULING_CONFLICT') {
          const conflicts = result.error.details || [];
          const conflictMessages = conflicts.map((c: any) => 
            `"${c.name}" (${new Date(c.startDate).toLocaleString()})`
          ).join(', ');
          setConflictError(
            `This event conflicts with existing events at this location: ${conflictMessages}`
          );
        } else {
          addToast({
            type: 'error',
            message: result.error?.message || 'Operation failed',
          });
        }
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Operation failed',
      });
    }
  }, [selectedEvent, selectedLocationId, addToast, fetchEvents, router]);

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!eventToDelete) return;

    try {
      const response = await fetch(`/api/admin/events/${eventToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        addToast({
          type: 'success',
          message: 'Event deleted successfully',
        });
        
        // Refresh event list
        await fetchEvents();
        
        // Close dialog
        setIsDeleteDialogOpen(false);
        setEventToDelete(null);
      } else {
        addToast({
          type: 'error',
          message: result.error?.message || 'Failed to delete event',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete event',
      });
    }
  }, [eventToDelete, addToast, fetchEvents]);

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

  /**
   * Format time for display
   */
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Define table columns
  const columns: ColumnDef<Event>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'startDate',
      label: 'Date',
      sortable: true,
      render: (value) => formatDate(value as string),
    },
    {
      key: 'startTime',
      label: 'Time',
      sortable: false,
      render: (value, row) => formatTime((row as Event).startDate),
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
        // Map event status to StatusBadge status types
        const statusMap: Record<string, 'event-active' | 'event-inactive'> = {
          published: 'event-active',
          draft: 'event-inactive',
        };
        return <StatusBadge status={statusMap[value as string] || 'event-inactive'} />;
      },
    },
    {
      key: 'eventType',
      label: 'Type',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Ceremony', value: 'ceremony' },
        { label: 'Reception', value: 'reception' },
        { label: 'Pre-wedding', value: 'pre_wedding' },
        { label: 'Post-wedding', value: 'post_wedding' },
      ],
      render: (value) => {
        const labels: Record<string, string> = {
          ceremony: 'Ceremony',
          reception: 'Reception',
          pre_wedding: 'Pre-wedding',
          post_wedding: 'Post-wedding',
        };
        return labels[value as string] || value;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/guest/events/${(row as Event).id}`;
            }}
          >
            View
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleManageSections(row as Event);
            }}
          >
            Manage Sections
          </Button>
        </div>
      ),
    },
  ];

  // Define form fields
  const formFields: FormField[] = [
    {
      name: 'name',
      label: 'Event Name',
      type: 'text',
      required: true,
      placeholder: 'Enter event name',
    },
    {
      name: 'eventType',
      label: 'Event Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Ceremony', value: 'ceremony' },
        { label: 'Reception', value: 'reception' },
        { label: 'Pre-wedding', value: 'pre_wedding' },
        { label: 'Post-wedding', value: 'post_wedding' },
      ],
    },
    {
      name: 'description',
      label: 'Description',
      type: 'richtext',
      required: false,
      placeholder: 'Enter event description',
      helpText: 'Rich text editor for detailed event description',
    },
    {
      name: 'startDate',
      label: 'Start Date & Time',
      type: 'datetime',
      required: true,
    },
    {
      name: 'endDate',
      label: 'End Date & Time',
      type: 'datetime',
      required: false,
      helpText: 'Optional end date for multi-day events',
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
    {
      name: 'rsvpRequired',
      label: 'RSVP Required',
      type: 'checkbox',
      required: false,
    },
    {
      name: 'rsvpDeadline',
      label: 'RSVP Deadline',
      type: 'datetime',
      required: false,
      helpText: 'Deadline for guests to RSVP',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-sage-900">Event Management</h1>
          <p className="text-sage-600 mt-1">Manage your wedding events</p>
        </div>
        <Button
          variant="primary"
          onClick={handleAddEvent}
          aria-label="Create new event"
          data-action="add-new"
        >
          + Add Event
        </Button>
      </div>

      {/* Collapsible Form */}
      <CollapsibleForm
        isOpen={isFormOpen}
        onToggle={() => {
          setIsFormOpen(!isFormOpen);
          if (isFormOpen) {
            setSelectedEvent(null);
            setSelectedLocationId('');
            setConflictError(null);
          }
        }}
        title={selectedEvent ? 'Edit Event' : 'Add New Event'}
        fields={formFields}
        schema={selectedEvent ? updateEventSchema : createEventSchema}
        onSubmit={handleSubmit}
        onCancel={() => {
          setIsFormOpen(false);
          setSelectedEvent(null);
          setSelectedLocationId('');
          setConflictError(null);
        }}
        initialData={selectedEvent || {}}
        submitLabel={selectedEvent ? 'Update Event' : 'Create Event'}
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
            placeholder="Select event location"
          />
          <p className="mt-1 text-sm text-sage-500">
            Select the location where this event will take place
          </p>
        </div>
        
        {/* Conflict Error Display */}
        {conflictError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Scheduling Conflict</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{conflictError}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CollapsibleForm>

      {/* Data Table */}
      <DataTable
        data={events}
        columns={columns}
        loading={loading}
        onRowClick={handleRowClick}
        onDelete={handleDeleteClick}
        totalCount={events.length}
        currentPage={1}
        pageSize={25}
        idField="id"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setEventToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Event"
        message={`Are you sure you want to delete "${eventToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
