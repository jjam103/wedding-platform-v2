'use client';

import { useState } from 'react';

interface Photo {
  id: string;
  photo_url: string;
  caption?: string;
  alt_text?: string;
  display_order?: number;
}

interface PhotoReorderListProps {
  photos: Photo[];
  onReorder: (photoIds: string[]) => Promise<void>;
  disabled?: boolean;
}

/**
 * Photo Reorder List Component
 * 
 * Allows drag-and-drop reordering of photos:
 * - Visual drag handles
 * - Live preview of reordering
 * - Save button to persist changes
 * - Up/down buttons for keyboard accessibility
 */
export function PhotoReorderList({ photos, onReorder, disabled = false }: PhotoReorderListProps) {
  const [orderedPhotos, setOrderedPhotos] = useState(photos);
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Update when photos prop changes
  useState(() => {
    setOrderedPhotos(photos);
    setHasChanges(false);
  });

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === index) return;

    const newPhotos = [...orderedPhotos];
    const draggedPhoto = newPhotos[draggedIndex];
    
    // Remove from old position
    newPhotos.splice(draggedIndex, 1);
    // Insert at new position
    newPhotos.splice(index, 0, draggedPhoto);
    
    setOrderedPhotos(newPhotos);
    setDraggedIndex(index);
    setHasChanges(true);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    
    const newPhotos = [...orderedPhotos];
    [newPhotos[index - 1], newPhotos[index]] = [newPhotos[index], newPhotos[index - 1]];
    
    setOrderedPhotos(newPhotos);
    setHasChanges(true);
  };

  const moveDown = (index: number) => {
    if (index === orderedPhotos.length - 1) return;
    
    const newPhotos = [...orderedPhotos];
    [newPhotos[index], newPhotos[index + 1]] = [newPhotos[index + 1], newPhotos[index]];
    
    setOrderedPhotos(newPhotos);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const photoIds = orderedPhotos.map(p => p.id);
      await onReorder(photoIds);
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to save photo order:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setOrderedPhotos(photos);
    setHasChanges(false);
  };

  if (orderedPhotos.length === 0) {
    return (
      <div className="text-center py-8 text-sage-600">
        No photos to reorder
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="bg-ocean-50 border border-ocean-200 rounded-lg p-3 text-sm text-ocean-800">
        <p className="font-medium mb-1">💡 Reorder Photos</p>
        <p>Drag photos to reorder them, or use the arrow buttons. Click "Save Order" when done.</p>
      </div>

      {/* Photo List */}
      <div className="space-y-2">
        {orderedPhotos.map((photo, index) => (
          <div
            key={photo.id}
            draggable={!disabled}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-3 p-3 bg-white border rounded-lg transition-all ${
              draggedIndex === index
                ? 'border-jungle-500 shadow-lg opacity-50'
                : 'border-sage-200 hover:border-sage-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-move'}`}
          >
            {/* Drag Handle */}
            <div className="flex-shrink-0 text-sage-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
              </svg>
            </div>

            {/* Order Number */}
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-sage-100 text-sage-700 font-medium rounded">
              {index + 1}
            </div>

            {/* Photo Thumbnail */}
            <div className="flex-shrink-0">
              <img
                src={photo.photo_url}
                alt={photo.alt_text || photo.caption || 'Photo'}
                className="w-16 h-16 object-cover rounded"
              />
            </div>

            {/* Photo Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sage-900 truncate">
                {photo.caption || 'Untitled Photo'}
              </p>
              {photo.alt_text && (
                <p className="text-xs text-sage-600 truncate">{photo.alt_text}</p>
              )}
            </div>

            {/* Move Buttons */}
            <div className="flex-shrink-0 flex gap-1">
              <button
                onClick={() => moveUp(index)}
                disabled={disabled || index === 0}
                className="p-1 text-sage-600 hover:text-sage-900 hover:bg-sage-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Move up"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={() => moveDown(index)}
                disabled={disabled || index === orderedPhotos.length - 1}
                className="p-1 text-sage-600 hover:text-sage-900 hover:bg-sage-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Move down"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      {hasChanges && (
        <div className="flex items-center gap-3 pt-4 border-t border-sage-200">
          <button
            onClick={handleSave}
            disabled={saving || disabled}
            className="flex-1 px-4 py-2 bg-jungle-600 hover:bg-jungle-700 disabled:bg-sage-400 text-white font-medium rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save Order'}
          </button>
          <button
            onClick={handleReset}
            disabled={saving || disabled}
            className="px-4 py-2 bg-sage-200 hover:bg-sage-300 disabled:bg-sage-100 text-sage-700 font-medium rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
