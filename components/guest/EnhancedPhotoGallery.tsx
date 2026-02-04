'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface Photo {
  id: string;
  photo_url: string;
  caption?: string;
  alt_text?: string;
  display_order?: number;
}

interface EnhancedPhotoGalleryProps {
  photoIds: string[];
  displayMode?: 'gallery' | 'carousel' | 'loop' | 'flow';
  autoplayInterval?: number;
  showThumbnails?: boolean;
  className?: string;
}

/**
 * Enhanced Photo Gallery Component
 * 
 * Advanced photo display with multiple modes:
 * - gallery: Static grid layout
 * - carousel: Discrete slide transitions with navigation
 * - loop: Auto-playing slideshow
 * - flow: Continuous scrolling animation
 * 
 * Features:
 * - Thumbnail grid (optional)
 * - Lightbox mode
 * - User interaction pause/resume
 * - Seamless infinite loop
 * - Keyboard navigation
 */
export function EnhancedPhotoGallery({
  photoIds,
  displayMode = 'gallery',
  autoplayInterval = 4000,
  showThumbnails = false,
  className = '',
}: EnhancedPhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [userInteracting, setUserInteracting] = useState(false);
  const [offset, setOffset] = useState(0);

  const animationRef = useRef<number | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isFlowMode = displayMode === 'flow';
  const shouldAutoAdvance = displayMode === 'loop' || displayMode === 'flow';

  // Fetch photos
  useEffect(() => {
    async function fetchPhotos() {
      if (!photoIds || photoIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const photoPromises = photoIds.map(async (id) => {
          const response = await fetch(`/api/admin/photos/${id}`);
          if (!response.ok) return null;
          const result = await response.json();
          return result.success ? result.data : null;
        });

        const fetchedPhotos = await Promise.all(photoPromises);
        const validPhotos = fetchedPhotos
          .filter((p): p is Photo => p !== null)
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        
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

  // Flow carousel - continuous scrolling animation
  useEffect(() => {
    if (!isFlowMode || photos.length <= 1 || isPaused || isLightboxOpen || userInteracting) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const speed = 20 / autoplayInterval;
    let lastTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const deltaTime = now - lastTime;
      lastTime = now;

      setOffset((prev) => {
        const newOffset = prev + speed * deltaTime;
        return newOffset >= photos.length * 100 ? 0 : newOffset;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isFlowMode, photos.length, isPaused, isLightboxOpen, autoplayInterval, userInteracting]);

  // Discrete slide animation (loop mode)
  useEffect(() => {
    if (displayMode !== 'loop' || photos.length <= 1 || isPaused || isLightboxOpen || userInteracting) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, autoplayInterval);

    return () => clearInterval(interval);
  }, [displayMode, photos.length, isPaused, isLightboxOpen, autoplayInterval, userInteracting]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLightboxOpen || displayMode === 'carousel') {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          goToPrevious();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          goToNext();
        } else if (e.key === 'Escape' && isLightboxOpen) {
          setIsLightboxOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, displayMode, photos.length]);

  const handleUserInteraction = () => {
    setUserInteracting(true);
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    inactivityTimeoutRef.current = setTimeout(() => {
      setUserInteracting(false);
    }, 3000);
  };

  const goToPrevious = () => {
    handleUserInteraction();
    if (isFlowMode) {
      const currentPhotoIndex = Math.floor(offset / 100);
      const prevIndex = currentPhotoIndex === 0 ? photos.length - 1 : currentPhotoIndex - 1;
      setOffset(prevIndex * 100);
    } else {
      setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    }
  };

  const goToNext = () => {
    handleUserInteraction();
    if (isFlowMode) {
      const currentPhotoIndex = Math.floor(offset / 100);
      const nextIndex = (currentPhotoIndex + 1) % photos.length;
      setOffset(nextIndex * 100);
    } else {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }
  };

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setIsLightboxOpen(true);
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-sage-200 rounded-lg h-64 w-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-volcano-600 p-4 bg-volcano-50 rounded-lg ${className}`}>
        {error}
      </div>
    );
  }

  if (photos.length === 0) {
    return null;
  }

  const visiblePhotoIndex = isFlowMode ? Math.floor(offset / 100) % photos.length : currentIndex;
  const duplicatedPhotos = isFlowMode ? [...photos, ...photos] : photos;

  // Gallery Grid Mode
  if (displayMode === 'gallery') {
    return (
      <div className={className}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="relative aspect-square overflow-hidden rounded-lg bg-sage-100 cursor-pointer group"
              onClick={() => openLightbox(index)}
            >
              <Image
                src={photo.photo_url}
                alt={photo.alt_text || photo.caption || 'Wedding photo'}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
              />
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-sm">
                  {photo.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Carousel/Loop/Flow Modes
  return (
    <div className={className}>
      {/* Thumbnail Grid */}
      {showThumbnails && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className={`aspect-[4/3] rounded-lg overflow-hidden cursor-pointer transition-all ${
                index === visiblePhotoIndex
                  ? 'ring-2 ring-jungle-500 shadow-lg'
                  : 'hover:opacity-80'
              }`}
              onClick={() => {
                if (isFlowMode) {
                  setOffset(index * 100);
                } else {
                  setCurrentIndex(index);
                }
                handleUserInteraction();
              }}
            >
              <img
                src={photo.photo_url}
                alt={photo.alt_text || photo.caption || `Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Main Display */}
      <div
        className="relative bg-sage-100 rounded-lg overflow-hidden shadow-lg"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="aspect-video relative overflow-hidden">
          {isFlowMode ? (
            // Flow Carousel - Continuous scrolling
            <div
              className="flex h-full"
              style={{ transform: `translateX(-${offset}%)` }}
            >
              {duplicatedPhotos.map((photo, index) => (
                <div
                  key={`${photo.id}-${index}`}
                  className="h-full flex-shrink-0"
                  style={{ width: '100%' }}
                >
                  <img
                    src={photo.photo_url}
                    alt={photo.alt_text || photo.caption || ''}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            // Discrete transitions
            <div
              className="flex h-full transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {photos.map((photo) => (
                <div key={photo.id} className="w-full h-full flex-shrink-0">
                  <img
                    src={photo.photo_url}
                    alt={photo.alt_text || photo.caption || ''}
                    className="w-full h-full object-contain bg-sage-50"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Navigation Arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 text-white p-3 rounded-full hover:bg-black/90 transition z-10"
                aria-label="Previous photo"
              >
                ←
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 text-white p-3 rounded-full hover:bg-black/90 transition z-10"
                aria-label="Next photo"
              >
                →
              </button>
            </>
          )}
        </div>

        {/* Caption */}
        {photos[visiblePhotoIndex]?.caption && (
          <div className="p-4 bg-white">
            <p className="text-sage-700 text-center">
              {photos[visiblePhotoIndex].caption}
            </p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={photos[currentIndex].photo_url}
              alt={photos[currentIndex].alt_text || photos[currentIndex].caption || ''}
              className="max-w-full max-h-full object-contain"
            />

            {/* Close Button */}
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
              aria-label="Close lightbox"
            >
              ✕
            </button>

            {/* Navigation in Lightbox */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition"
                  aria-label="Previous photo"
                >
                  ←
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition"
                  aria-label="Next photo"
                >
                  →
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
