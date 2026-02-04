'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Toast } from '@/components/ui/Toast';
import { GridSkeleton } from '@/components/ui/SkeletonLoaders';

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

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface PhotoEditModalProps {
  photo: Photo;
  onClose: () => void;
  onSave: (id: string, data: { caption?: string; alt_text?: string }) => Promise<void>;
}

function PhotoEditModal({ photo, onClose, onSave }: PhotoEditModalProps) {
  const [caption, setCaption] = useState(photo.caption || '');
  const [altText, setAltText] = useState(photo.alt_text || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(photo.id, { caption, alt_text: altText });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, saving]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={!saving ? onClose : undefined}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-sage-900 mb-4">Edit Photo Details</h2>
        
        {/* Photo preview */}
        <div className="mb-4">
          <img
            src={photo.photo_url}
            alt={photo.alt_text || 'Photo preview'}
            className="w-full h-48 object-cover rounded-lg"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-1">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-jungle-500"
              placeholder="Enter photo caption..."
              rows={3}
              maxLength={500}
              disabled={saving}
            />
            <p className="text-xs text-sage-500 mt-1">
              {caption.length}/500 characters
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-1">
              Alt Text (for accessibility)
            </label>
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-jungle-500"
              placeholder="Describe the image..."
              maxLength={200}
              disabled={saving}
            />
            <p className="text-xs text-sage-500 mt-1">
              {altText.length}/200 characters
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border border-sage-300 rounded-lg hover:bg-sage-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-jungle-500 text-white rounded-lg hover:bg-jungle-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface PhotoPreviewModalProps {
  photo: Photo;
  onClose: () => void;
  onEdit: (photo: Photo) => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function PhotoPreviewModal({ photo, onClose, onEdit, onApprove, onReject, onDelete }: PhotoPreviewModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove(photo.id);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await onReject(photo.id);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
      return;
    }
    setIsProcessing(true);
    try {
      await onDelete(photo.id);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = () => {
    onClose();
    onEdit(photo);
  };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, isProcessing]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={!isProcessing ? onClose : undefined}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-sage-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-sage-900">Photo Preview</h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 hover:bg-sage-100 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {/* Photo */}
          <div className="mb-4">
            <img
              src={photo.photo_url}
              alt={photo.alt_text || 'Photo preview'}
              className="w-full h-auto rounded-lg"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Metadata */}
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-sage-700">Status:</span>{' '}
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  photo.moderation_status === 'approved'
                    ? 'bg-jungle-100 text-jungle-700'
                    : photo.moderation_status === 'rejected'
                    ? 'bg-volcano-100 text-volcano-700'
                    : 'bg-sunset-100 text-sunset-700'
                }`}
              >
                {photo.moderation_status}
              </span>
            </div>
            {photo.caption && (
              <div>
                <span className="font-medium text-sage-700">Caption:</span>{' '}
                <span className="text-sage-600">{photo.caption}</span>
              </div>
            )}
            {photo.alt_text && (
              <div>
                <span className="font-medium text-sage-700">Alt Text:</span>{' '}
                <span className="text-sage-600">{photo.alt_text}</span>
              </div>
            )}
            <div>
              <span className="font-medium text-sage-700">Uploaded:</span>{' '}
              <span className="text-sage-600">
                {new Date(photo.created_at).toLocaleDateString()} at{' '}
                {new Date(photo.created_at).toLocaleTimeString()}
              </span>
            </div>
            {photo.moderated_at && (
              <div>
                <span className="font-medium text-sage-700">Moderated:</span>{' '}
                <span className="text-sage-600">
                  {new Date(photo.moderated_at).toLocaleDateString()} at{' '}
                  {new Date(photo.moderated_at).toLocaleTimeString()}
                </span>
              </div>
            )}
            {photo.moderation_reason && (
              <div>
                <span className="font-medium text-sage-700">Reason:</span>{' '}
                <span className="text-sage-600">{photo.moderation_reason}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-sage-200 flex items-center justify-between">
          <button
            onClick={handleEdit}
            disabled={isProcessing}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Edit Details
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              disabled={isProcessing}
              className="px-4 py-2 bg-volcano-500 hover:bg-volcano-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Delete'}
            </button>
            {photo.moderation_status !== 'rejected' && (
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="px-4 py-2 bg-sage-200 hover:bg-sage-300 text-sage-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Reject'}
              </button>
            )}
            {photo.moderation_status !== 'approved' && (
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="px-4 py-2 bg-jungle-500 hover:bg-jungle-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Approve'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('approved');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [showStorageHealth, setShowStorageHealth] = useState(false);
  const [storageHealth, setStorageHealth] = useState<any>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadSection, setShowUploadSection] = useState(false);

  const addToast = useCallback((message: string, type: ToastState['type']) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const checkStorageHealth = useCallback(async () => {
    setCheckingHealth(true);
    try {
      const response = await fetch('/api/admin/storage/health');
      const result = await response.json();
      
      if (result.success) {
        setStorageHealth(result.data);
        setShowStorageHealth(true);
      } else {
        addToast('Failed to check storage health', 'error');
      }
    } catch (error) {
      console.error('Storage health check error:', error);
      addToast('Failed to check storage health', 'error');
    } finally {
      setCheckingHealth(false);
    }
  }, [addToast]);

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    try {
      // Don't send page_type filter - fetch all photos and filter by moderation_status only
      const response = await fetch(
        `/api/admin/photos?moderation_status=${filter}&limit=100&offset=0`
      );
      const result = await response.json();

      console.log('Fetched photos:', result);

      if (result.success) {
        setPhotos(result.data.photos);
        console.log('Photos loaded:', result.data.photos.length, 'photos');
        if (result.data.photos.length > 0) {
          console.log('First photo details:', {
            url: result.data.photos[0].photo_url,
            storage_type: result.data.photos[0].storage_type,
            isB2: result.data.photos[0].photo_url.includes('backblazeb2.com') || result.data.photos[0].photo_url.includes('cdn.jamara.us'),
            isSupabase: result.data.photos[0].photo_url.includes('supabase.co'),
          });
          
          // Check all photos storage type
          const b2Count = result.data.photos.filter((p: Photo) => p.storage_type === 'b2').length;
          const supabaseCount = result.data.photos.filter((p: Photo) => p.storage_type === 'supabase').length;
          console.log('Storage distribution:', { b2: b2Count, supabase: supabaseCount });
        }
      } else {
        addToast(result.error.message || 'Failed to load photos', 'error');
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
      addToast('Failed to load photos', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, addToast]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  /**
   * Set up real-time subscription for photo changes
   */
  useEffect(() => {
    // Create Supabase client for real-time subscriptions
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables for real-time subscriptions');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Subscribe to photo table changes
    const channel = supabase
      .channel('photos-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'photos',
        },
        (payload) => {
          console.log('Photo change detected:', payload);

          // Update photo grid when photos are uploaded or moderated
          if (payload.eventType === 'INSERT') {
            addToast('New photo uploaded', 'info');
          } else if (payload.eventType === 'UPDATE') {
            addToast('Photo updated', 'info');
          } else if (payload.eventType === 'DELETE') {
            addToast('Photo deleted', 'info');
          }

          // Refresh the photo list
          fetchPhotos();

          // Trigger event to update pending count badge in sidebar
          window.dispatchEvent(new CustomEvent('photoModerated'));
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPhotos, addToast]);

  const handleSaveEdit = async (id: string, data: { caption?: string; alt_text?: string }) => {
    try {
      const response = await fetch(`/api/admin/photos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        addToast('Photo updated successfully', 'success');
        await fetchPhotos();
      } else {
        addToast(result.error.message || 'Failed to update photo', 'error');
      }
    } catch (error) {
      addToast('Failed to update photo', 'error');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/photos/${id}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moderation_status: 'approved' }),
      });

      const result = await response.json();

      if (result.success) {
        addToast('Photo approved successfully', 'success');
        await fetchPhotos();
        // Trigger event to update pending count in sidebar
        window.dispatchEvent(new CustomEvent('photoModerated'));
      } else {
        addToast(result.error.message || 'Failed to approve photo', 'error');
      }
    } catch (error) {
      addToast('Failed to approve photo', 'error');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/photos/${id}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moderation_status: 'rejected' }),
      });

      const result = await response.json();

      if (result.success) {
        addToast('Photo rejected successfully', 'success');
        await fetchPhotos();
        // Trigger event to update pending count in sidebar
        window.dispatchEvent(new CustomEvent('photoModerated'));
      } else {
        addToast(result.error.message || 'Failed to reject photo', 'error');
      }
    } catch (error) {
      addToast('Failed to reject photo', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/photos/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        addToast('Photo deleted successfully', 'success');
        await fetchPhotos();
        // Trigger event to update pending count in sidebar
        window.dispatchEvent(new CustomEvent('photoModerated'));
      } else {
        addToast(result.error.message || 'Failed to delete photo', 'error');
      }
    } catch (error) {
      addToast('Failed to delete photo', 'error');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
          addToast(`Skipped ${file.name}: Invalid file type`, 'warning');
          errorCount++;
          continue;
        }

        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          addToast(`Skipped ${file.name}: File too large (max 10MB)`, 'warning');
          errorCount++;
          continue;
        }

        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('metadata', JSON.stringify({
          page_type: 'memory',
          caption: '',
          alt_text: '',
        }));

        // Upload
        const response = await fetch('/api/admin/photos', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          successCount++;
        } else {
          addToast(`Failed to upload ${file.name}: ${result.error.message}`, 'error');
          errorCount++;
        }
      }

      // Show summary
      if (successCount > 0) {
        addToast(`Successfully uploaded ${successCount} photo${successCount > 1 ? 's' : ''}`, 'success');
        await fetchPhotos();
        // Trigger event to update pending count in sidebar
        window.dispatchEvent(new CustomEvent('photoModerated'));
      }

      if (errorCount > 0) {
        addToast(`${errorCount} photo${errorCount > 1 ? 's' : ''} failed to upload`, 'error');
      }

      // Reset file input
      event.target.value = '';
      setShowUploadSection(false);
    } catch (error) {
      addToast('Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout currentSection="photos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-sage-900">Photo Gallery</h1>
            <p className="text-sage-600 mt-1">Manage and moderate wedding photos</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowUploadSection(!showUploadSection)}
              disabled={uploading}
              className="px-4 py-2 bg-jungle-500 hover:bg-jungle-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload Photos
            </button>
            <button
              onClick={checkStorageHealth}
              disabled={checkingHealth}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {checkingHealth ? 'Checking...' : 'Check Storage'}
            </button>
          </div>
        </div>

        {/* Upload Section */}
        {showUploadSection && (
          <div className="bg-white border border-sage-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-sage-900">Upload Photos</h2>
                <p className="text-sm text-sage-600 mt-1">
                  Select one or more photos to upload. Supported formats: JPEG, PNG, WebP, GIF (max 10MB each)
                </p>
              </div>
              <button
                onClick={() => setShowUploadSection(false)}
                className="text-sage-400 hover:text-sage-600"
              >
                ✕
              </button>
            </div>
            
            <div className="border-2 border-dashed border-sage-300 rounded-lg p-8 text-center hover:border-jungle-500 transition-colors">
              <input
                type="file"
                id="photo-upload"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <label
                htmlFor="photo-upload"
                className={`cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg
                  className="w-12 h-12 mx-auto text-sage-400 mb-3"
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
                <p className="text-sage-700 font-medium mb-1">
                  {uploading ? 'Uploading...' : 'Click to select photos or drag and drop'}
                </p>
                <p className="text-sm text-sage-500">
                  JPEG, PNG, WebP, GIF up to 10MB each
                </p>
              </label>
            </div>
          </div>
        )}

        {/* Storage Health Info */}
        {showStorageHealth && storageHealth && (
          <div className={`p-4 rounded-lg border ${
            storageHealth.healthy 
              ? 'bg-jungle-50 border-jungle-200' 
              : storageHealth.configured 
                ? 'bg-sunset-50 border-sunset-200'
                : 'bg-sage-50 border-sage-200'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {storageHealth.healthy ? (
                    <svg className="w-5 h-5 text-jungle-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-sunset-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  <h3 className="font-semibold text-sage-900">Storage Status</h3>
                </div>
                <p className="text-sm text-sage-700 mb-2">{storageHealth.message}</p>
                {storageHealth.config && (
                  <div className="text-xs text-sage-600 space-y-1">
                    <div>B2 Configured: {storageHealth.configured ? '✓ Yes' : '✗ No'}</div>
                    {storageHealth.configured && (
                      <>
                        <div>Bucket: {storageHealth.config.bucketName}</div>
                        <div>CDN: {storageHealth.config.hasCdn ? `✓ ${storageHealth.config.cdnUrl}` : '✗ Not configured'}</div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowStorageHealth(false)}
                className="text-sage-400 hover:text-sage-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 border-b border-sage-200">
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'approved'
                ? 'text-jungle-600 border-b-2 border-jungle-600'
                : 'text-sage-600 hover:text-sage-900'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'pending'
                ? 'text-jungle-600 border-b-2 border-jungle-600'
                : 'text-sage-600 hover:text-sage-900'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'rejected'
                ? 'text-jungle-600 border-b-2 border-jungle-600'
                : 'text-sage-600 hover:text-sage-900'
            }`}
          >
            Rejected
          </button>
        </div>

        {/* Photo grid with inline editing */}
        {loading ? (
          <GridSkeleton items={8} columns={4} />
        ) : photos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sage-600">No {filter} photos found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative bg-white rounded-lg overflow-hidden border border-sage-200 hover:border-jungle-500 transition-all"
              >
                {/* Photo preview */}
                <div 
                  className="aspect-square bg-sage-100 cursor-pointer relative overflow-hidden"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={photo.photo_url}
                    alt={photo.alt_text || 'Photo thumbnail'}
                    className="w-full h-full object-cover block relative z-10"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    style={{ display: 'block', opacity: 1, visibility: 'visible' }}
                    onLoad={(e) => {
                      const target = e.target as HTMLImageElement;
                      console.log('✅ Image loaded successfully:', photo.photo_url, {
                        naturalWidth: target.naturalWidth,
                        naturalHeight: target.naturalHeight,
                        complete: target.complete
                      });
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      console.error('❌ Image failed to load:', photo.photo_url, {
                        complete: target.complete,
                        naturalWidth: target.naturalWidth,
                        naturalHeight: target.naturalHeight,
                        src: target.src,
                        currentSrc: target.currentSrc
                      });
                      
                      // Only show placeholder if image truly failed (naturalWidth is 0)
                      if (target.naturalWidth === 0) {
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.image-placeholder')) {
                          const placeholder = document.createElement('div');
                          placeholder.className = 'image-placeholder w-full h-full flex items-center justify-center bg-sage-200';
                          placeholder.innerHTML = `
                            <div class="text-center p-4">
                              <svg class="w-12 h-12 mx-auto text-sage-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p class="text-xs text-sage-600">Image unavailable</p>
                              <p class="text-xs text-sage-500 mt-1">Check console for details</p>
                            </div>
                          `;
                          parent.insertBefore(placeholder, target);
                        }
                      } else {
                        console.warn('⚠️ onError fired but image has dimensions:', target.naturalWidth, 'x', target.naturalHeight);
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none z-20" />
                  
                  {/* Storage type badge */}
                  <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium bg-white bg-opacity-90 z-30">
                    {photo.storage_type === 'b2' ? (
                      <span className="text-blue-700">B2</span>
                    ) : (
                      <span className="text-purple-700">Supabase</span>
                    )}
                  </div>
                </div>

                {/* Inline editing section */}
                <div className="p-3 space-y-2">
                  {/* Caption input */}
                  <div>
                    <label className="block text-xs font-medium text-sage-700 mb-1">
                      Caption
                    </label>
                    <input
                      type="text"
                      value={photo.caption || ''}
                      onChange={(e) => {
                        const newCaption = e.target.value;
                        setPhotos(prev => prev.map(p => 
                          p.id === photo.id ? { ...p, caption: newCaption } : p
                        ));
                      }}
                      onBlur={async () => {
                        await handleSaveEdit(photo.id, { 
                          caption: photo.caption, 
                          alt_text: photo.alt_text 
                        });
                      }}
                      placeholder="Add caption..."
                      className="w-full px-2 py-1 text-sm border border-sage-300 rounded focus:ring-1 focus:ring-jungle-500 focus:border-jungle-500"
                      maxLength={500}
                    />
                  </div>

                  {/* Alt text input */}
                  <div>
                    <label className="block text-xs font-medium text-sage-700 mb-1">
                      Alt Text
                    </label>
                    <input
                      type="text"
                      value={photo.alt_text || ''}
                      onChange={(e) => {
                        const newAltText = e.target.value;
                        setPhotos(prev => prev.map(p => 
                          p.id === photo.id ? { ...p, alt_text: newAltText } : p
                        ));
                      }}
                      onBlur={async () => {
                        await handleSaveEdit(photo.id, { 
                          caption: photo.caption, 
                          alt_text: photo.alt_text 
                        });
                      }}
                      placeholder="Describe image..."
                      className="w-full px-2 py-1 text-sm border border-sage-300 rounded focus:ring-1 focus:ring-jungle-500 focus:border-jungle-500"
                      maxLength={200}
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-sage-200">
                    <div className="flex items-center gap-1">
                      {photo.moderation_status !== 'approved' && (
                        <button
                          onClick={() => handleApprove(photo.id)}
                          className="p-1.5 text-jungle-600 hover:bg-jungle-50 rounded transition-colors"
                          title="Approve"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                      {photo.moderation_status !== 'rejected' && (
                        <button
                          onClick={() => handleReject(photo.id)}
                          className="p-1.5 text-sage-600 hover:bg-sage-100 rounded transition-colors"
                          title="Reject"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedPhoto(photo)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="View full size"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(photo.id)}
                        className="p-1.5 text-volcano-600 hover:bg-volcano-50 rounded transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="text-xs text-sage-500 pt-1">
                    <div className="flex items-center justify-between">
                      <span>{new Date(photo.created_at).toLocaleDateString()}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          photo.moderation_status === 'approved'
                            ? 'bg-jungle-100 text-jungle-700'
                            : photo.moderation_status === 'rejected'
                            ? 'bg-volcano-100 text-volcano-700'
                            : 'bg-sunset-100 text-sunset-700'
                        }`}
                      >
                        {photo.moderation_status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo preview modal */}
      {selectedPhoto && (
        <PhotoPreviewModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onEdit={setEditingPhoto}
          onApprove={handleApprove}
          onReject={handleReject}
          onDelete={handleDelete}
        />
      )}

      {/* Photo edit modal */}
      {editingPhoto && (
        <PhotoEditModal
          photo={editingPhoto}
          onClose={() => setEditingPhoto(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
            duration={5000}
          />
        ))}
      </div>
    </AdminLayout>
  );
}
