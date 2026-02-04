'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { DataTableWithSuspense as DataTable, type ColumnDef } from '@/components/ui/DataTableWithSuspense';
import { CollapsibleForm } from '@/components/admin/CollapsibleForm';
import { SectionEditor } from '@/components/admin/SectionEditor';
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
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

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
        setLocations(result.data || []);
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
  }, [fetchActivities, fetchLocations]); // Removed fetchEvents from dependencies

  /**
   * Handle toggle sections
   */
  const handleToggleSections = useCallback((activityId: string) => {
    setExpandedActivityId(prev => prev === activityId ? null : activityId);
  }, []);

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
   * Handle bulk delete
   */
  const handleBulkDelete = useCallback(async (ids: string[]) => {
    if (!ids || ids.length === 0) return;

    try {
      const response = await fetch('/api/admin/activities/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      const result = await response.json();

      if (result.success) {
        addToast({
          type: 'success',
          message: result.data.message || `Successfully deleted ${ids.length} activity/activities`,
        });
        
        // Clear selection
        setSelectedIds([]);
        
        // Refresh activity list
        await fetchActivities();
        
        // Close dialog
        setIsBulkDeleteDialogOpen(false);
      } else {
        addToast({
          type: 'error',
          message: result.error?.message || 'Failed to delete activities',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete activities',
      });
    }
  }, [addToast, fetchActivities]);

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
        const percentage = row.utilizationPercentage ?? 0;
        
        // Determine capacity status badge
        let capacityStatus: 'capacity-normal' | 'capacity-warning' | 'capacity-alert' = 'capacity-normal';
        if (percentage >= 100) {
          capacityStatus = 'capacity-alert';
        } else if (percentage >= 90) {
          capacityStatus = 'capacity-warning';
        }
        
        return (
          <div className="flex items-center gap-2">
            <span>{current}/{value} ({(percentage ?? 0).toFixed(0)}%)</span>
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
      render: (_, row) => {
        const activity = row as Activity;
        return (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                const slug = activity.slug || activity.id;
                window.open(`/activity/${slug}`, '_blank');
              }}
              title="View activity detail page"
            >
              View
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleSections(activity.id);
              }}
            >
              {expandedActivityId === activity.id ? 'Hide Sections' : 'Sections'}
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
      type: 'datetime-local',
      required: true,
    },
    {
      name: 'endTime',
      label: 'End Date & Time',
      type: 'datetime-local',
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
      helpText: selectedActivity && selectedActivity.utilizationPercentage !== undefined && selectedActivity.utilizationPercentage !== null
        ? `Current utilization: ${(selectedActivity.utilizationPercentage ?? 0).toFixed(0)}% (${selectedActivity.currentRsvps || 0} RSVPs)`
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

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="text-sm text-blue-800">
            {selectedIds.length} activity/activities selected
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setSelectedIds([])}
            >
              Clear Selection
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => setIsBulkDeleteDialogOpen(true)}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-jungle-50 border border-jungle-200 rounded-lg p-4 flex items-center justify-between">
          <div className="text-sm text-jungle-800">
            {selectedIds.length} {selectedIds.length === 1 ? 'activity' : 'activities'} selected
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedIds([])}
            >
              Clear Selection
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsBulkDeleteDialogOpen(true)}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Activities List with Inline Sections */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading activities...</div>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No activities yet</p>
          <Button onClick={handleAddActivity} variant="primary" size="sm">
            Create First Activity
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const event = events.find(e => e.id === activity.eventId);
            const utilizationPercentage = activity.utilizationPercentage ?? 0;
            
            return (
              <div key={activity.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                {/* Activity row */}
                <div className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Checkbox for bulk selection */}
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(activity.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds([...selectedIds, activity.id]);
                        } else {
                          setSelectedIds(selectedIds.filter(id => id !== activity.id));
                        }
                      }}
                      className="h-4 w-4 text-jungle-600 focus:ring-jungle-500 border-gray-300 rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{activity.name}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {event?.name || 'No event'} • {formatDate(activity.startTime)} at {formatTime(activity.startTime)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {activity.capacity && (
                        <div className="text-sm">
                          <span className={utilizationPercentage >= 90 ? 'text-volcano-700 font-medium' : 'text-gray-600'}>
                            {activity.currentRsvps || 0}/{activity.capacity} ({(utilizationPercentage ?? 0).toFixed(0)}%)
                          </span>
                        </div>
                      )}
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          activity.status === 'published'
                            ? 'bg-jungle-100 text-jungle-800'
                            : 'bg-sage-100 text-sage-800'
                        }`}
                      >
                        {activity.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const slug = activity.slug || activity.id;
                        window.open(`/activity/${slug}`, '_blank');
                      }}
                      title="View activity detail page"
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleRowClick(activity)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleToggleSections(activity.id)}
                    >
                      {expandedActivityId === activity.id ? '▼ Hide Sections' : '▶ Sections'}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteClick(activity)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Sections editor - appears inline below the activity row */}
                {expandedActivityId === activity.id && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <SectionEditor
                      pageType="activity"
                      pageId={activity.id}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleteDialogOpen}
        onClose={() => setIsBulkDeleteDialogOpen(false)}
        onConfirm={() => handleBulkDelete(selectedIds)}
        title="Delete Multiple Activities"
        message={`Are you sure you want to delete ${selectedIds.length} activity/activities? This action cannot be undone.`}
        confirmLabel="Delete All"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
