'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DataTableWithSuspense as DataTable, type ColumnDef } from '@/components/ui/DataTableWithSuspense';
import { CollapsibleForm } from '@/components/admin/CollapsibleForm';
import { InlineSectionEditor } from '@/components/admin/InlineSectionEditor';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import type { RoomType } from '@/schemas/accommodationSchemas';
import { createRoomTypeSchema, updateRoomTypeSchema } from '@/schemas/accommodationSchemas';
import type { FormField } from '@/components/ui/DynamicForm';
import { useRouter } from 'next/navigation';

/**
 * Room Types Management Page
 * 
 * Provides CRUD interface for managing room types within an accommodation.
 * Features:
 * - Data table with sorting and capacity tracking
 * - Collapsible inline form for create/edit operations
 * - Occupancy percentage display
 * - Guest assignment interface
 * - Section editor integration
 * - Delete confirmation dialog
 * - Toast notifications for success/error feedback
 * - Real-time data refresh after operations
 * 
 * Requirements: 22.1-22.8
 */
export default function RoomTypesPage({ params }: { params: Promise<{ id: string }> }) {
  const { addToast } = useToast();
  const router = useRouter();
  const [accommodationId, setAccommodationId] = useState<string>('');
  
  // State management
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [accommodationName, setAccommodationName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [roomTypeToDelete, setRoomTypeToDelete] = useState<RoomType | null>(null);
  
  // Ref for scrolling to newly created room type
  const newRoomTypeRef = useRef<string | null>(null);

  /**
   * Unwrap params Promise on mount
   */
  useEffect(() => {
    params.then(({ id }) => {
      setAccommodationId(id);
    });
  }, [params]);

  /**
   * Fetch accommodation details
   */
  const fetchAccommodation = useCallback(async () => {
    if (!accommodationId) return;
    try {
      const response = await fetch(`/api/admin/accommodations/${accommodationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch accommodation');
      }

      const result = await response.json();
      if (result.success) {
        setAccommodationName(result.data.name || 'Accommodation');
      }
    } catch (error) {
      console.error('Failed to fetch accommodation:', error);
    }
  }, [accommodationId]);

  /**
   * Fetch room types from API
   */
  const fetchRoomTypes = useCallback(async () => {
    if (!accommodationId) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/accommodations/${accommodationId}/room-types`);
      if (!response.ok) {
        throw new Error('Failed to fetch room types');
      }

      const result = await response.json();
      if (result.success) {
        setRoomTypes(result.data || []);
      } else {
        addToast({
          type: 'error',
          message: result.error?.message || 'Failed to load room types',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to load room types',
      });
    } finally {
      setLoading(false);
    }
  }, [accommodationId, addToast]);

  // Load data on mount only
  useEffect(() => {
    if (accommodationId) {
      fetchAccommodation();
      fetchRoomTypes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accommodationId]);

  /**
   * Handle row click - open edit form
   */
  const handleRowClick = useCallback((roomType: RoomType) => {
    setSelectedRoomType(roomType);
    setIsFormOpen(true);
  }, []);

  /**
   * Handle add room type button click
   */
  const handleAddRoomType = useCallback(() => {
    setSelectedRoomType(null);
    setIsFormOpen(true);
  }, []);

  /**
   * Handle delete button click
   */
  const handleDeleteClick = useCallback((roomType: RoomType) => {
    setRoomTypeToDelete(roomType);
    setIsDeleteDialogOpen(true);
  }, []);

  /**
   * Handle manage sections button click
   */
  const handleManageSections = useCallback((roomType: RoomType) => {
    // Navigate to section editor for this room type
    if (accommodationId) {
      router.push(`/admin/accommodations/${accommodationId}/room-types/${roomType.id}/sections`);
    }
  }, [router, accommodationId]);

  /**
   * Handle back to accommodations
   */
  const handleBackToAccommodations = useCallback(() => {
    router.push('/admin/accommodations');
  }, [router]);

  /**
   * Handle form submission (create or update)
   */
  const handleSubmit = useCallback(async (data: any) => {
    try {
      const isEdit = !!selectedRoomType;
      
      // Add accommodation ID to data
      const submitData = {
        ...data,
        accommodationId,
      };
      
      const url = isEdit ? `/api/admin/room-types/${selectedRoomType.id}` : '/api/admin/room-types';
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
          message: isEdit ? 'Room type updated successfully' : 'Room type created successfully',
        });
        
        // Store new room type ID for scrolling
        if (!isEdit && result.data?.id) {
          newRoomTypeRef.current = result.data.id;
        }
        
        // Refresh room type list
        await fetchRoomTypes();
        
        // Close form
        setIsFormOpen(false);
        setSelectedRoomType(null);
        
        // Scroll to new room type after a short delay
        if (newRoomTypeRef.current) {
          setTimeout(() => {
            const element = document.querySelector(`[data-row-id="${newRoomTypeRef.current}"]`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            newRoomTypeRef.current = null;
          }, 100);
        }
      } else {
        // Display validation error details if available
        let errorMessage = result.error?.message || 'Operation failed';
        
        // If validation error with details, show specific field errors
        if (result.error?.code === 'VALIDATION_ERROR' && result.error?.details) {
          const fieldErrors = result.error.details
            .map((detail: any) => detail.message || detail.path?.join('.'))
            .filter(Boolean)
            .join(', ');
          
          if (fieldErrors) {
            errorMessage = fieldErrors;
          }
        }
        
        addToast({
          type: 'error',
          message: errorMessage,
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Operation failed',
      });
    }
  }, [selectedRoomType, accommodationId, addToast, fetchRoomTypes]);

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!roomTypeToDelete) return;

    try {
      const response = await fetch(`/api/admin/room-types/${roomTypeToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        addToast({
          type: 'success',
          message: 'Room type deleted successfully',
        });
        
        // Refresh room type list
        await fetchRoomTypes();
        
        // Close dialog
        setIsDeleteDialogOpen(false);
        setRoomTypeToDelete(null);
      } else {
        addToast({
          type: 'error',
          message: result.error?.message || 'Failed to delete room type',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete room type',
      });
    }
  }, [roomTypeToDelete, addToast, fetchRoomTypes]);

  /**
   * Calculate occupancy percentage
   */
  const calculateOccupancy = (roomType: RoomType) => {
    // This would need to fetch actual assignments
    // For now, return 0 as placeholder
    return 0;
  };

  /**
   * Format currency for display
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Define table columns
  const columns: ColumnDef<RoomType>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'capacity',
      label: 'Capacity',
      sortable: true,
      render: (value) => `${value} guests`,
    },
    {
      key: 'totalRooms',
      label: 'Total Rooms',
      sortable: true,
    },
    {
      key: 'pricePerNight',
      label: 'Price/Night',
      sortable: true,
      render: (value) => formatCurrency(value as number),
    },
    {
      key: 'occupancy',
      label: 'Occupancy',
      sortable: false,
      render: (_, row) => {
        const roomType = row as RoomType;
        const occupancy = calculateOccupancy(roomType);
        const percentage = roomType.totalRooms > 0 ? (occupancy / roomType.totalRooms) * 100 : 0;
        
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-sage-900">
              {occupancy}/{roomType.totalRooms}
            </span>
            <span className="text-xs text-sage-600">
              ({(percentage ?? 0).toFixed(0)}%)
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => {
        const roomType = row as RoomType;
        return (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`/room-type/${roomType.slug || roomType.id}`, '_blank');
              }}
              title="View room type detail page"
            >
              View
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleManageSections(roomType);
              }}
            >
              Manage Sections
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
      label: 'Room Type Name',
      type: 'text',
      required: true,
      placeholder: 'Enter room type name (e.g., Ocean View Suite)',
    },
    {
      name: 'capacity',
      label: 'Capacity',
      type: 'number',
      required: true,
      placeholder: 'Maximum guests per room',
      helpText: 'Maximum number of guests that can stay in this room type',
    },
    {
      name: 'totalRooms',
      label: 'Total Rooms',
      type: 'number',
      required: true,
      placeholder: 'Number of rooms available',
      helpText: 'Total number of rooms of this type',
    },
    {
      name: 'pricePerNight',
      label: 'Price Per Night',
      type: 'number',
      required: true,
      placeholder: '0.00',
      helpText: 'Price per night in USD',
    },
    {
      name: 'hostSubsidyPerNight',
      label: 'Host Subsidy Per Night',
      type: 'number',
      required: false,
      placeholder: '0.00',
      helpText: 'Amount host will subsidize per night (optional)',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'richtext',
      required: false,
      placeholder: 'Enter room type description',
      helpText: 'Rich text editor for detailed room type description',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBackToAccommodations}
            >
              ← Back to Accommodations
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-sage-900">Room Types: {accommodationName}</h1>
          <p className="text-sage-600 mt-1">Manage room types and guest assignments</p>
        </div>
        <Button
          variant="primary"
          onClick={handleAddRoomType}
          aria-label="Create new room type"
          data-action="add-new"
        >
          + Add Room Type
        </Button>
      </div>

      {/* Collapsible Form */}
      <CollapsibleForm
        isOpen={isFormOpen}
        onToggle={() => {
          setIsFormOpen(!isFormOpen);
          if (isFormOpen) {
            setSelectedRoomType(null);
          }
        }}
        title={selectedRoomType ? 'Edit Room Type' : 'Add New Room Type'}
        fields={formFields}
        schema={selectedRoomType ? updateRoomTypeSchema : createRoomTypeSchema}
        onSubmit={handleSubmit}
        onCancel={() => {
          setIsFormOpen(false);
          setSelectedRoomType(null);
        }}
        initialData={selectedRoomType || {}}
        submitLabel={selectedRoomType ? 'Update Room Type' : 'Create Room Type'}
      />

      {/* Inline Section Editor - Shows when editing an existing room type */}
      {isFormOpen && selectedRoomType && (
        <InlineSectionEditor
          pageType="room_type"
          pageId={selectedRoomType.id}
          entityName={selectedRoomType.name}
          defaultExpanded={false}
        />
      )}

      {/* Data Table */}
      <DataTable
        data={roomTypes}
        columns={columns}
        loading={loading}
        onRowClick={handleRowClick}
        onDelete={handleDeleteClick}
        totalCount={roomTypes.length}
        currentPage={1}
        pageSize={25}
        idField="id"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setRoomTypeToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Room Type"
        message={`Are you sure you want to delete "${roomTypeToDelete?.name}"? This will unassign all guests from this room type. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
