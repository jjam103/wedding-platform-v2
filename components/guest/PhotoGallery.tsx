'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Photo {
  id: string;
  photo_url: string;
  caption?: string;
  alt_text?: string;
}

interface PhotoGalleryProps {
  photoIds: string[];
  displayMode?: 'gallery' | 'carousel' | 'loop';
  autoplaySpeed?: number; // Speed in milliseconds (default: 3000)
  showCaptions?: boolean; // Whether to show captions (default: true)
  className?: string;
}

/**
 * PhotoGallery Component
 * 
 * Displays photos in different modes:
 * - gallery: Static grid layout
 * - carousel: Discrete slide transitions with navigation
 * - loop: Auto-playing continuous loop
 * 
 * Fetches photo data from API and renders with proper display mode.
 */
export function PhotoGallery({ 
  photoIds, 
  displayMode = 'gallery', 
  autoplaySpeed = 3000,
  showCaptions = true,
  className = '' 
}: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function fetchPhotos() {
      if (!photoIds || photoIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch all photos in parallel from public endpoint
        const photoPromises = photoIds.map(async (id) => {
          const response = await fetch(`/api/photos/${id}`);
          if (!response.ok) {
            console.error(`Failed to fetch photo ${id}`);
            return null;
          }
          const result = await response.json();
          return result.success ? result.data : null;
        });

        const fetchedPhotos = await Promise.all(photoPromises);
        const validPhotos = fetchedPhotos.filter((p): p is Photo => p !== null);
        
        setPhotos(validPhotos);
      } catch (err) {
        console.error('Error fetching photos:', err);
        setError('Failed to load photos');
      } finally {
        setLoading(false);
      }
    }

    fetchPhotos();
  }, [photoIds]);

  // Auto-advance for loop mode only (carousel has manual controls)
  useEffect(() => {
    if (displayMode === 'loop' && photos.length > 1 && !loading) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % photos.length);
      }, autoplaySpeed);

      return () => clearInterval(interval);
    }
  }, [displayMode, photos.length, autoplaySpeed, loading]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-sage-200 rounded-lg h-64 w-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-600 p-4 bg-red-50 rounded-lg ${className}`}>
        {error}
      </div>
    );
  }

  if (photos.length === 0) {
    return null;
  }

  // Gallery Grid Mode
  if (displayMode === 'gallery') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 ${className}`}>
        {photos.map((photo) => (
          <div key={photo.id} className="space-y-2">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-sage-100">
              <Image
                src={photo.photo_url}
                alt={photo.alt_text || photo.caption || 'Wedding photo'}
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
              />
            </div>
            {showCaptions && photo.caption && (
              <p className="text-sm text-gray-700 text-center px-2">
                {photo.caption}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Carousel Mode (with navigation)
  if (displayMode === 'carousel') {
    const currentPhoto = photos[currentIndex];
    
    const goToPrevious = () => {
      setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    };

    const goToNext = () => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    };

    return (
      <div className={`space-y-3 ${className}`}>
        <div className="relative">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-sage-100">
            <Image
              src={currentPhoto.photo_url}
              alt={currentPhoto.alt_text || currentPhoto.caption || 'Wedding photo'}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Navigation Buttons */}
          {photos.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all"
                aria-label="Previous photo"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all"
                aria-label="Next photo"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Caption below image */}
        {showCaptions && currentPhoto.caption && (
          <p className="text-center text-gray-700 px-4">
            {currentPhoto.caption}
          </p>
        )}

        {/* Dots Indicator */}
        {photos.length > 1 && (
          <div className="flex justify-center gap-2">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-jungle-600 w-6' : 'bg-sage-300'
                }`}
                aria-label={`Go to photo ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Loop Mode (auto-playing)
  if (displayMode === 'loop') {
    const currentPhoto = photos[currentIndex];

    return (
      <div className={`space-y-3 ${className}`}>
        <div className="relative aspect-video overflow-hidden rounded-lg bg-sage-100">
          <Image
            src={currentPhoto.photo_url}
            alt={currentPhoto.alt_text || currentPhoto.caption || 'Wedding photo'}
            fill
            className="object-cover transition-opacity duration-1000"
            sizes="100vw"
            priority
          />
        </div>

        {/* Caption below image */}
        {showCaptions && currentPhoto.caption && (
          <p className="text-center text-gray-700 px-4">
            {currentPhoto.caption}
          </p>
        )}

        {/* Progress Indicator */}
        <div className="flex justify-center gap-1">
          {photos.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all ${
                index === currentIndex ? 'bg-jungle-600 w-8' : 'bg-sage-300 w-2'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
}
