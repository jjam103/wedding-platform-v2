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

interface PhotoPreviewModalProps {
  photo: Photo;
  onClose: () => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function PhotoPreviewModal({ photo, onClose, onApprove, onReject, onDelete }: PhotoPreviewModalProps) {
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
    setIsProcessing(true);
    try {
      await onDelete(photo.id);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

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
      onClick={onClose}
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
            className="p-2 hover:bg-sage-100 rounded-lg transition-colors"
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
        <div className="px-6 py-4 border-t border-sage-200 flex items-center justify-end gap-3">
          <button
            onClick={handleDelete}
            disabled={isProcessing}
            className="px-4 py-2 bg-volcano-500 hover:bg-volcano-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Delete'}
          </button>
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="px-4 py-2 bg-sage-200 hover:bg-sage-300 text-sage-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Reject'}
          </button>
          <button
            onClick={handleApprove}
            disabled={isProcessing}
            className="px-4 py-2 bg-jungle-500 hover:bg-jungle-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const addToast = useCallback((message: string, type: ToastState['type']) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/photos?moderation_status=${filter}&limit=100&offset=0`
      );
      const result = await response.json();

      if (result.success) {
        setPhotos(result.data.photos);
      } else {
        addToast(result.error.message || 'Failed to load photos', 'error');
      }
    } catch (error) {
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
            addToast('Photo status updated', 'info');
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

  return (
    <AdminLayout currentSection="photos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-sage-900">Photo Moderation</h1>
            <p className="text-sage-600 mt-1">Review and moderate guest-uploaded photos</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 border-b border-sage-200">
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

        {/* Photo grid */}
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
                className="group relative aspect-square bg-sage-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-jungle-500 transition-all"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo.photo_url}
                  alt={photo.alt_text || 'Photo thumbnail'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm font-medium truncate">
                    {photo.caption || 'No caption'}
                  </p>
                  <p className="text-white text-xs opacity-75">
                    {new Date(photo.created_at).toLocaleDateString()}
                  </p>
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
          onApprove={handleApprove}
          onReject={handleReject}
          onDelete={handleDelete}
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
