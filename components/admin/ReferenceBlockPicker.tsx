'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';

interface Reference {
  type: 'event' | 'activity' | 'content_page' | 'accommodation';
  id: string;
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface ReferenceSearchResult {
  events: Array<{ id: string; name: string; slug?: string; date?: string; location?: string }>;
  activities: Array<{ id: string; name: string; slug?: string; date?: string; capacity?: number }>;
  content_pages: Array<{ id: string; title: string; slug: string; type?: string }>;
  accommodations: Array<{ id: string; name: string; slug?: string; location?: string; room_count?: number }>;
}

interface ReferenceBlockPickerProps {
  onSelect: (reference: Reference) => void;
  onClose: () => void;
  pageType: string;
  pageId: string;
}

export function ReferenceBlockPicker({ onSelect, onClose, pageType, pageId }: ReferenceBlockPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['event', 'activity', 'content_page', 'accommodation']);
  const [results, setResults] = useState<ReferenceSearchResult>({
    events: [],
    activities: [],
    content_pages: [],
    accommodations: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search function
  const performSearch = useCallback(async (query: string, types: string[]) => {
    if (!query.trim()) {
      setResults({
        events: [],
        activities: [],
        content_pages: [],
        accommodations: [],
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const typesParam = types.join(',');
      const response = await fetch(`/api/admin/references/search?q=${encodeURIComponent(query)}&types=${typesParam}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const result = await response.json();
      
      if (result.success) {
        setResults(result.data);
      } else {
        setError(result.error?.message || 'Search failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search input (300ms)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery, selectedTypes);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, selectedTypes, performSearch]);

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleSelectReference = (reference: Reference) => {
    onSelect(reference);
    onClose();
  };

  const renderEventCard = (event: { id: string; name: string; slug?: string; date?: string; location?: string }) => (
    <div
      key={event.id}
      className="border border-gray-200 rounded-lg p-4 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer transition-colors"
      onClick={() => handleSelectReference({
        type: 'event',
        id: event.id,
        name: event.name,
        metadata: { slug: event.slug, date: event.date, location: event.location },
      })}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
              Event
            </span>
            <h4 className="font-medium text-gray-900">{event.name}</h4>
          </div>
          {event.date && (
            <p className="text-sm text-gray-600 mt-1">📅 {new Date(event.date).toLocaleDateString()}</p>
          )}
          {event.location && (
            <p className="text-sm text-gray-600">📍 {event.location}</p>
          )}
        </div>
        <Button size="sm" variant="ghost">
          Add
        </Button>
      </div>
    </div>
  );

  const renderActivityCard = (activity: { id: string; name: string; slug?: string; date?: string; capacity?: number }) => (
    <div
      key={activity.id}
      className="border border-gray-200 rounded-lg p-4 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer transition-colors"
      onClick={() => handleSelectReference({
        type: 'activity',
        id: activity.id,
        name: activity.name,
        metadata: { slug: activity.slug, date: activity.date, capacity: activity.capacity },
      })}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
              Activity
            </span>
            <h4 className="font-medium text-gray-900">{activity.name}</h4>
          </div>
          {activity.date && (
            <p className="text-sm text-gray-600 mt-1">📅 {new Date(activity.date).toLocaleDateString()}</p>
          )}
          {activity.capacity && (
            <p className="text-sm text-gray-600">👥 Capacity: {activity.capacity}</p>
          )}
        </div>
        <Button size="sm" variant="ghost">
          Add
        </Button>
      </div>
    </div>
  );

  const renderContentPageCard = (page: { id: string; title: string; slug: string; type?: string }) => (
    <div
      key={page.id}
      className="border border-gray-200 rounded-lg p-4 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer transition-colors"
      onClick={() => handleSelectReference({
        type: 'content_page',
        id: page.id,
        name: page.title,
        metadata: { slug: page.slug, type: page.type },
      })}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
              Page
            </span>
            <h4 className="font-medium text-gray-900">{page.title}</h4>
          </div>
          <p className="text-sm text-gray-600 mt-1">🔗 /{page.slug}</p>
        </div>
        <Button size="sm" variant="ghost">
          Add
        </Button>
      </div>
    </div>
  );

  const renderAccommodationCard = (accommodation: { id: string; name: string; slug?: string; location?: string; room_count?: number }) => (
    <div
      key={accommodation.id}
      className="border border-gray-200 rounded-lg p-4 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer transition-colors"
      onClick={() => handleSelectReference({
        type: 'accommodation',
        id: accommodation.id,
        name: accommodation.name,
        metadata: { slug: accommodation.slug, location: accommodation.location, room_count: accommodation.room_count },
      })}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
              Accommodation
            </span>
            <h4 className="font-medium text-gray-900">{accommodation.name}</h4>
          </div>
          {accommodation.location && (
            <p className="text-sm text-gray-600 mt-1">📍 {accommodation.location}</p>
          )}
          {accommodation.room_count && (
            <p className="text-sm text-gray-600">🏠 {accommodation.room_count} rooms</p>
          )}
        </div>
        <Button size="sm" variant="ghost">
          Add
        </Button>
      </div>
    </div>
  );

  const hasResults = results.events.length > 0 || 
                     results.activities.length > 0 || 
                     results.content_pages.length > 0 || 
                     results.accommodations.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Add Reference Block</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200 space-y-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, activities, pages, accommodations..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Type
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'event', label: 'Events', color: 'purple' },
                { value: 'activity', label: 'Activities', color: 'blue' },
                { value: 'content_page', label: 'Pages', color: 'green' },
                { value: 'accommodation', label: 'Accommodations', color: 'orange' },
              ].map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => handleTypeToggle(value)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTypes.includes(value)
                      ? `bg-${color}-100 text-${color}-800 border-2 border-${color}-500`
                      : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          )}

          {!loading && !error && !searchQuery.trim() && (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-lg font-medium">Start typing to search</p>
              <p className="text-sm mt-1">Search for events, activities, pages, or accommodations to add as references</p>
            </div>
          )}

          {!loading && !error && searchQuery.trim() && !hasResults && (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          )}

          {!loading && !error && hasResults && (
            <div className="space-y-6">
              {results.events.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Events ({results.events.length})</h3>
                  <div className="space-y-2">
                    {results.events.map(renderEventCard)}
                  </div>
                </div>
              )}

              {results.activities.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Activities ({results.activities.length})</h3>
                  <div className="space-y-2">
                    {results.activities.map(renderActivityCard)}
                  </div>
                </div>
              )}

              {results.content_pages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Content Pages ({results.content_pages.length})</h3>
                  <div className="space-y-2">
                    {results.content_pages.map(renderContentPageCard)}
                  </div>
                </div>
              )}

              {results.accommodations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Accommodations ({results.accommodations.length})</h3>
                  <div className="space-y-2">
                    {results.accommodations.map(renderAccommodationCard)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
