'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { DataTableWithSuspense as DataTable, type ColumnDef } from '@/components/ui/DataTableWithSuspense';
import { CollapsibleForm } from '@/components/admin/CollapsibleForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/ToastContext';
import type { Activity } from '@/schemas/activitySchemas';
import { createActivitySchema, updateActivitySchema } from '@/schemas/activitySchemas';
import type { FormField } from '@/components/ui/DynamicForm';
import { useRouter } from 'next/navigation';

interface Event {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
}

interface ActivityWithCapacity extends Activity {
  currentRsvps?: number;
  utilizationPercentage?: number;
}

/**
 * Activity Management Page
 * 
 * Provides CRUD interface for managing wedding activities.
 * Features:
 * - Data table with sorting, filtering, and search
 * - Capacity tracking with warning indicators (90%+ warning, 100% alert)
 * - Collapsible form for create/edit operations
 * - "Manage Sections" button for section editor integration
 * - Delete confirmation dialog
 * - Toast notifications for success/error feedback
 * - Real-time data refresh after operations
 * 
 * Requirements: 7.1-7.10, 28.1-28.8
 */
export default function ActivitiesPage() {
  const { addToast } = useToast();
  const router = useRouter();
  
  // State management
  const [activities, setActivities] = useState<ActivityWithCapacity[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityWithCapacity | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<ActivityWithCapacity | null>(null);

  /**
   * Fetch activities from API with capacity information
   */
  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch activities
      const response = await fetch('/api/admin/activities');
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const result = await response.json();
      if (result.success) {
        const activitiesData = result.data.activities || [];
        
        // Fetch capacity info for each activity
        const activitiesWithCapacity = await Promise.all(
          activitiesData.map(async (activity: Activity) => {
            try {
              const capacityResponse = await fetch(`/api/admin/activities/${activity.id}/capacity`);
              if (capacityResponse.ok) {
                const capacityResult = await capacityResponse.json();
                if (capacityResult.success) {
                  return {
                    ...activity,
                    currentRsvps: capacityResult.data.currentAttendees,
                    utilizationPercentage: capacityResult.data.utilizationPercentage,
                  };
                }
              }
            } catch (error) {
              // Silently fail for capacity info - not critical
              console.error('Failed to fetch capacity for activity:', activity.id, error);
            }
            return activity;
          })
        );
        
        setActivities(activitiesWithCapacity);
      } else {
        addToast({
          type: 'error',
          message: result.error?.message || 'Failed to load activities',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to load activities',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

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
    fetchActivities();
    fetchEvents();
    fetchLocations();
  }, [fetchActivities, fetchEvents, fetchLocations]);

  /**
   * Handle row click - open edit form
   */
  const handleRowClick = useCallback((activity: ActivityWithCapacity) => {
    setSelectedActivity(activity);
    setIsFormOpen(true);
  }, []);

  /**
   * Handle add activity button click
   */
  const handleAddActivity = useCallback(() => {
    setSelectedActivity(null);
    setIsFormOpen(true);
  }, []);

  /**
   * Handle manage sections button click
   */
  const handleManageSections = useCallback((activity: ActivityWithCapacity) => {
    router.push(`/admin/activities/${activity.id}/sections`);
  }, [router]);

  /**
   * Handle delete button click
   */
  const handleDeleteClick = useCallback((activity: ActivityWithCapacity) => {
    setActivityToDelete(activity);
    setIsDeleteDialogOpen(true);
  }, []);

  /**
   * Handle form submission (create or update)
   */
  const handleSubmit = useCallback(async (data: any) => {
    try {
      const isEdit = !!selectedActivity;
      const url = isEdit ? `/api/admin/activities/${selectedActivity.id}` : '/api/admin/activities';
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
          message: isEdit ? 'Activity updated successfully' : 'Activity created successfully',
        });
        
        // Refresh activity list
        await fetchActivities();
        
        // Close form
        setIsFormOpen(false);
        setSelectedActivity(null);
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
  }, [selectedActivity, addToast, fetchActivities]);

  /**
   * Handle form cancel
   */
  const handleCancel = useCallback(() => {
    setIsFormOpen(false);
    setSelectedActivity(null);
  }, []);

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!activityToDelete) return;

    try {
      const response = await fetch(`/api/admin/activities/${activityToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        addToast({
          type: 'success',
          message: 'Activity deleted successfully',
        });
        
        // Refresh activity list
        await fetchActivities();
        
        // Close dialog
        setIsDeleteDialogOpen(false);
        setActivityToDelete(null);
      } else {
        addToast({
          type: 'error',
          message: result.error?.message || 'Failed to delete activity',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete activity',
      });
    }
  }, [activityToDelete, addToast, fetchActivities]);

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
  const columns: ColumnDef<ActivityWithCapacity>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'eventId',
      label: 'Event',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'No event', value: '' },
        ...events.map(e => ({ label: e.name, value: e.id })),
      ],
      render: (value) => {
        if (!value) return '-';
        const event = events.find(e => e.id === value);
        return event?.name || '-';
      },
    },
    {
      key: 'startTime',
      label: 'Date',
      sortable: true,
      render: (value) => formatDate(value as string),
    },
    {
      key: 'startTime_time' as any,
      label: 'Time',
      sortable: false,
      render: (value, row) => formatTime(row.startTime as string),
    },
    {
      key: 'capacity',
      label: 'Capacity',
      sortable: true,
      render: (value, row) => {
        if (value === null || value === undefined) return 'Unlimited';
        const current = row.currentRsvps || 0;
        const percentage = row.utilizationPercentage || 0;
        
        // Determine capacity status badge
        let capacityStatus: 'capacity-normal' | 'capacity-warning' | 'capacity-alert' = 'capacity-normal';
        if (percentage >= 100) {
          capacityStatus = 'capacity-alert';
        } else if (percentage >= 90) {
          capacityStatus = 'capacity-warning';
        }
        
        return (
          <div className="flex items-center gap-2">
            <span>{current}/{value} ({percentage.toFixed(0)}%)</span>
            {percentage >= 90 && <StatusBadge status={capacityStatus} />}
          </div>
        );
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
        const labels: Record<string, string> = {
          draft: 'Draft',
          published: 'Published',
        };
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              value === 'published'
                ? 'bg-jungle-100 text-jungle-800'
                : 'bg-sage-100 text-sage-800'
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
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/guest/activities/${(row as ActivityWithCapacity).id}`;
            }}
          >
            View
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleManageSections(row as ActivityWithCapacity);
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
      label: 'Activity Name',
      type: 'text',
      required: true,
      placeholder: 'Enter activity name',
    },
    {
      name: 'activityType',
      label: 'Activity Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Ceremony', value: 'ceremony' },
        { label: 'Reception', value: 'reception' },
        { label: 'Meal', value: 'meal' },
        { label: 'Transport', value: 'transport' },
        { label: 'Activity', value: 'activity' },
      ],
    },
    {
      name: 'description',
      label: 'Description',
      type: 'richtext',
      required: false,
      placeholder: 'Enter activity description',
      helpText: 'Rich text editor for detailed activity description',
    },
    {
      name: 'eventId',
      label: 'Event',
      type: 'select',
      required: false,
      options: [
        { label: 'No event', value: '' },
        ...events.map(e => ({ label: e.name, value: e.id })),
      ],
    },
    {
      name: 'startTime',
      label: 'Start Date & Time',
      type: 'datetime',
      required: true,
    },
    {
      name: 'endTime',
      label: 'End Date & Time',
      type: 'datetime',
      required: false,
      helpText: 'Optional end time for the activity',
    },
    {
      name: 'locationId',
      label: 'Location',
      type: 'select',
      required: false,
      options: [
        { label: 'No location', value: '' },
        ...locations.map(l => ({ label: l.name, value: l.id })),
      ],
    },
    {
      name: 'capacity',
      label: 'Capacity',
      type: 'number',
      required: false,
      placeholder: 'Leave empty for unlimited',
      helpText: selectedActivity && selectedActivity.utilizationPercentage !== undefined
        ? `Current utilization: ${selectedActivity.utilizationPercentage.toFixed(0)}% (${selectedActivity.currentRsvps || 0} RSVPs)`
        : undefined,
    },
    {
      name: 'costPerPerson',
      label: 'Cost Per Person ($)',
      type: 'number',
      required: false,
      placeholder: '0.00',
    },
    {
      name: 'hostSubsidy',
      label: 'Host Subsidy ($)',
      type: 'number',
      required: false,
      placeholder: '0.00',
      helpText: 'Amount the host will subsidize per person',
    },
    {
      name: 'adultsOnly',
      label: 'Adults Only',
      type: 'checkbox',
      required: false,
    },
    {
      name: 'plusOneAllowed',
      label: 'Plus-One Allowed',
      type: 'checkbox',
      required: false,
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
          <h1 className="text-3xl font-bold text-sage-900">Activity Management</h1>
          <p className="text-sage-600 mt-1">Manage your wedding activities</p>
        </div>
      </div>

      {/* Collapsible Add Activity Form */}
      <CollapsibleForm
        title={selectedActivity ? 'Edit Activity' : 'Add Activity'}
        fields={formFields}
        schema={selectedActivity ? updateActivitySchema : createActivitySchema}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        initialData={selectedActivity || {}}
        isOpen={isFormOpen}
        onToggle={() => {
          if (!isFormOpen) {
            setSelectedActivity(null);
          }
          setIsFormOpen(!isFormOpen);
        }}
        submitLabel={selectedActivity ? 'Update Activity' : 'Create Activity'}
      />

      {/* Data Table */}
      <DataTable
        data={activities}
        columns={columns}
        loading={loading}
        onRowClick={handleRowClick}
        onDelete={handleDeleteClick}
        totalCount={activities.length}
        currentPage={1}
        pageSize={25}
        idField="id"
        rowClassName={(row) => {
          // Highlight rows at 90%+ capacity in warning color
          if (row.utilizationPercentage && row.utilizationPercentage >= 90) {
            return 'bg-volcano-50 hover:bg-volcano-100';
          }
          return '';
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setActivityToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Activity"
        message={`Are you sure you want to delete "${activityToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
