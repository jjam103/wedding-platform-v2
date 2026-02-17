'use client';

import { useState, useCallback } from 'react';

interface PhotoFile {
  file: File;
  preview: string;
  caption: string;
  altText: string;
}

interface AdminPhotoUploadProps {
  pageType?: 'event' | 'activity' | 'accommodation' | 'memory';
  pageId?: string;
  onUploadComplete?: () => void;
  onCancel?: () => void;
}

/**
 * Admin Photo Upload Component
 * 
 * Allows admins to upload photos directly:
 * - Multi-file selection
 * - Preview before upload
 * - Caption and alt text input
 * - Batch upload with progress
 * - Auto-approve (admin uploads)
 */
export function AdminPhotoUpload({
  pageType = 'memory',
  pageId,
  onUploadComplete,
  onCancel,
}: AdminPhotoUploadProps) {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    // Create previews
    const newPhotos = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      caption: '',
      altText: '',
    }));

    setPhotos([...photos, ...newPhotos]);
    setError(null);
  }, [photos]);

  const removePhoto = useCallback((index: number) => {
    const newPhotos = [...photos];
    URL.revokeObjectURL(newPhotos[index].preview);
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  }, [photos]);

  const updateCaption = useCallback((index: number, caption: string) => {
    const newPhotos = [...photos];
    newPhotos[index].caption = caption;
    setPhotos(newPhotos);
  }, [photos]);

  const updateAltText = useCallback((index: number, altText: string) => {
    const newPhotos = [...photos];
    newPhotos[index].altText = altText;
    setPhotos(newPhotos);
  }, [photos]);

  const handleUpload = async () => {
    if (photos.length === 0) {
      setError('Please select at least one photo');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const totalPhotos = photos.length;
      let uploadedCount = 0;

      for (const photo of photos) {
        const formData = new FormData();
        formData.append('file', photo.file);
        
        const metadata = {
          page_type: pageType,
          page_id: pageId,
          caption: photo.caption,
          alt_text: photo.altText,
        };
        formData.append('metadata', JSON.stringify(metadata));

        const response = await fetch('/api/admin/photos', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Upload failed');
        }

        // Auto-approve admin uploads
        await fetch(`/api/admin/photos/${result.data.id}/moderate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ moderation_status: 'approved' }),
        });

        uploadedCount++;
        setUploadProgress(Math.round((uploadedCount / totalPhotos) * 100));
      }

      // Clean up
      photos.forEach(photo => URL.revokeObjectURL(photo.preview));
      setPhotos([]);
      
      onUploadComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClearAll = () => {
    photos.forEach(photo => URL.revokeObjectURL(photo.preview));
    setPhotos([]);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-volcano-50 border border-volcano-200 rounded-lg text-volcano-800 text-sm" role="alert">
          {error}
        </div>
      )}

      {/* File Upload Area */}
      <div>
        <label htmlFor="admin-photo-upload" className="block cursor-pointer">
          <div className="border-2 border-dashed border-sage-300 rounded-lg p-8 text-center hover:border-jungle-400 hover:bg-jungle-50 transition-colors">
            <div className="text-4xl mb-3" aria-hidden="true">📷</div>
            <h3 className="text-lg font-semibold text-sage-700 mb-2">
              Click to select photos
            </h3>
            <p className="text-sm text-sage-600">
              or drag and drop your photos here
            </p>
            <p className="text-xs text-sage-500 mt-2">
              JPG, PNG, GIF, WebP • Max 10MB per file
            </p>
          </div>
          <input
            id="admin-photo-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
            aria-label="Select photos to upload"
            aria-describedby="photo-upload-instructions"
          />
        </label>
        <div id="photo-upload-instructions" className="sr-only">
          Select one or more image files to upload. Supported formats: JPG, PNG, GIF, WebP. Maximum file size: 10MB per file.
        </div>
      </div>

      {/* Photo Previews */}
      {photos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-sage-900">
              Selected Photos ({photos.length})
            </h4>
            <button
              onClick={handleClearAll}
              disabled={uploading}
              className="text-xs text-volcano-600 hover:text-volcano-700 disabled:opacity-50"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-3">
            {photos.map((photo, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-sage-50 border border-sage-200 rounded-lg"
              >
                {/* Thumbnail */}
                <div className="flex-shrink-0">
                  <img
                    src={photo.preview}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded"
                  />
                </div>

                {/* Inputs */}
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={photo.caption}
                    onChange={(e) => updateCaption(index, e.target.value)}
                    placeholder="Caption (optional)"
                    aria-label={`Caption for photo ${index + 1}`}
                    className="w-full px-3 py-1.5 text-sm border border-sage-300 rounded focus:ring-2 focus:ring-jungle-500 focus:border-jungle-500 min-h-[44px]"
                    disabled={uploading}
                  />
                  <input
                    type="text"
                    value={photo.altText}
                    onChange={(e) => updateAltText(index, e.target.value)}
                    placeholder="Alt text for accessibility (optional)"
                    aria-label={`Alt text for photo ${index + 1}`}
                    className="w-full px-3 py-1.5 text-sm border border-sage-300 rounded focus:ring-2 focus:ring-jungle-500 focus:border-jungle-500 min-h-[44px]"
                    disabled={uploading}
                  />
                  <p className="text-xs text-sage-600">
                    {photo.file.name} ({(photo.file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removePhoto(index)}
                  disabled={uploading}
                  className="flex-shrink-0 p-1 text-volcano-600 hover:text-volcano-700 disabled:opacity-50"
                  aria-label="Remove photo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div role="status" aria-live="polite">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-sage-700">Uploading...</span>
                <span className="text-sm font-medium text-jungle-700" aria-label={`Upload progress: ${uploadProgress} percent`}>
                  {uploadProgress}%
                </span>
              </div>
              <div className="w-full bg-sage-200 rounded-full h-2" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className="bg-jungle-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleUpload}
              disabled={uploading || photos.length === 0}
              aria-label={`Upload ${photos.length} photo${photos.length > 1 ? 's' : ''}`}
              className="flex-1 px-4 py-2 bg-jungle-600 hover:bg-jungle-700 disabled:bg-sage-400 text-white font-medium rounded-lg transition-colors min-h-[44px]"
            >
              {uploading ? 'Uploading...' : `Upload ${photos.length} Photo${photos.length > 1 ? 's' : ''}`}
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                disabled={uploading}
                aria-label="Cancel photo upload"
                className="px-4 py-2 bg-sage-200 hover:bg-sage-300 disabled:bg-sage-100 text-sage-700 font-medium rounded-lg transition-colors min-h-[44px]"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
