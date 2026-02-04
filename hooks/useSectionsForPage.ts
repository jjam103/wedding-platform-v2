import { useState, useEffect } from 'react';

interface Column {
  id: string;
  section_id: string;
  column_number: 1 | 2;
  content_type: 'rich_text' | 'photo_gallery' | 'references';
  content_data: any;
  created_at: string;
  updated_at: string;
}

interface Section {
  id: string;
  title?: string;
  page_type: 'activity' | 'event' | 'accommodation' | 'room_type' | 'custom' | 'home';
  page_id: string;
  display_order: number;
  created_at: string;
  updated_at: string;
  columns: Column[];
}

interface UseSectionsForPageReturn {
  sections: Section[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch sections for a specific page
 * 
 * @param pageType - Type of page (activity, event, accommodation, etc.)
 * @param pageId - ID of the page
 * @returns Sections data, loading state, error, and refetch function
 */
export function useSectionsForPage(
  pageType: string,
  pageId: string
): UseSectionsForPageReturn {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSections = async () => {
    if (!pageType || !pageId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/sections?pageType=${pageType}&pageId=${pageId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch sections: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        // Sort sections by display_order
        const sortedSections = (result.data || []).sort(
          (a: Section, b: Section) => a.display_order - b.display_order
        );
        setSections(sortedSections);
      } else {
        throw new Error(result.error?.message || 'Failed to fetch sections');
      }
    } catch (err) {
      console.error('Error fetching sections:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, [pageType, pageId]);

  return {
    sections,
    loading,
    error,
    refetch: fetchSections,
  };
}
