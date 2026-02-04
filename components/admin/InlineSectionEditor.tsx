'use client';

import { useState, useCallback, useEffect } from 'react';
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

interface InlineSectionEditorProps {
  pageType: 'home' | 'activity' | 'event' | 'accommodation' | 'room_type' | 'custom';
  pageId: string;
  onSave?: () => void;
  compact?: boolean;
  entityName?: string;
  defaultExpanded?: boolean;
}

interface SectionWithColumns extends Section {
  columns: Column[];
}

/**
 * InlineSectionEditor component for managing page sections inline
 * 
 * Simplified version of SectionEditor designed for embedding on the home page.
 * Features:
 * - Compact inline editing interface
 * - Add/edit/delete sections
 * - Drag-and-drop reordering
 * - Photo picker integration
 * - Reference block picker integration
 * - Auto-save functionality with debouncing
 */
export function InlineSectionEditor({ pageType, pageId, onSave, compact = false, entityName, defaultExpanded = false }: InlineSectionEditorProps) {
  const [sections, setSections] = useState<SectionWithColumns[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
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
    setSections(prev =>
      prev.map(s => (s.id === sectionId ? { ...s, title } : s))
    );
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
      const updatedColumns = section.columns.map(col => ({
        column_number: col.column_number,
        content_type: col.content_type,
        content_data: col.content_data,
      }));

      const payload = { 
        title: section.title || null,
        columns: updatedColumns 
      };

      const response = await fetch(`/api/admin/sections/${sectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setUnsavedChanges(prev => {
          const newState = { ...prev };
          delete newState[sectionId];
          return newState;
        });
        
        setSections(prev =>
          prev.map(s => (s.id === sectionId ? result.data : s))
        );

        if (onSave) {
          onSave();
        }
      } else {
        setError(result.error?.message || 'Failed to save section');
      }
    } catch (err) {
      setError('Failed to save section');
    } finally {
      setSavingSection(null);
    }
  }, [sections, onSave]);

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

      const newSections = [...sections];
      const [removed] = newSections.splice(draggedIndex, 1);
      newSections.splice(targetIndex, 0, removed);

      const updatedSections = newSections.map((s, index) => ({
        ...s,
        display_order: index,
      }));

      setSections(updatedSections);
      setDraggedSection(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-gray-600 text-sm">Loading sections...</div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${compact ? 'text-sm' : ''}`} data-testid="inline-section-editor">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className={`font-semibold text-gray-900 ${compact ? 'text-base' : 'text-lg'}`}>
            Page Sections
          </h3>
          {Object.keys(unsavedChanges).length > 0 && (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="4" />
              </svg>
              {Object.keys(unsavedChanges).length} unsaved
            </span>
          )}
        </div>
        <Button
          onClick={handleAddSection}
          disabled={saving}
          size="sm"
          variant="primary"
        >
          + Add Section
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm" role="alert">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Sections list */}
      {sections.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 text-sm mb-3">No sections yet</p>
          <Button onClick={handleAddSection} disabled={saving} variant="primary" size="sm">
            Create First Section
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
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
              {/* Section header */}
              <div className="flex items-center justify-between p-3 hover:bg-gray-50">
                <div className="flex items-center gap-2 flex-1">
                  {/* Drag handle */}
                  <div className="cursor-move text-gray-400 hover:text-gray-600">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <circle cx="4" cy="4" r="1.5" />
                      <circle cx="4" cy="8" r="1.5" />
                      <circle cx="4" cy="12" r="1.5" />
                      <circle cx="8" cy="4" r="1.5" />
                      <circle cx="8" cy="8" r="1.5" />
                      <circle cx="8" cy="12" r="1.5" />
                    </svg>
                  </div>
                  
                  {/* Section info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">#{index + 1}</span>
                      {section.title && (
                        <span className="text-gray-900 text-sm">{section.title}</span>
                      )}
                      <span className="text-xs text-gray-500">
                        {section.columns.length === 1 ? '1 Col' : '2 Cols'}
                      </span>
                      {unsavedChanges[section.id] && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                            <circle cx="10" cy="10" r="4" />
                          </svg>
                          Unsaved
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5">
                  {unsavedChanges[section.id] && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleSaveSection(section.id)}
                      disabled={savingSection === section.id}
                    >
                      {savingSection === section.id ? 'Saving...' : 'Save'}
                    </Button>
                  )}
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

              {/* Edit mode */}
              {editingSection === section.id && (
                <div className="border-t border-gray-200 p-3 bg-white space-y-3">
                  {/* Section title input */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Section Title (optional)
                    </label>
                    <input
                      type="text"
                      value={section.title || ''}
                      onChange={(e) => handleTitleChange(section.id, e.target.value)}
                      placeholder="Enter a title..."
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={savingSection === section.id}
                    />
                  </div>

                  {/* Layout selector */}
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-gray-700">Layout:</label>
                    <select
                      value={section.columns.length === 1 ? 'one-column' : 'two-column'}
                      onChange={(e) => handleToggleLayout(section.id)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={savingSection === section.id}
                    >
                      <option value="one-column">One Column</option>
                      <option value="two-column">Two Columns</option>
                    </select>
                  </div>

                  {/* Column editors */}
                  <div className={`grid gap-3 ${section.columns.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {section.columns.map(column => (
                      <div key={column.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        {/* Column header with type selector */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-medium text-gray-700">
                            Column {column.column_number}
                          </div>
                          <select
                            value={column.content_type}
                            onChange={(e) => handleColumnTypeChange(section.id, column.id, e.target.value as any)}
                            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={savingSection === section.id}
                          >
                            <option value="rich_text">Rich Text</option>
                            <option value="photo_gallery">Photo Gallery</option>
                            <option value="references">References</option>
                          </select>
                        </div>

                        {/* Column content editor */}
                        <div className="bg-white rounded border border-gray-200 p-2">
                          {column.content_type === 'rich_text' && (
                            <RichTextEditor
                              value={(column.content_data as any).html || ''}
                              onChange={(html) => handleColumnContentChange(section.id, column.id, { html })}
                              placeholder="Start typing..."
                              disabled={savingSection === section.id}
                            />
                          )}
                          {column.content_type === 'photo_gallery' && (
                            <div className="space-y-2">
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
                                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  disabled={savingSection === section.id}
                                >
                                  <option value="gallery">Gallery Grid</option>
                                  <option value="carousel">Carousel</option>
                                  <option value="loop">Auto-play Loop</option>
                                </select>
                              </div>

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
                                  Show captions
                                </label>
                              </div>
                              
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
                                pageType="memory"
                                pageId={pageId}
                                disabled={savingSection === section.id}
                              />
                            </div>
                          )}
                          {column.content_type === 'references' && (
                            <div className="space-y-2">
                              {((column.content_data as any).references || []).length > 0 && (
                                <div className="space-y-1.5 mb-3">
                                  <h4 className="text-xs font-medium text-gray-700">Selected References</h4>
                                  {((column.content_data as any).references || []).map((ref: Reference, idx: number) => (
                                    <ReferencePreview
                                      key={`${ref.type}-${ref.id}-${idx}`}
                                      reference={ref}
                                      onRemove={() => handleRemoveReference(section.id, column.id, idx)}
                                    />
                                  ))}
                                </div>
                              )}

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
    </div>
  );
}
