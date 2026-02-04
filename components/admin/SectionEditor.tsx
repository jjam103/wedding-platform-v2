'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import type { Section, Column, CreateSectionDTO, Reference } from '@/schemas/cmsSchemas';
import { RichTextEditor } from './RichTextEditor';
import { PhotoGallerySkeleton } from './PhotoGallerySkeleton';
import { Button } from '@/components/ui/Button';
import { SimpleReferenceSelector } from './SimpleReferenceSelector';
import { ReferencePreview } from './ReferencePreview';

// Lazy load PhotoPicker component
const PhotoPicker = dynamic(() => import('./PhotoPicker').then(mod => ({ default: mod.PhotoPicker })), {
  loading: () => <PhotoGallerySkeleton />,
  ssr: false,
});

// Photo Gallery Preview Component
function PhotoGalleryPreview({ 
  photoIds, 
  displayMode, 
  autoplaySpeed, 
  showCaptions 
}: { 
  photoIds: string[]; 
  displayMode: string;
  autoplaySpeed?: number;
  showCaptions?: boolean;
}) {
  const [photos, setPhotos] = useState<Array<{ id: string; photo_url: string; caption?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPhotos() {
      if (!photoIds || photoIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const photoPromises = photoIds.map(async (id) => {
          const response = await fetch(`/api/admin/photos/${id}`);
          if (!response.ok) {
            console.error(`Failed to fetch photo ${id}:`, response.status, response.statusText);
            return null;
          }
          const result = await response.json();
          if (result.success) {
            console.log(`Photo ${id} loaded:`, {
              url: result.data.photo_url,
              storage_type: result.data.storage_type,
            });
            return result.data;
          }
          console.error(`Photo ${id} fetch failed:`, result.error);
          return null;
        });

        const fetchedPhotos = await Promise.all(photoPromises);
        const validPhotos = fetchedPhotos.filter((p): p is { id: string; photo_url: string; caption?: string } => p !== null);
        console.log(`PhotoGalleryPreview: Loaded ${validPhotos.length} of ${photoIds.length} photos`);
        setPhotos(validPhotos);
      } catch (err) {
        console.error('Error fetching photos for preview:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPhotos();
  }, [photoIds]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="aspect-square rounded-lg bg-gray-200 animate-pulse"></div>
        <div className="aspect-square rounded-lg bg-gray-200 animate-pulse"></div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-gray-400 text-center py-4 text-sm">
        No photos selected
      </div>
    );
  }

  // Show display mode indicator with settings
  const modeLabel = displayMode === 'carousel' ? 'Carousel' : displayMode === 'loop' ? 'Auto-play Loop' : 'Gallery Grid';
  const speedLabel = autoplaySpeed ? `${autoplaySpeed / 1000}s` : '3s';

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="italic">Display Mode: {modeLabel}</span>
        {displayMode === 'loop' && autoplaySpeed && (
          <span className="italic">Speed: {speedLabel}</span>
        )}
        <span className="italic">Captions: {showCaptions !== false ? 'Shown' : 'Hidden'}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {photos.map((photo) => (
          <div key={photo.id} className="space-y-1">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-200 relative">
              <Image
                src={photo.photo_url}
                alt={photo.caption || 'Photo'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
                onError={(e) => {
                  console.error('Image failed to load in preview:', photo.photo_url);
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
                onLoad={() => {
                  console.log('Image loaded successfully in preview:', photo.photo_url);
                }}
              />
            </div>
            {showCaptions !== false && photo.caption && (
              <p className="text-xs text-gray-600 text-center truncate px-1">
                {photo.caption}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface SectionEditorProps {
  pageType: 'activity' | 'event' | 'accommodation' | 'room_type' | 'custom' | 'home';
  pageId: string;
  onSave?: () => void;
  onClose?: () => void;
}

interface SectionWithColumns extends Section {
  columns: Column[];
}

/**
 * SectionEditor component for managing page sections with rich content
 * 
 * Redesigned with improved UX:
 * - Clean section list with drag handles
 * - Section numbers and layout descriptions
 * - View/Edit/Delete action buttons
 * - Collapsible editing interface
 * - Guest preview section
 */
export function SectionEditor({ pageType, pageId, onSave, onClose }: SectionEditorProps) {
  const [sections, setSections] = useState<SectionWithColumns[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [viewingSection, setViewingSection] = useState<string | null>(null);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [unsavedChanges, setUnsavedChanges] = useState<Record<string, boolean>>({});
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Fetch sections on mount
  useEffect(() => {
    fetchSections();
  }, [pageType, pageId]);

  const fetchSections = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/sections/by-page/${pageType}/${pageId}`);
      const result = await response.json();
      
      if (result.success) {
        setSections(result.data || []);
      } else {
        setError(result.error?.message || 'Failed to load sections');
      }
    } catch (err) {
      setError('Failed to load sections');
    } finally {
      setLoading(false);
    }
  }, [pageType, pageId]);

  const handleAddSection = useCallback(async () => {
    const newSection: CreateSectionDTO = {
      page_type: pageType === 'home' ? 'custom' : pageType,
      page_id: pageId,
      display_order: sections.length,
      columns: [
        {
          column_number: 1,
          content_type: 'rich_text',
          content_data: { html: '' },
        },
      ],
    };

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSection),
      });

      const result = await response.json();

      if (result.success) {
        setSections(prev => [...prev, result.data]);
        setEditingSection(result.data.id);
      } else {
        setError(result.error?.message || 'Failed to create section');
      }
    } catch (err) {
      setError('Failed to create section');
    } finally {
      setSaving(false);
    }
  }, [pageType, pageId, sections.length]);

  const handleDeleteSection = useCallback(async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section?')) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/sections/${sectionId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setSections(prev => prev.filter(s => s.id !== sectionId));
      } else {
        setError(result.error?.message || 'Failed to delete section');
      }
    } catch (err) {
      setError('Failed to delete section');
    } finally {
      setSaving(false);
    }
  }, []);

  const handleTitleChange = useCallback((sectionId: string, title: string) => {
    // Update local state immediately
    setSections(prev =>
      prev.map(s => (s.id === sectionId ? { ...s, title } : s))
    );

    // Mark as unsaved
    setUnsavedChanges(prev => ({ ...prev, [sectionId]: true }));
  }, []);

  const handleToggleLayout = useCallback(async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const currentLayout = section.columns.length === 1 ? 'one-column' : 'two-column';
    const newLayout = currentLayout === 'one-column' ? 'two-column' : 'one-column';

    const updatedColumns = newLayout === 'two-column'
      ? [
          {
            column_number: section.columns[0].column_number,
            content_type: section.columns[0].content_type,
            content_data: section.columns[0].content_data,
          },
          {
            column_number: 2 as const,
            content_type: 'rich_text' as const,
            content_data: { html: '' },
          },
        ]
      : [
          {
            column_number: section.columns[0].column_number,
            content_type: section.columns[0].content_type,
            content_data: section.columns[0].content_data,
          },
        ];

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/sections/${sectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columns: updatedColumns }),
      });

      const result = await response.json();

      if (result.success) {
        setSections(prev =>
          prev.map(s => (s.id === sectionId ? result.data : s))
        );
      } else {
        setError(result.error?.message || 'Failed to update layout');
      }
    } catch (err) {
      setError('Failed to update layout');
    } finally {
      setSaving(false);
    }
  }, [sections]);

  const handleColumnTypeChange = useCallback(
    async (sectionId: string, columnId: string, newType: 'rich_text' | 'photo_gallery' | 'references') => {
      const section = sections.find(s => s.id === sectionId);
      if (!section) return;

      const updatedColumns = section.columns.map(col => {
        if (col.id === columnId) {
          let contentData: any;
          switch (newType) {
            case 'rich_text':
              contentData = { html: '' };
              break;
            case 'photo_gallery':
              contentData = { 
                photo_ids: [], 
                display_mode: 'gallery',
                autoplaySpeed: 3000,
                showCaptions: true
              };
              break;
            case 'references':
              contentData = { references: [] };
              break;
          }
          return {
            column_number: col.column_number,
            content_type: newType,
            content_data: contentData,
          };
        }
        return {
          column_number: col.column_number,
          content_type: col.content_type,
          content_data: col.content_data,
        };
      });

      setSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/admin/sections/${sectionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ columns: updatedColumns }),
        });

        const result = await response.json();

        if (result.success) {
          setSections(prev =>
            prev.map(s => (s.id === sectionId ? result.data : s))
          );
        } else {
          setError(result.error?.message || 'Failed to update column type');
        }
      } catch (err) {
        setError('Failed to update column type');
      } finally {
        setSaving(false);
      }
    },
    [sections]
  );

  const handleColumnContentChange = useCallback(
    (sectionId: string, columnId: string, contentData: any) => {
      const section = sections.find(s => s.id === sectionId);
      if (!section) return;

      // Update local state immediately for better UX
      setSections(prev =>
        prev.map(s => {
          if (s.id === sectionId) {
            return {
              ...s,
              columns: s.columns.map(col => {
                if (col.id === columnId) {
                  return { ...col, content_data: contentData };
                }
                return col;
              }),
            };
          }
          return s;
        })
      );

      // Mark as unsaved
      setUnsavedChanges(prev => ({ ...prev, [sectionId]: true }));
    },
    [sections]
  );

  const handleSaveSection = useCallback(async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    setSavingSection(sectionId);
    setError(null);

    try {
      // Prepare columns data for API
      const updatedColumns = section.columns.map(col => ({
        column_number: col.column_number,
        content_type: col.content_type,
        content_data: col.content_data,
      }));

      const payload = { 
        title: section.title || null,
        columns: updatedColumns 
      };

      console.log('[SectionEditor] Saving section:', sectionId);
      console.log('[SectionEditor] Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(`/api/admin/sections/${sectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('[SectionEditor] Response:', JSON.stringify(result, null, 2));

      if (result.success) {
        // Clear unsaved changes flag
        setUnsavedChanges(prev => {
          const newState = { ...prev };
          delete newState[sectionId];
          return newState;
        });
        
        // Update with server data
        setSections(prev =>
          prev.map(s => (s.id === sectionId ? result.data : s))
        );
      } else {
        console.error('[SectionEditor] Save failed:', result.error);
        setError(result.error?.message || 'Failed to save section');
      }
    } catch (err) {
      console.error('[SectionEditor] Save error:', err);
      setError('Failed to save section');
    } finally {
      setSavingSection(null);
    }
  }, [sections]);

  const handleDragStart = useCallback((sectionId: string) => {
    setDraggedSection(sectionId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    async (targetSectionId: string) => {
      if (!draggedSection || draggedSection === targetSectionId) {
        setDraggedSection(null);
        return;
      }

      const draggedIndex = sections.findIndex(s => s.id === draggedSection);
      const targetIndex = sections.findIndex(s => s.id === targetSectionId);

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedSection(null);
        return;
      }

      // Reorder sections locally
      const newSections = [...sections];
      const [removed] = newSections.splice(draggedIndex, 1);
      newSections.splice(targetIndex, 0, removed);

      // Update display_order
      const updatedSections = newSections.map((s, index) => ({
        ...s,
        display_order: index,
      }));

      setSections(updatedSections);
      setDraggedSection(null);

      // Save to server
      setSaving(true);
      setError(null);

      try {
        const response = await fetch('/api/admin/sections/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageId,
            sectionIds: updatedSections.map(s => s.id),
          }),
        });

        const result = await response.json();

        if (!result.success) {
          setError(result.error?.message || 'Failed to reorder sections');
          // Revert on error
          fetchSections();
        }
      } catch (err) {
        setError('Failed to reorder sections');
        fetchSections();
      } finally {
        setSaving(false);
      }
    },
    [draggedSection, sections, pageId, fetchSections]
  );

  const handleMoveUp = useCallback(
    async (sectionId: string) => {
      const index = sections.findIndex(s => s.id === sectionId);
      if (index <= 0) return;

      const newSections = [...sections];
      [newSections[index - 1], newSections[index]] = [
        newSections[index],
        newSections[index - 1],
      ];

      const updatedSections = newSections.map((s, i) => ({
        ...s,
        display_order: i,
      }));

      setSections(updatedSections);

      // Save to server
      setSaving(true);
      try {
        await fetch('/api/admin/sections/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageId,
            sectionIds: updatedSections.map(s => s.id),
          }),
        });
      } catch (err) {
        setError('Failed to reorder sections');
        fetchSections();
      } finally {
        setSaving(false);
      }
    },
    [sections, pageId, fetchSections]
  );

  const handleMoveDown = useCallback(
    async (sectionId: string) => {
      const index = sections.findIndex(s => s.id === sectionId);
      if (index === -1 || index >= sections.length - 1) return;

      const newSections = [...sections];
      [newSections[index], newSections[index + 1]] = [
        newSections[index + 1],
        newSections[index],
      ];

      const updatedSections = newSections.map((s, i) => ({
        ...s,
        display_order: i,
      }));

      setSections(updatedSections);

      // Save to server
      setSaving(true);
      try {
        await fetch('/api/admin/sections/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageId,
            sectionIds: updatedSections.map(s => s.id),
          }),
        });
      } catch (err) {
        setError('Failed to reorder sections');
        fetchSections();
      } finally {
        setSaving(false);
      }
    },
    [sections, pageId, fetchSections]
  );

  const handleSaveAll = useCallback(() => {
    if (onSave) {
      onSave();
    }
  }, [onSave]);

  const handlePreview = useCallback(() => {
    setShowPreview(true);
  }, []);

  const handleAddReference = useCallback((sectionId: string, columnId: string, reference: Reference) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const column = section.columns.find(c => c.id === columnId);
    if (!column || column.content_type !== 'references') return;

    const currentReferences = (column.content_data as any).references || [];
    const updatedReferences = [...currentReferences, reference];

    handleColumnContentChange(sectionId, columnId, { references: updatedReferences });
  }, [sections, handleColumnContentChange]);

  const handleRemoveReference = useCallback((sectionId: string, columnId: string, referenceIndex: number) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const column = section.columns.find(c => c.id === columnId);
    if (!column || column.content_type !== 'references') return;

    const currentReferences = (column.content_data as any).references || [];
    const updatedReferences = currentReferences.filter((_: any, idx: number) => idx !== referenceIndex);

    handleColumnContentChange(sectionId, columnId, { references: updatedReferences });
  }, [sections, handleColumnContentChange]);

  const validateReferences = useCallback(async (sectionId: string, columnId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const column = section.columns.find(c => c.id === columnId);
    if (!column || column.content_type !== 'references') return;

    const references = (column.content_data as any).references || [];
    if (references.length === 0) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${sectionId}-${columnId}`];
        return newErrors;
      });
      return;
    }

    try {
      // Check for circular references
      const circularResponse = await fetch('/api/admin/references/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          pageType,
          references,
        }),
      });

      const circularResult = await circularResponse.json();

      if (circularResult.success && circularResult.data.hasCircularReference) {
        setValidationErrors(prev => ({
          ...prev,
          [`${sectionId}-${columnId}`]: 'Circular reference detected. This would create an infinite loop.',
        }));
        return;
      }

      // Check for broken references
      const validationResponse = await fetch('/api/admin/references/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          references,
        }),
      });

      const validationResult = await validationResponse.json();

      if (validationResult.success && validationResult.data.brokenReferences?.length > 0) {
        const brokenIds = validationResult.data.brokenReferences.map((r: Reference) => r.id).join(', ');
        setValidationErrors(prev => ({
          ...prev,
          [`${sectionId}-${columnId}`]: `Broken references: ${brokenIds}`,
        }));
        return;
      }

      // Clear errors if validation passed
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${sectionId}-${columnId}`];
        return newErrors;
      });
    } catch (err) {
      console.error('Reference validation error:', err);
      setValidationErrors(prev => ({
        ...prev,
        [`${sectionId}-${columnId}`]: 'Failed to validate references',
      }));
    }
  }, [sections, pageId, pageType]);

  // Validate references when they change
  useEffect(() => {
    sections.forEach(section => {
      section.columns.forEach(column => {
        if (column.content_type === 'references') {
          validateReferences(section.id, column.id);
        }
      });
    });
  }, [sections, validateReferences]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading sections...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="section-editor">
      {/* Header with Add Section button and save status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900">Sections</h2>
          {Object.keys(unsavedChanges).length > 0 && (
            <span className="text-sm text-amber-600 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="4" />
              </svg>
              {Object.keys(unsavedChanges).length} section(s) with unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {Object.keys(unsavedChanges).length > 0 && (
            <Button
              onClick={async () => {
                // Save all sections with unsaved changes
                for (const sectionId of Object.keys(unsavedChanges)) {
                  await handleSaveSection(sectionId);
                }
              }}
              disabled={savingSection !== null}
              size="sm"
              variant="primary"
            >
              Save All Changes
            </Button>
          )}
          <Button
            onClick={handleAddSection}
            disabled={saving}
            size="sm"
            variant="primary"
          >
            + Add Section
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md" role="alert">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Sections list */}
      {sections.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No sections yet</p>
          <Button onClick={handleAddSection} disabled={saving} variant="primary" size="sm">
            Create First Section
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section, index) => (
            <div
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(section.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(section.id)}
              className={`border border-gray-200 rounded-lg bg-white shadow-sm transition-opacity ${
                draggedSection === section.id ? 'opacity-50' : ''
              }`}
            >
              {/* Section header - always visible */}
              <div className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3 flex-1">
                  {/* Drag handle */}
                  <div className="cursor-move text-gray-400 hover:text-gray-600">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <circle cx="4" cy="4" r="1.5" />
                      <circle cx="4" cy="8" r="1.5" />
                      <circle cx="4" cy="12" r="1.5" />
                      <circle cx="8" cy="4" r="1.5" />
                      <circle cx="8" cy="8" r="1.5" />
                      <circle cx="8" cy="12" r="1.5" />
                    </svg>
                  </div>
                  
                  {/* Section number and layout info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">#{index + 1}</span>
                      {section.title && (
                        <span className="text-gray-900">{section.title}</span>
                      )}
                      <span className="text-sm text-gray-500">
                        {section.columns.length === 1 ? 'One Column' : 'Two Columns'}
                      </span>
                      {/* Unsaved changes indicator */}
                      {unsavedChanges[section.id] && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <circle cx="10" cy="10" r="4" />
                          </svg>
                          Unsaved changes
                        </span>
                      )}
                    </div>
                    {section.columns.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {section.columns.map((col, idx) => (
                          <span key={col.id}>
                            {idx > 0 && ' • '}
                            {col.content_type === 'rich_text' && 'Rich Text'}
                            {col.content_type === 'photo_gallery' && 'Photo Gallery'}
                            {col.content_type === 'references' && 'References'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  {unsavedChanges[section.id] && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleSaveSection(section.id)}
                      disabled={savingSection === section.id}
                    >
                      {savingSection === section.id ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Saving...
                        </span>
                      ) : (
                        'Save Section'
                      )}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setViewingSection(viewingSection === section.id ? null : section.id)}
                  >
                    {viewingSection === section.id ? 'Hide' : 'View'}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditingSection(editingSection === section.id ? null : section.id)}
                  >
                    {editingSection === section.id ? 'Close' : 'Edit'}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeleteSection(section.id)}
                    disabled={saving}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* View mode - show content preview */}
              {viewingSection === section.id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className={`grid gap-4 ${section.columns.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {section.columns.map(column => (
                      <div key={column.id} className="bg-white rounded p-4 border border-gray-200">
                        <div className="text-xs font-medium text-gray-500 mb-2">
                          Column {column.column_number}
                        </div>
                        {column.content_type === 'rich_text' && (
                          <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: (column.content_data as any).html || '<p class="text-gray-400">No content</p>',
                            }}
                          />
                        )}
                        {column.content_type === 'photo_gallery' && (
                          <div className="text-sm text-gray-600">
                            {((column.content_data as any).photo_ids || []).length} photo(s)
                          </div>
                        )}
                        {column.content_type === 'references' && (
                          <div className="text-sm text-gray-600">
                            {((column.content_data as any).references || []).length} reference(s)
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Edit mode - show editing interface */}
              {editingSection === section.id && (
                <div className="border-t border-gray-200 p-4 bg-white space-y-4">
                  {/* Section title input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Section Title (optional)
                    </label>
                    <input
                      type="text"
                      value={section.title || ''}
                      onChange={(e) => handleTitleChange(section.id, e.target.value)}
                      placeholder="Enter a title for this section..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={savingSection === section.id}
                    />
                  </div>

                  {/* Layout selector */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Layout:</label>
                    <select
                      value={section.columns.length === 1 ? 'one-column' : 'two-column'}
                      onChange={(e) => handleToggleLayout(section.id)}
                      className="text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={savingSection === section.id}
                    >
                      <option value="one-column">One Column</option>
                      <option value="two-column">Two Columns</option>
                    </select>
                  </div>

                  {/* Column editors */}
                  <div className={`grid gap-4 ${section.columns.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {section.columns.map(column => (
                      <div key={column.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        {/* Column header with type selector */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-medium text-gray-700">
                            Column {column.column_number}
                          </div>
                          <select
                            value={column.content_type}
                            onChange={(e) => handleColumnTypeChange(section.id, column.id, e.target.value as any)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={savingSection === section.id}
                          >
                            <option value="rich_text">Rich Text</option>
                            <option value="photo_gallery">Photo Gallery</option>
                            <option value="references">References</option>
                          </select>
                        </div>

                        {/* Column content editor */}
                        <div className="bg-white rounded border border-gray-200 p-3">
                          {column.content_type === 'rich_text' && (
                            <RichTextEditor
                              value={(column.content_data as any).html || ''}
                              onChange={(html) => handleColumnContentChange(section.id, column.id, { html })}
                              placeholder="Start typing..."
                              disabled={savingSection === section.id}
                            />
                          )}
                          {column.content_type === 'photo_gallery' && (
                            <div className="space-y-3">
                              {/* Display mode selector */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Display Mode
                                </label>
                                <select
                                  value={(column.content_data as any).display_mode || 'gallery'}
                                  onChange={(e) => {
                                    const currentData = column.content_data as any;
                                    handleColumnContentChange(section.id, column.id, {
                                      photo_ids: currentData.photo_ids || [],
                                      display_mode: e.target.value,
                                      autoplaySpeed: currentData.autoplaySpeed || 3000,
                                      showCaptions: currentData.showCaptions !== false,
                                    });
                                  }}
                                  className="w-full text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  disabled={savingSection === section.id}
                                >
                                  <option value="gallery">Gallery Grid</option>
                                  <option value="carousel">Carousel</option>
                                  <option value="loop">Auto-play Loop</option>
                                </select>
                              </div>

                              {/* Autoplay speed (only for loop mode) */}
                              {(column.content_data as any).display_mode === 'loop' && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Autoplay Speed (seconds)
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    step="0.5"
                                    value={((column.content_data as any).autoplaySpeed || 3000) / 1000}
                                    onChange={(e) => {
                                      const currentData = column.content_data as any;
                                      handleColumnContentChange(section.id, column.id, {
                                        photo_ids: currentData.photo_ids || [],
                                        display_mode: currentData.display_mode || 'gallery',
                                        autoplaySpeed: parseFloat(e.target.value) * 1000,
                                        showCaptions: currentData.showCaptions !== false,
                                      });
                                    }}
                                    className="w-full text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={savingSection === section.id}
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    How long each photo displays before transitioning
                                  </p>
                                </div>
                              )}

                              {/* Show captions toggle */}
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`show-captions-${column.id}`}
                                  checked={(column.content_data as any).showCaptions !== false}
                                  onChange={(e) => {
                                    const currentData = column.content_data as any;
                                    handleColumnContentChange(section.id, column.id, {
                                      photo_ids: currentData.photo_ids || [],
                                      display_mode: currentData.display_mode || 'gallery',
                                      autoplaySpeed: currentData.autoplaySpeed || 3000,
                                      showCaptions: e.target.checked,
                                    });
                                  }}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  disabled={savingSection === section.id}
                                />
                                <label htmlFor={`show-captions-${column.id}`} className="text-xs font-medium text-gray-700">
                                  Show photo captions
                                </label>
                              </div>
                              
                              {/* Photo picker */}
                              <PhotoPicker
                                selectedPhotoIds={(column.content_data as any).photo_ids || []}
                                onSelectionChange={(photoIds) => {
                                  const currentData = column.content_data as any;
                                  handleColumnContentChange(section.id, column.id, {
                                    photo_ids: photoIds,
                                    display_mode: currentData.display_mode || 'gallery',
                                    autoplaySpeed: currentData.autoplaySpeed || 3000,
                                    showCaptions: currentData.showCaptions !== false,
                                  });
                                }}
                                pageType={
                                  pageType === 'home' ? 'memory' :
                                  pageType === 'custom' ? 'memory' :
                                  pageType === 'room_type' ? 'accommodation' :
                                  pageType
                                }
                                pageId={pageId}
                                disabled={savingSection === section.id}
                              />
                            </div>
                          )}
                          {column.content_type === 'references' && (
                            <div className="space-y-3">
                              {/* Validation errors */}
                              {validationErrors[`${section.id}-${column.id}`] && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                                  <div className="flex items-start gap-2">
                                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{validationErrors[`${section.id}-${column.id}`]}</span>
                                  </div>
                                </div>
                              )}

                              {/* Selected references list */}
                              {((column.content_data as any).references || []).length > 0 && (
                                <div className="space-y-2 mb-4">
                                  <h4 className="text-sm font-medium text-gray-700">Selected References</h4>
                                  {((column.content_data as any).references || []).map((ref: Reference, idx: number) => (
                                    <ReferencePreview
                                      key={`${ref.type}-${ref.id}-${idx}`}
                                      reference={ref}
                                      onRemove={() => handleRemoveReference(section.id, column.id, idx)}
                                    />
                                  ))}
                                </div>
                              )}

                              {/* Simple Reference Selector */}
                              <SimpleReferenceSelector
                                onSelect={(reference) => handleAddReference(section.id, column.id, reference)}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Guest Preview - collapsible section */}
      <div className="border border-gray-200 rounded-lg bg-white">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <span className="font-semibold text-gray-900">Guest Preview</span>
          <span className="text-gray-500">{showPreview ? '▼' : '▶'}</span>
        </button>
        
        {showPreview && (
          <div className="border-t border-gray-200 p-6 space-y-6">
            {sections.length === 0 ? (
              <p className="text-gray-500 text-center">No sections to preview</p>
            ) : (
              sections.map((section, index) => (
                <div key={section.id} className="space-y-2">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Section {index + 1}
                  </div>
                  <div className={`grid gap-6 ${section.columns.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {section.columns.map(column => (
                      <div key={column.id}>
                        {column.content_type === 'rich_text' && (
                          <div
                            className="prose max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: (column.content_data as any).html || '',
                            }}
                          />
                        )}
                        {column.content_type === 'photo_gallery' && (
                          <PhotoGalleryPreview
                            photoIds={(column.content_data as any).photo_ids || []}
                            displayMode={(column.content_data as any).display_mode || 'gallery'}
                            autoplaySpeed={(column.content_data as any).autoplaySpeed}
                            showCaptions={(column.content_data as any).showCaptions}
                          />
                        )}
                        {column.content_type === 'references' && (
                          <div className="text-gray-500 text-sm">
                            [References Preview]
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
