import { useState, useCallback, useEffect } from 'react';
import * as sectionsService from '@/services/sectionsService';

interface Column {
  id?: string;
  column_number: number;
  content_type: string;
  content_data: any;
}

interface Section {
  id: string;
  page_type: string;
  page_id: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface SectionWithColumns extends Section {
  columns: Column[];
}

interface AvailableItem {
  id: string;
  type: string;
  title: string;
  slug?: string;
}

interface UseSectionDataReturn {
  sections: SectionWithColumns[];
  availableItems: AvailableItem[];
  loading: boolean;
  error: string | null;
  loadSections: () => Promise<void>;
  createSection: (data: Partial<Section>) => Promise<void>;
  updateSection: (id: string, data: Partial<Section>) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;
  reorderSections: (sections: SectionWithColumns[]) => Promise<void>;
}

/**
 * Custom hook for managing sections
 * 
 * Provides centralized section operations:
 * - Load sections for a page
 * - Create, update, delete sections
 * - Reorder sections
 * - Load available items for references
 * - Loading and error states
 */
export function useSectionData(pageSlug: string): UseSectionDataReturn {
  const [sections, setSections] = useState<SectionWithColumns[]>([]);
  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSections = useCallback(async () => {
    if (!pageSlug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Parse pageSlug to get pageType and pageId
      // Expected format: "pageType:pageId" or just use as pageId with default type
      const [pageType, pageId] = pageSlug.includes(':') 
        ? pageSlug.split(':') 
        : ['custom', pageSlug];

      const result = await sectionsService.listSections(pageType, pageId);

      if (result.success) {
        setSections(result.data);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sections');
    } finally {
      setLoading(false);
    }
  }, [pageSlug]);

  const loadAvailableItems = useCallback(async () => {
    try {
      // Load events
      const eventsResponse = await fetch('/api/admin/events');
      const eventsResult = await eventsResponse.json();
      const events = eventsResult.success ? eventsResult.data : [];

      // Load activities
      const activitiesResponse = await fetch('/api/admin/activities');
      const activitiesResult = await activitiesResponse.json();
      const activities = activitiesResult.success ? activitiesResult.data : [];

      // Load content pages
      const pagesResponse = await fetch('/api/admin/content-pages');
      const pagesResult = await pagesResponse.json();
      const pages = pagesResult.success ? pagesResult.data : [];

      // Load locations
      const locationsResponse = await fetch('/api/admin/locations');
      const locationsResult = await locationsResponse.json();
      const locations = locationsResult.success ? locationsResult.data : [];

      // Combine all items
      const items: AvailableItem[] = [
        ...events.map((e: any) => ({ id: e.id, type: 'event', title: e.title, slug: e.slug })),
        ...activities.map((a: any) => ({ id: a.id, type: 'activity', title: a.title, slug: a.slug })),
        ...pages.map((p: any) => ({ id: p.id, type: 'content_page', title: p.title, slug: p.slug })),
        ...locations.map((l: any) => ({ id: l.id, type: 'location', title: l.name })),
      ];

      setAvailableItems(items);
    } catch (err) {
      console.error('Failed to load available items:', err);
    }
  }, []);

  const createSection = useCallback(async (data: Partial<Section>) => {
    try {
      const [pageType, pageId] = pageSlug.includes(':') 
        ? pageSlug.split(':') 
        : ['custom', pageSlug];

      const result = await sectionsService.createSection({
        page_type: pageType as any,
        page_id: pageId,
        display_order: data.display_order || 0,
        columns: [
          {
            column_number: 1,
            content_type: 'rich_text',
            content_data: { html: '' },
          },
        ],
      });

      if (!result.success) {
        throw new Error(result.error.message);
      }

      await loadSections();
    } catch (err) {
      throw err;
    }
  }, [pageSlug, loadSections]);

  const updateSection = useCallback(async (id: string, data: Partial<Section>) => {
    try {
      const updateData: any = {};
      
      if (data.display_order !== undefined) {
        updateData.display_order = data.display_order;
      }

      const result = await sectionsService.updateSection(id, updateData);

      if (!result.success) {
        throw new Error(result.error.message);
      }

      await loadSections();
    } catch (err) {
      throw err;
    }
  }, [loadSections]);

  const deleteSection = useCallback(async (id: string) => {
    try {
      const result = await sectionsService.deleteSection(id);

      if (!result.success) {
        throw new Error(result.error.message);
      }

      await loadSections();
    } catch (err) {
      throw err;
    }
  }, [loadSections]);

  const reorderSections = useCallback(async (reorderedSections: SectionWithColumns[]) => {
    try {
      const [pageType, pageId] = pageSlug.includes(':') 
        ? pageSlug.split(':') 
        : ['custom', pageSlug];

      const sectionIds = reorderedSections.map(s => s.id);
      const result = await sectionsService.reorderSections(pageId, sectionIds);

      if (!result.success) {
        throw new Error(result.error.message);
      }

      // Update local state immediately for better UX
      setSections(reorderedSections.map((s, i) => ({ ...s, display_order: i })));
    } catch (err) {
      throw err;
    }
  }, [pageSlug]);

  // Load sections on mount and when pageSlug changes
  useEffect(() => {
    loadSections();
  }, [loadSections]);

  // Load available items on mount
  useEffect(() => {
    loadAvailableItems();
  }, [loadAvailableItems]);

  return {
    sections,
    availableItems,
    loading,
    error,
    loadSections,
    createSection,
    updateSection,
    deleteSection,
    reorderSections,
  };
}
