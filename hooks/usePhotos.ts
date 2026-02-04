import { useState, useCallback, useEffect } from 'react';

interface Photo {
  id: string;
  uploader_id: string;
  photo_url: string;
  storage_type: 'b2' | 'supabase';
  page_type: 'event' | 'activity' | 'accommodation' | 'memory';
  page_id?: string;
  caption?: string;
  alt_text?: string;
  moderation_status: 'pending' | 'approved' | 'rejected';
  moderation_reason?: string;
  display_order?: number;
  created_at: string;
  moderated_at?: string;
  updated_at: string;
}

interface UsePhotosOptions {
  pageType?: string;
  pageId?: string;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  autoLoad?: boolean;
}

interface UsePhotosReturn {
  photos: Photo[];
  loading: boolean;
  error: string | null;
  loadPhotos: () => Promise<void>;
  uploadPhoto: (file: File, metadata: { caption?: string; alt_text?: string }) => Promise<void>;
  updatePhoto: (id: string, updates: { caption?: string; alt_text?: string; display_order?: number }) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
  reorderPhotos: (photoIds: string[]) => Promise<void>;
}

/**
 * Custom hook for managing photos
 * 
 * Provides centralized photo operations:
 * - Load photos with filtering
 * - Upload photos
 * - Update photo metadata
 * - Delete photos
 * - Reorder photos
 */
export function usePhotos(options: UsePhotosOptions = {}): UsePhotosReturn {
  const { pageType, pageId, moderationStatus, autoLoad = true } = options;
  
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: '100',
        offset: '0',
      });

      if (pageType) params.append('page_type', pageType);
      if (pageId) params.append('page_id', pageId);
      if (moderationStatus) params.append('moderation_status', moderationStatus);

      const response = await fetch(`/api/admin/photos?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setPhotos(result.data.photos || []);
      } else {
        setError(result.error?.message || 'Failed to load photos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  }, [pageType, pageId, moderationStatus]);

  const uploadPhoto = useCallback(async (
    file: File,
    metadata: { caption?: string; alt_text?: string }
  ) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const photoMetadata = {
        page_type: pageType || 'memory',
        page_id: pageId,
        caption: metadata.caption,
        alt_text: metadata.alt_text,
      };
      formData.append('metadata', JSON.stringify(photoMetadata));

      const response = await fetch('/api/admin/photos', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Upload failed');
      }

      // Reload photos after upload
      await loadPhotos();
    } catch (err) {
      throw err;
    }
  }, [pageType, pageId, loadPhotos]);

  const updatePhoto = useCallback(async (
    id: string,
    updates: { caption?: string; alt_text?: string; display_order?: number }
  ) => {
    try {
      const response = await fetch(`/api/admin/photos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Update failed');
      }

      // Update local state
      setPhotos(prev =>
        prev.map(p => (p.id === id ? { ...p, ...updates } : p))
      );
    } catch (err) {
      throw err;
    }
  }, []);

  const deletePhoto = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/admin/photos/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Delete failed');
      }

      // Remove from local state
      setPhotos(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      throw err;
    }
  }, []);

  const reorderPhotos = useCallback(async (photoIds: string[]) => {
    try {
      // Update display_order for each photo
      const updates = photoIds.map((id, index) =>
        updatePhoto(id, { display_order: index })
      );

      await Promise.all(updates);

      // Update local state with new order
      const reordered = photoIds
        .map(id => photos.find(p => p.id === id))
        .filter((p): p is Photo => p !== undefined);
      
      setPhotos(reordered);
    } catch (err) {
      throw err;
    }
  }, [photos, updatePhoto]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      loadPhotos();
    }
  }, [autoLoad, loadPhotos]);

  return {
    photos,
    loading,
    error,
    loadPhotos,
    uploadPhoto,
    updatePhoto,
    deletePhoto,
    reorderPhotos,
  };
}
