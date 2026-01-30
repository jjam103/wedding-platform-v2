'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { Section, Column, CreateSectionDTO } from '@/schemas/cmsSchemas';
import { RichTextEditor } from './RichTextEditor';
import { PhotoGallerySkeleton } from './PhotoGallerySkeleton';

// Lazy load PhotoPicker component
const PhotoPicker = dynamic(() => import('./PhotoPicker').then(mod => ({ default: mod.PhotoPicker })), {
  loading: () => <PhotoGallerySkeleton />,
  ssr: false,
});

interface SectionEditorProps {
  pageType: 'activity' | 'event' | 'accommodation' | 'room_type' | 'custom' | 'home';
  pageId: string;
  onSave?: () => void;
  onClose?: () => void;
}

interface SectionWithColumns extends Section {
  columns: Column[];
}

interface SectionFormData {
  id?: string;
  layout: 'one-column' | 'two-column';
  columns: {
    columnNumber: 1 | 2;
    contentType: 'rich_text' | 'photo_gallery' | 'references';
    contentData: any;
  }[];
}

/**
 * SectionEditor component for managing page sections with rich content
 * 
 * Features:
 * - Drag-and-drop section reordering
 * - One-column and two-column layouts
 * - Rich text, photo gallery, and reference content types
 * - Preview as guest functionality
 * - Auto-save with debouncing
 */
export function SectionEditor({ pageType, pageId, onSave, onClose }: SectionEditorProps) {
  const [sections, setSections] = useState<SectionWithColumns[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

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

  const handleToggleLayout = useCallback(async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const currentLayout = section.columns.length === 1 ? 'one-column' : 'two-column';
    const newLayout = currentLayout === 'one-column' ? 'two-column' : 'one-column';

    const updatedColumns = newLayout === 'two-column'
      ? [
          ...section.columns,
          {
            column_number: 2 as const,
            content_type: 'rich_text' as const,
            content_data: { html: '' },
          },
        ]
      : [section.columns[0]];

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
              contentData = { photo_ids: [] };
              break;
            case 'references':
              contentData = { references: [] };
              break;
          }
          return { ...col, content_type: newType, content_data: contentData };
        }
        return col;
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
    async (sectionId: string, columnId: string, contentData: any) => {
      const section = sections.find(s => s.id === sectionId);
      if (!section) return;

      const updatedColumns = section.columns.map(col => {
        if (col.id === columnId) {
          return { ...col, content_data: contentData };
        }
        return col;
      });

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

      // Debounce the API call
      setSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/admin/sections/${sectionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ columns: updatedColumns }),
        });

        const result = await response.json();

        if (!result.success) {
          setError(result.error?.message || 'Failed to update content');
          // Revert on error
          fetchSections();
        }
      } catch (err) {
        setError('Failed to update content');
        fetchSections();
      } finally {
        setSaving(false);
      }
    },
    [sections, fetchSections]
  );

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading sections...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">Section Editor</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreview}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Preview as guest"
          >
            Preview as Guest
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Save all sections"
          >
            {saving ? 'Saving...' : 'Save All'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              aria-label="Close section editor"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          className="p-4 bg-red-50 border border-red-200 rounded-md"
          role="alert"
        >
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Add section button */}
      <button
        onClick={handleAddSection}
        disabled={saving}
        className="w-full px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 border-2 border-dashed border-blue-300 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Add new section"
      >
        + Add Section
      </button>

      {/* Sections list */}
      <div className="space-y-4">
        {sections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No sections yet. Click "Add Section" to get started.
          </div>
        ) : (
          sections.map((section, index) => (
            <div
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(section.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(section.id)}
              className={`border border-gray-200 rounded-lg bg-white shadow-sm ${
                draggedSection === section.id ? 'opacity-50' : ''
              }`}
            >
              {/* Section header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">
                    Section {index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleLayout(section.id)}
                      className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                      aria-label={`Toggle to ${
                        section.columns.length === 1 ? 'two' : 'one'
                      } column layout`}
                    >
                      {section.columns.length === 1 ? '1 Col' : '2 Col'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMoveUp(section.id)}
                    disabled={index === 0 || saving}
                    className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Move section up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMoveDown(section.id)}
                    disabled={index === sections.length - 1 || saving}
                    className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Move section down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    disabled={saving}
                    className="p-1 text-red-600 hover:text-red-900 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Delete section"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Section content */}
              <div
                className={`p-4 grid gap-4 ${
                  section.columns.length === 2 ? 'grid-cols-2' : 'grid-cols-1'
                }`}
              >
                {section.columns.map(column => (
                  <div
                    key={column.id}
                    className="border border-gray-200 rounded p-4 bg-white"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium text-gray-600">
                        Column {column.column_number}
                      </div>
                      <select
                        value={column.content_type}
                        onChange={e => handleColumnTypeChange(section.id, column.id, e.target.value as any)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                        disabled={saving}
                      >
                        <option value="rich_text">Rich Text</option>
                        <option value="photo_gallery">Photo Gallery</option>
                        <option value="references">References</option>
                      </select>
                    </div>
                    <div className="text-sm text-gray-700">
                      {column.content_type === 'rich_text' && (
                        <RichTextEditor
                          value={(column.content_data as any).html || ''}
                          onChange={html => handleColumnContentChange(section.id, column.id, { html })}
                          placeholder="Start typing or use / for commands..."
                          disabled={saving}
                        />
                      )}
                      {column.content_type === 'photo_gallery' && (
                        <PhotoPicker
                          selectedPhotoIds={(column.content_data as any).photo_ids || []}
                          onSelectionChange={photoIds =>
                            handleColumnContentChange(section.id, column.id, { photo_ids: photoIds })
                          }
                          pageType={
                            pageType === 'home' ? 'memory' :
                            pageType === 'custom' ? 'memory' :
                            pageType === 'room_type' ? 'accommodation' :
                            pageType
                          }
                          pageId={pageId}
                          disabled={saving}
                        />
                      )}
                      {column.content_type === 'references' && (
                        <div className="text-gray-600 p-4 border border-dashed border-gray-300 rounded text-center">
                          References ({(column.content_data as any).references?.length || 0} items)
                          <div className="text-xs text-gray-500 mt-2">
                            Reference lookup integration coming soon
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Guest Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-600 hover:text-gray-900"
                  aria-label="Close preview"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-6">
                {sections.map(section => (
                  <div
                    key={section.id}
                    className={`grid gap-6 ${
                      section.columns.length === 2 ? 'grid-cols-2' : 'grid-cols-1'
                    }`}
                  >
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
                          <div className="grid grid-cols-2 gap-4">
                            {((column.content_data as any).photo_ids || []).length > 0 ? (
                              ((column.content_data as any).photo_ids || []).map((photoId: string) => (
                                <div
                                  key={photoId}
                                  className="aspect-square rounded-lg overflow-hidden bg-gray-200"
                                >
                                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                                    Photo {photoId.slice(0, 8)}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="col-span-2 text-gray-500 text-center py-4">
                                No photos selected
                              </div>
                            )}
                          </div>
                        )}
                        {column.content_type === 'references' && (
                          <div className="text-gray-600">
                            [References Preview]
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
