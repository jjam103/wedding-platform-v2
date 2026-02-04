'use client';

import { useState, useCallback, useEffect } from 'react';

interface Photo {
  id: string;
  photo_url: string;
  caption?: string;
  alt_text?: string;
  moderation_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface PhotoPickerProps {
  selectedPhotoIds: string[];
  onSelectionChange: (photoIds: string[]) => void;
  pageType?: 'event' | 'activity' | 'accommodation' | 'memory';
  pageId?: string;
  disabled?: boolean;
}

/**
 * PhotoPicker component for selecting photos from the gallery
 * 
 * Features:
 * - Browse approved photos
 * - Multi-select with checkboxes
 * - Filter by page type and page ID
 * - Preview selected photos
 * - Drag to reorder selected photos
 */
export function PhotoPicker({
  selectedPhotoIds,
  onSelectionChange,
  pageType,
  pageId,
  disabled = false,
}: PhotoPickerProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetch approved photos
  useEffect(() => {
    if (showPicker) {
      fetchPhotos();
    }
  }, [showPicker, pageType, pageId]);

  // Fetch selected photos on mount to display them
  useEffect(() => {
    if (selectedPhotoIds.length > 0) {
      fetchSelectedPhotos();
    }
  }, [selectedPhotoIds]);

  const fetchSelectedPhotos = useCallback(async () => {
    try {
      const photoPromises = selectedPhotoIds.map(async (id) => {
        const response = await fetch(`/api/admin/photos/${id}`);
        if (!response.ok) return null;
        const result = await response.json();
        return result.success ? result.data : null;
      });

      const fetchedPhotos = await Promise.all(photoPromises);
      const validPhotos = fetchedPhotos.filter((p): p is Photo => p !== null);
      
      // Merge with existing photos, avoiding duplicates
      setPhotos(prevPhotos => {
        const existingIds = new Set(prevPhotos.map(p => p.id));
        const newPhotos = validPhotos.filter(p => !existingIds.has(p.id));
        return [...prevPhotos, ...newPhotos];
      });
    } catch (err) {
      console.error('Failed to fetch selected photos:', err);
    }
  }, [selectedPhotoIds]);

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        moderation_status: 'approved',
        limit: '100',
        offset: '0',
      });

      if (pageType) {
        params.append('page_type', pageType);
      }
      if (pageId) {
        params.append('page_id', pageId);
      }

      const response = await fetch(`/api/admin/photos?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setPhotos(result.data.photos || []);
      } else {
        setError(result.error?.message || 'Failed to load photos');
      }
    } catch (err) {
      setError('Failed to load photos');
    } finally {
      setLoading(false);
    }
  }, [pageType, pageId]);

  const handleTogglePhoto = useCallback(
    (photoId: string) => {
      if (selectedPhotoIds.includes(photoId)) {
        onSelectionChange(selectedPhotoIds.filter(id => id !== photoId));
      } else {
        onSelectionChange([...selectedPhotoIds, photoId]);
      }
    },
    [selectedPhotoIds, onSelectionChange]
  );

  const handleRemovePhoto = useCallback(
    (photoId: string) => {
      onSelectionChange(selectedPhotoIds.filter(id => id !== photoId));
    },
    [selectedPhotoIds, onSelectionChange]
  );

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setUploading(true);
      setUploadError(null);

      try {
        const uploadedPhotoIds: string[] = [];

        for (const file of Array.from(files)) {
          const formData = new FormData();
          formData.append('file', file);
          
          const metadata = {
            page_type: pageType || 'memory',
            page_id: pageId || 'general',
            caption: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
            alt_text: file.name.replace(/\.[^/.]+$/, ''),
          };
          formData.append('metadata', JSON.stringify(metadata));

          const response = await fetch('/api/admin/photos', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();

          if (result.success) {
            uploadedPhotoIds.push(result.data.id);
          } else {
            throw new Error(result.error?.message || 'Upload failed');
          }
        }

        // Add uploaded photos to selection
        onSelectionChange([...selectedPhotoIds, ...uploadedPhotoIds]);
        
        // Refresh photo list
        fetchPhotos();
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setUploading(false);
        // Reset file input
        event.target.value = '';
      }
    },
    [pageType, pageId, selectedPhotoIds, onSelectionChange, fetchPhotos]
  );

  const handleClearAll = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  // Get selected photos in order
  const selectedPhotos = selectedPhotoIds
    .map(id => photos.find(p => p.id === id))
    .filter((p): p is Photo => p !== undefined);

  return (
    <div className="space-y-4">
      {/* Selected photos preview */}
      {selectedPhotoIds.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">
              Selected Photos ({selectedPhotoIds.length})
            </h4>
            <button
              onClick={handleClearAll}
              disabled={disabled}
              className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Clear all selected photos"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {selectedPhotos.map(photo => (
              <div
                key={photo.id}
                className="relative group aspect-square rounded-lg overflow-hidden bg-gray-200"
              >
                <img
                  src={photo.photo_url}
                  alt={photo.alt_text || photo.caption || 'Selected photo'}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemovePhoto(photo.id)}
                  disabled={disabled}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Remove photo"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 truncate">
                    {photo.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add photos button */}
      <button
        onClick={() => setShowPicker(true)}
        disabled={disabled}
        className="w-full px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 border-2 border-dashed border-blue-300 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Add photos from gallery"
      >
        + Add Photos from Gallery
      </button>

      {/* Photo picker modal */}
      {showPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowPicker(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Select Photos
                </h3>
                
                {/* Upload button */}
                <label className="relative cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading || disabled}
                    className="sr-only"
                    aria-label="Upload photos"
                  />
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    {uploading ? 'Uploading...' : 'Upload Photos'}
                  </span>
                </label>
              </div>
              
              <button
                onClick={() => setShowPicker(false)}
                className="text-gray-600 hover:text-gray-900"
                aria-label="Close photo picker"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              {/* Upload error message */}
              {uploadError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{uploadError}</p>
                </div>
              )}
              
              {/* Uploading indicator */}
              {uploading && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center gap-3">
                    <svg
                      className="animate-spin h-5 w-5 text-blue-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <p className="text-sm text-blue-800">Uploading photos...</p>
                  </div>
                </div>
              )}
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-600">Loading photos...</div>
                </div>
              ) : error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              ) : photos.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No approved photos available.
                  {pageType && (
                    <div className="text-sm mt-2">
                      Try uploading photos for this {pageType} first.
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  {photos.map(photo => {
                    const isSelected = selectedPhotoIds.includes(photo.id);
                    return (
                      <div
                        key={photo.id}
                        className={`relative group aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2'
                            : 'border-transparent hover:border-gray-300'
                        }`}
                        onClick={() => handleTogglePhoto(photo.id)}
                      >
                        <img
                          src={photo.photo_url}
                          alt={photo.alt_text || photo.caption || 'Photo'}
                          className="w-full h-full object-cover"
                        />
                        {/* Checkbox overlay */}
                        <div
                          className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-blue-500 border-blue-500'
                              : 'bg-white border-gray-300 opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        {/* Caption */}
                        {photo.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-2 truncate">
                            {photo.caption}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                {selectedPhotoIds.length} photo{selectedPhotoIds.length !== 1 ? 's' : ''} selected
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPicker(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowPicker(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
