'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataTableWithSuspense as DataTable, type ColumnDef } from '@/components/ui/DataTableWithSuspense';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import type { RSVPViewModel, RSVPStatistics, RSVPFilters } from '@/services/rsvpManagementService';

/**
 * RSVPManager Component Props
 */
export interface RSVPManagerProps {
  initialFilters?: RSVPFilters;
}

/**
 * RSVPManager Component
 * 
 * Comprehensive RSVP management interface for admins.
 * 
 * Features:
 * - Tabular view with DataTable
 * - Multi-level filtering (event, activity, status, guest)
 * - Search functionality
 * - Bulk selection and status updates
 * - CSV export
 * - Real-time statistics dashboard
 * - Inline RSVP editing
 * 
 * **Validates: Requirements 6.2, 6.3, 6.4, 6.5**
 */
export function RSVPManager({ initialFilters = {} }: RSVPManagerProps) {
  const { addToast } = useToast();

  // State management
  const [rsvps, setRsvps] = useState<RSVPViewModel[]>([]);
  const [statistics, setStatistics] = useState<RSVPStatistics>({
    totalRSVPs: 0,
    byStatus: { attending: 0, declined: 0, maybe: 0, pending: 0 },
    totalGuestCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkUpdateInProgress, setIsBulkUpdateInProgress] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<RSVPFilters>(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');

  // Reference data for filters
  const [events, setEvents] = useState<Array<{ id: string; name: string }>>([]);
  const [activities, setActivities] = useState<Array<{ id: string; name: string }>>([]);

  /**
   * Fetch RSVPs from API with current filters and pagination
   */
  const fetchRSVPs = useCallback(async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      if (filters.eventId) params.append('eventId', filters.eventId);
      if (filters.activityId) params.append('activityId', filters.activityId);
      if (filters.status) params.append('status', filters.status);
      if (filters.guestId) params.append('guestId', filters.guestId);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/admin/rsvps?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch RSVPs');
      }

      const result = await response.json();

      if (result.success) {
        setRsvps(result.data.data || []);
        setTotalCount(result.data.pagination.total);
        setStatistics(result.data.statistics);
      } else {
        addToast({
          type: 'error',
          message: result.error?.message || 'Failed to load RSVPs',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to load RSVPs',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters, searchQuery, addToast]);

  /**
   * Fetch events for filter dropdown
   */
  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/events');
      if (!response.ok) return;

      const result = await response.json();
      if (result.success) {
        const eventsData = result.data?.events || result.data || [];
        setEvents(Array.isArray(eventsData) ? eventsData : []);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  }, []);

  /**
   * Fetch activities for filter dropdown
   */
  const fetchActivities = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/activities');
      if (!response.ok) return;

      const result = await response.json();
      if (result.success) {
        const activitiesData = result.data?.activities || result.data || [];
        setActivities(Array.isArray(activitiesData) ? activitiesData : []);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  }, []);

  // Load data on mount and when filters/pagination change
  useEffect(() => {
    fetchRSVPs();
  }, [fetchRSVPs]);

  // Load reference data on mount
  useEffect(() => {
    fetchEvents();
    fetchActivities();
  }, [fetchEvents, fetchActivities]);

  /**
   * Handle filter change
   */
  const handleFilterChange = useCallback((key: keyof RSVPFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  /**
   * Handle search
   */
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when search changes
  }, []);

  /**
   * Handle page change
   */
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  /**
   * Handle selection change
   */
  const handleSelectionChange = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  /**
   * Handle bulk status update
   */
  const handleBulkStatusUpdate = useCallback(
    async (status: 'pending' | 'attending' | 'declined' | 'maybe') => {
      if (selectedIds.length === 0) {
        addToast({
          type: 'warning',
          message: 'Please select RSVPs to update',
        });
        return;
      }

      try {
        setIsBulkUpdateInProgress(true);

        const response = await fetch('/api/admin/rsvps/bulk', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rsvpIds: selectedIds,
            status,
          }),
        });

        const result = await response.json();

        if (result.success) {
          addToast({
            type: 'success',
            message: `Successfully updated ${result.data.updatedCount} RSVP${
              result.data.updatedCount !== 1 ? 's' : ''
            }`,
          });

          // Refresh RSVP list
          await fetchRSVPs();

          // Clear selection
          setSelectedIds([]);
        } else {
          addToast({
            type: 'error',
            message: result.error?.message || 'Failed to update RSVPs',
          });
        }
      } catch (error) {
        addToast({
          type: 'error',
          message: error instanceof Error ? error.message : 'Failed to update RSVPs',
        });
      } finally {
        setIsBulkUpdateInProgress(false);
      }
    },
    [selectedIds, addToast, fetchRSVPs]
  );

  /**
   * Handle CSV export
   */
  const handleExport = useCallback(async () => {
    try {
      // Build query parameters with current filters
      const params = new URLSearchParams();
      if (filters.eventId) params.append('eventId', filters.eventId);
      if (filters.activityId) params.append('activityId', filters.activityId);
      if (filters.status) params.append('status', filters.status);
      if (filters.guestId) params.append('guestId', filters.guestId);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/admin/rsvps/export?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to export RSVPs');
      }

      // Get CSV content
      const csv = await response.text();

      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rsvps-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast({
        type: 'success',
        message: 'RSVPs exported successfully',
      });
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to export RSVPs',
      });
    }
  }, [filters, searchQuery, addToast]);

  /**
   * Handle row click - could open inline editor in future
   */
  const handleRowClick = useCallback((rsvp: RSVPViewModel) => {
    // TODO: Implement inline RSVP editing
    console.log('RSVP clicked:', rsvp);
  }, []);

  // Define table columns
  const columns: ColumnDef<RSVPViewModel>[] = useMemo(
    () => [
      {
        key: 'guestFirstName',
        label: 'Guest Name',
        sortable: true,
        render: (_, rsvp) => `${rsvp.guestFirstName} ${rsvp.guestLastName}`,
      },
      {
        key: 'guestEmail',
        label: 'Email',
        sortable: true,
        render: (value) => value || '-',
        mobileHidden: true,
      },
      {
        key: 'eventName',
        label: 'Event',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: events.map((e) => ({ label: e.name, value: e.id })),
        render: (value) => value || '-',
      },
      {
        key: 'activityName',
        label: 'Activity',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: activities.map((a) => ({ label: a.name, value: a.id })),
        render: (value) => value || '-',
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: [
          { label: 'Pending', value: 'pending' },
          { label: 'Attending', value: 'attending' },
          { label: 'Declined', value: 'declined' },
          { label: 'Maybe', value: 'maybe' },
        ],
        render: (value) => {
          const statusColors: Record<string, string> = {
            pending: 'bg-sage-100 text-sage-800',
            attending: 'bg-jungle-100 text-jungle-800',
            declined: 'bg-volcano-100 text-volcano-800',
            maybe: 'bg-sunset-100 text-sunset-800',
          };
          const statusLabels: Record<string, string> = {
            pending: 'Pending',
            attending: 'Attending',
            declined: 'Declined',
            maybe: 'Maybe',
          };
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                statusColors[value] || 'bg-sage-100 text-sage-800'
              }`}
            >
              {statusLabels[value] || value}
            </span>
          );
        },
      },
      {
        key: 'guestCount',
        label: 'Guest Count',
        sortable: true,
        render: (value) => value?.toString() || '1',
        mobileHidden: true,
      },
      {
        key: 'respondedAt',
        label: 'Responded',
        sortable: true,
        render: (value) => {
          if (!value) return '-';
          const date = new Date(value);
          return date.toLocaleDateString();
        },
        mobileHidden: true,
      },
    ],
    [events, activities]
  );

  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total RSVPs */}
        <div className="bg-white rounded-lg shadow-sm border border-sage-200 p-4">
          <div className="text-sm font-medium text-sage-600">Total RSVPs</div>
          <div className="mt-2 text-3xl font-bold text-sage-900">
            {statistics.totalRSVPs}
          </div>
        </div>

        {/* Attending */}
        <div className="bg-white rounded-lg shadow-sm border border-jungle-200 p-4">
          <div className="text-sm font-medium text-jungle-600">Attending</div>
          <div className="mt-2 text-3xl font-bold text-jungle-900">
            {statistics.byStatus.attending}
          </div>
          <div className="mt-1 text-xs text-sage-600">
            {statistics.totalGuestCount} total guests
          </div>
        </div>

        {/* Declined */}
        <div className="bg-white rounded-lg shadow-sm border border-volcano-200 p-4">
          <div className="text-sm font-medium text-volcano-600">Declined</div>
          <div className="mt-2 text-3xl font-bold text-volcano-900">
            {statistics.byStatus.declined}
          </div>
        </div>

        {/* Maybe */}
        <div className="bg-white rounded-lg shadow-sm border border-sunset-200 p-4">
          <div className="text-sm font-medium text-sunset-600">Maybe</div>
          <div className="mt-2 text-3xl font-bold text-sunset-900">
            {statistics.byStatus.maybe}
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-lg shadow-sm border border-sage-200 p-4">
          <div className="text-sm font-medium text-sage-600">Pending</div>
          <div className="mt-2 text-3xl font-bold text-sage-900">
            {statistics.byStatus.pending}
          </div>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-jungle-50 border border-jungle-200 rounded-lg px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-jungle-900">
              {selectedIds.length} RSVP{selectedIds.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleBulkStatusUpdate('attending')}
              disabled={isBulkUpdateInProgress}
            >
              Mark Attending
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleBulkStatusUpdate('maybe')}
              disabled={isBulkUpdateInProgress}
            >
              Mark Maybe
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleBulkStatusUpdate('declined')}
              disabled={isBulkUpdateInProgress}
            >
              Mark Declined
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkStatusUpdate('pending')}
              disabled={isBulkUpdateInProgress}
            >
              Mark Pending
            </Button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        data={rsvps}
        columns={columns}
        loading={loading}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onRowClick={handleRowClick}
        selectable={true}
        onSelectionChange={handleSelectionChange}
        idField="id"
        entityType="RSVPs"
        onBulkExport={handleExport}
      />
    </div>
  );
}
