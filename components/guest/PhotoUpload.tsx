'use client';

import { useState } from 'react';
import type { Guest } from '@/types';

interface PhotoUploadProps {
  guest: Guest;
}

interface PhotoFile {
  file: File;
  preview: string;
  caption: string;
  altText: string;
}

/**
 * Photo Upload Component
 * 
 * Allows guests to upload wedding photos:
 * - Single and batch photo upload
 * - Caption and alt text input
 * - Preview before upload
 * - Upload progress tracking
 * 
 * Requirements: 13.9, 11.1, 11.11
 */
export function PhotoUpload({ guest }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file types
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    // Create preview URLs
    const newPhotos = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      caption: '',
      altText: '',
    }));

    setPhotos([...photos, ...newPhotos]);
    setError(null);
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    URL.revokeObjectURL(newPhotos[index].preview);
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const updatePhotoCaption = (index: number, caption: string) => {
    const newPhotos = [...photos];
    newPhotos[index].caption = caption;
    setPhotos(newPhotos);
  };

  const updatePhotoAltText = (index: number, altText: string) => {
    const newPhotos = [...photos];
    newPhotos[index].altText = altText;
    setPhotos(newPhotos);
  };

  const handleUpload = async () => {
    if (photos.length === 0) {
      setError('Please select at least one photo to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);
      setUploadProgress(0);

      const totalPhotos = photos.length;
      let uploadedCount = 0;

      for (const photo of photos) {
        const formData = new FormData();
        formData.append('file', photo.file);
        formData.append('caption', photo.caption);
        formData.append('alt_text', photo.altText);
        formData.append('page_type', 'memory');

        const response = await fetch('/api/guest/photos/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to upload photo');
        }

        uploadedCount++;
        setUploadProgress(Math.round((uploadedCount / totalPhotos) * 100));
      }

      setSuccess(`Successfully uploaded ${uploadedCount} photo${uploadedCount > 1 ? 's' : ''}!`);
      
      // Clear photos after successful upload
      photos.forEach(photo => URL.revokeObjectURL(photo.preview));
      setPhotos([]);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during upload');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-jungle-50 via-ocean-50 to-sunset-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-sage-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-jungle-700">Upload Photos</h1>
              <p className="text-sage-600 mt-1">Share your wedding memories</p>
            </div>
            <a
              href="/guest/dashboard"
              className="text-ocean-600 hover:text-ocean-700 font-medium"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {success && (
          <div className="bg-jungle-50 border border-jungle-200 rounded-lg p-4 mb-6">
            <p className="text-jungle-800">✓ {success}</p>
            <p className="text-sm text-jungle-700 mt-1">
              Your photos are pending moderation and will appear in the gallery once approved.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-volcano-50 border border-volcano-200 rounded-lg p-4 mb-6">
            <p className="text-volcano-800">✗ {error}</p>
          </div>
        )}

        {/* Upload Instructions */}
        <div className="bg-ocean-50 border border-ocean-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-ocean-800 mb-2">📸 Photo Upload Guidelines</h2>
          <ul className="text-sm text-ocean-700 space-y-1">
            <li>• Accepted formats: JPG, PNG, GIF, WebP</li>
            <li>• Maximum file size: 10MB per photo</li>
            <li>• You can upload multiple photos at once</li>
            <li>• Photos will be reviewed before appearing in the gallery</li>
            <li>• Add captions to help tell the story of your photos</li>
          </ul>
        </div>

        {/* File Upload Area */}
        <div className="bg-white rounded-lg shadow-md border border-sage-200 p-6 mb-6">
          <label
            htmlFor="photo-upload"
            className="block w-full cursor-pointer"
          >
            <div className="border-2 border-dashed border-sage-300 rounded-lg p-12 text-center hover:border-jungle-400 hover:bg-jungle-50 transition-colors">
              <div className="text-6xl mb-4">📷</div>
              <h3 className="text-lg font-semibold text-sage-700 mb-2">
                Click to select photos
              </h3>
              <p className="text-sm text-sage-600">
                or drag and drop your photos here
              </p>
              <p className="text-xs text-sage-500 mt-2">
                You can select multiple photos at once
              </p>
            </div>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>

        {/* Photo Previews */}
        {photos.length > 0 && (
          <div className="bg-white rounded-lg shadow-md border border-sage-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-jungle-700 mb-4">
              Selected Photos ({photos.length})
            </h2>
            <div className="space-y-4">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className="border border-sage-200 rounded-lg p-4 flex items-start space-x-4"
                >
                  {/* Preview Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={photo.preview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>

                  {/* Photo Details */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-sage-700 mb-1">
                        Caption
                      </label>
                      <input
                        type="text"
                        value={photo.caption}
                        onChange={(e) => updatePhotoCaption(index, e.target.value)}
                        placeholder="Add a caption for this photo..."
                        className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-jungle-500"
                        disabled={uploading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-sage-700 mb-1">
                        Alt Text (for accessibility)
                      </label>
                      <input
                        type="text"
                        value={photo.altText}
                        onChange={(e) => updatePhotoAltText(index, e.target.value)}
                        placeholder="Describe what's in the photo..."
                        className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-jungle-500"
                        disabled={uploading}
                      />
                    </div>
                    <div className="text-xs text-sage-500">
                      {photo.file.name} ({(photo.file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removePhoto(index)}
                    disabled={uploading}
                    className="flex-shrink-0 text-volcano-600 hover:text-volcano-700 disabled:text-sage-400"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-sage-700">Uploading...</span>
                  <span className="text-sm font-medium text-jungle-700">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-sage-200 rounded-full h-2">
                  <div
                    className="bg-jungle-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div className="mt-6 flex items-center space-x-3">
              <button
                onClick={handleUpload}
                disabled={uploading || photos.length === 0}
                className="bg-jungle-600 hover:bg-jungle-700 disabled:bg-sage-400 text-white font-medium py-3 px-8 rounded-lg transition-colors"
              >
                {uploading ? 'Uploading...' : `Upload ${photos.length} Photo${photos.length > 1 ? 's' : ''}`}
              </button>
              <button
                onClick={() => {
                  photos.forEach(photo => URL.revokeObjectURL(photo.preview));
                  setPhotos([]);
                }}
                disabled={uploading}
                className="bg-sage-200 hover:bg-sage-300 disabled:bg-sage-100 text-sage-700 font-medium py-3 px-8 rounded-lg transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="bg-sage-50 border border-sage-200 rounded-lg p-4">
          <h3 className="font-semibold text-sage-800 mb-2">What happens after upload?</h3>
          <p className="text-sm text-sage-700">
            Your photos will be reviewed by the wedding hosts to ensure they're appropriate for
            the gallery. Once approved, they'll appear in the wedding photo gallery for all
            guests to enjoy. This usually takes 1-2 days.
          </p>
        </div>
      </main>
    </div>
  );
}
