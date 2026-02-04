'use client';

import { DeletedItemsManager } from '@/components/admin/DeletedItemsManager';
import { useToast } from '@/components/ui/ToastContext';

/**
 * Deleted Items Management Page
 * 
 * Provides interface for managing soft-deleted items:
 * - View all deleted items across entity types
 * - Filter by entity type
 * - Search by name
 * - Restore items (clears deleted_at)
 * - Permanently delete items (removes from database)
 * 
 * Items are automatically purged after 30 days.
 */
export default function DeletedItemsPage() {
  const { addToast } = useToast();

  const handleRestore = async (id: string, type: string) => {
    try {
      const response = await fetch(`/api/admin/deleted-items/${id}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to restore item');
      }

      addToast({
        type: 'success',
        message: 'Item restored successfully',
      });
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to restore item',
      });
      throw error;
    }
  };

  const handlePermanentDelete = async (id: string, type: string) => {
    try {
      const response = await fetch(`/api/admin/deleted-items/${id}/permanent`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to permanently delete item');
      }

      addToast({
        type: 'success',
        message: 'Item permanently deleted',
      });
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to permanently delete item',
      });
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-sage-900">Deleted Items</h1>
        <p className="text-sage-600 mt-1">
          Manage soft-deleted items. Items are automatically purged after 30 days.
        </p>
      </div>

      {/* Deleted Items Manager */}
      <DeletedItemsManager
        onRestore={handleRestore}
        onPermanentDelete={handlePermanentDelete}
      />
    </div>
  );
}
