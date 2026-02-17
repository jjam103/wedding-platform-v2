'use client';

import { useState, useEffect } from 'react';
import { PhotoGallery } from '@/components/guest/PhotoGallery';

/**
 * Memories Page (Photo Gallery)
 * 
 * Displays approved wedding photos in a gallery view.
 * Guests can view photos but not upload (upload is admin-only).
 */

interface Photo {
  id: string;
  photo_url: string;
  caption?: string;
  alt_text?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function MemoriesPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/photos?status=approved');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch photos');
      }

      setPhotos(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-jungle-50 via-sunset-50 to-ocean-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-jungle-800 mb-2">
              Wedding Memories
            </h1>
            <p className="text-jungle-600">
              Relive the special moments
            </p>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-jungle-50 via-sunset-50 to-ocean-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-jungle-800 mb-2">
              Wedding Memories
            </h1>
            <p className="text-jungle-600">
              Relive the special moments
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Photos</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchPhotos}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-jungle-50 via-sunset-50 to-ocean-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-jungle-800 mb-2">
            Wedding Memories
          </h1>
          <p className="text-lg text-jungle-600">
            Relive the special moments from our celebration
          </p>
        </div>

        {/* Photo Gallery */}
        {photos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📸</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              No Photos Yet
            </h2>
            <p className="text-gray-600">
              Photos will appear here once they're uploaded and approved.
              Check back soon!
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <PhotoGallery
              photoIds={photos.map(p => p.id)}
              displayMode="gallery"
              showCaptions={true}
              className="w-full"
            />
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8 text-center">
          <a
            href="/guest/dashboard"
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
