'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { usePhotos } from '@/hooks/usePhotos';
import { GallerySettingsForm } from '@/components/admin/GallerySettingsForm';
import { PhotoReorderList } from '@/components/admin/PhotoReorderList';
import { AdminPhotoUpload } from '@/components/admin/AdminPhotoUpload';
import { Toast } from '@/components/ui/Toast';

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

/**
 * Photo Gallery Management Page
 * 
 * Comprehensive photo management for admins:
 * - Upload photos directly
 * - Configure gallery display settings
 * - Reorder photos with drag-and-drop
 * - Filter by page type/ID
 * - View and manage all photos
 */
export default function PhotoGalleryPage() {
  const [pageType, setPageType] = useState<string>('memory');
  const [pageId, setPageId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'settings' | 'reorder'>('upload');
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const { photos, loading, error, loadPhotos, reorderPhotos } = usePhotos({
    pageType: pageType as any,
    pageId: pageId || undefined,
    moderationStatus: 'approved',
    autoLoad: true,
  });

  const addToast = (message: string, type: ToastState['type']) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleUploadComplete = () => {
    addToast('Photos uploaded successfully', 'success');
    loadPhotos();
  };

  const handleReorder = async (photoIds: string[]) => {
    try {
      await reorderPhotos(photoIds);
      addToast('Photo order saved successfully', 'success');
    } catch (err) {
      addToast('Failed to save photo order', 'error');
      throw err;
    }
  };

  return (
    <AdminLayout currentSection="photos">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-sage-900">Photo Gallery Management</h1>
          <p className="text-sage-600 mt-1">
            Upload photos, configure display settings, and manage photo order
          </p>
        </div>

        {/* Page Filter */}
        <div className="bg-white rounded-lg border border-sage-200 p-4">
          <h3 className="text-sm font-medium text-sage-900 mb-3">Gallery Context</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-sage-700 mb-1">
                Page Type
              </label>
              <select
                value={pageType}
                onChange={(e) => setPageType(e.target.value)}
                className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-jungle-500"
              >
                <option value="memory">Wedding Memories</option>
                <option value="event">Event</option>
                <option value="activity">Activity</option>
                <option value="accommodation">Accommodation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-sage-700 mb-1">
                Page ID (optional)
              </label>
              <input
                type="text"
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                placeholder="Leave empty for general gallery"
                className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-jungle-500"
              />
              <p className="mt-1 text-xs text-sage-600">
                Specific event/activity ID, or leave empty for general memories
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-sage-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'text-jungle-600 border-b-2 border-jungle-600'
                  : 'text-sage-600 hover:text-sage-900'
              }`}
            >
              📤 Upload Photos
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'text-jungle-600 border-b-2 border-jungle-600'
                  : 'text-sage-600 hover:text-sage-900'
              }`}
            >
              ⚙️ Display Settings
            </button>
            <button
              onClick={() => setActiveTab('reorder')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'reorder'
                  ? 'text-jungle-600 border-b-2 border-jungle-600'
                  : 'text-sage-600 hover:text-sage-900'
              }`}
            >
              🔄 Reorder Photos ({photos.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border border-sage-200 p-6">
          {activeTab === 'upload' && (
            <div>
              <h2 className="text-xl font-semibold text-sage-900 mb-4">
                Upload Photos
              </h2>
              <AdminPhotoUpload
                pageType={pageType as any}
                pageId={pageId || undefined}
                onUploadComplete={handleUploadComplete}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-xl font-semibold text-sage-900 mb-4">
                Gallery Display Settings
              </h2>
              {pageId ? (
                <GallerySettingsForm
                  pageType={pageType as any}
                  pageId={pageId}
                  onSave={() => addToast('Settings saved successfully', 'success')}
                />
              ) : (
                <div className="text-center py-12 text-sage-600">
                  <p className="mb-2">Please select a specific page to configure settings</p>
                  <p className="text-sm">Enter a Page ID above to manage gallery settings for that page</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reorder' && (
            <div>
              <h2 className="text-xl font-semibold text-sage-900 mb-4">
                Reorder Photos
              </h2>
              {loading ? (
                <div className="text-center py-12 text-sage-600">Loading photos...</div>
              ) : error ? (
                <div className="p-4 bg-volcano-50 border border-volcano-200 rounded-lg text-volcano-800">
                  {error}
                </div>
              ) : (
                <PhotoReorderList photos={photos} onReorder={handleReorder} />
              )}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-jungle-50 border border-jungle-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-jungle-700">{photos.length}</div>
            <div className="text-sm text-jungle-600">Approved Photos</div>
          </div>
          <div className="bg-ocean-50 border border-ocean-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-ocean-700">{pageType}</div>
            <div className="text-sm text-ocean-600">Current Page Type</div>
          </div>
          <div className="bg-sunset-50 border border-sunset-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-sunset-700">
              {pageId || 'General'}
            </div>
            <div className="text-sm text-sunset-600">Page Context</div>
          </div>
        </div>
      </div>

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
