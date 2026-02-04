'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import type { Reference } from '@/schemas/cmsSchemas';

interface ReferenceSearchResult {
  events: Array<{ id: string; name: string; slug?: string; date?: string; location?: string }>;
  activities: Array<{ id: string; name: string; slug?: string; date?: string; capacity?: number }>;
  content_pages: Array<{ id: string; title: string; slug: string; type?: string }>;
  accommodations: Array<{ id: string; name: string; slug?: string; location?: string; room_count?: number }>;
}

interface InlineReferenceSelectorProps {
  onSelect: (reference: Reference) => void;
  pageType: string;
  pageId: string;
}

export function InlineReferenceSelector({ onSelect, pageType, pageId }: InlineReferenceSelectorProps) {
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
  const [isExpanded, setIsExpanded] = useState(false);
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
    // Reset search after selection
    setSearchQuery('');
    setIsExpanded(false);
  };

  const hasResults = results.events.length > 0 || 
                     results.activities.length > 0 || 
                     results.content_pages.length > 0 || 
                     results.accommodations.length > 0;

  return (
    <div className="border border-gray-300 rounded-lg bg-white">
      {/* Search Input */}
      <div className="p-3 space-y-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isExpanded && e.target.value) setIsExpanded(true);
          }}
          onFocus={() => setIsExpanded(true)}
          placeholder="Search events, activities, pages, accommodations..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
        />

        {/* Type Filters */}
        {isExpanded && (
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
                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedTypes.includes(value)
                    ? `bg-${color}-100 text-${color}-800 border border-${color}-500`
                    : 'bg-gray-100 text-gray-600 border border-transparent hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {isExpanded && (
        <div className="border-t border-gray-200 max-h-96 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border-b border-red-200 text-red-800 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && !searchQuery.trim() && (
            <div className="text-center py-8 text-gray-500 text-sm">
              <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p>Start typing to search</p>
            </div>
          )}

          {!loading && !error && searchQuery.trim() && !hasResults && (
            <div className="text-center py-8 text-gray-500 text-sm">
              <p>No results found</p>
              <p className="text-xs mt-1">Try adjusting your search or filters</p>
            </div>
          )}

          {!loading && !error && hasResults && (
            <div className="divide-y divide-gray-200">
              {results.events.length > 0 && (
                <div className="p-3">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Events ({results.events.length})</h4>
                  <div className="space-y-1">
                    {results.events.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => handleSelectReference({
                          type: 'event',
                          id: event.id,
                          name: event.name,
                          metadata: { slug: event.slug, date: event.date, location: event.location },
                        })}
                        className="w-full text-left px-2 py-2 rounded hover:bg-purple-50 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="inline-block px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                                Event
                              </span>
                              <span className="font-medium text-sm text-gray-900 truncate">{event.name}</span>
                            </div>
                            {(event.date || event.location) && (
                              <div className="flex gap-2 mt-1 text-xs text-gray-600">
                                {event.date && <span>📅 {new Date(event.date).toLocaleDateString()}</span>}
                                {event.location && <span>📍 {event.location}</span>}
                              </div>
                            )}
                          </div>
                          <span className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                            Add →
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.activities.length > 0 && (
                <div className="p-3">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Activities ({results.activities.length})</h4>
                  <div className="space-y-1">
                    {results.activities.map((activity) => (
                      <button
                        key={activity.id}
                        onClick={() => handleSelectReference({
                          type: 'activity',
                          id: activity.id,
                          name: activity.name,
                          metadata: { slug: activity.slug, date: activity.date, capacity: activity.capacity },
                        })}
                        className="w-full text-left px-2 py-2 rounded hover:bg-blue-50 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="inline-block px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                Activity
                              </span>
                              <span className="font-medium text-sm text-gray-900 truncate">{activity.name}</span>
                            </div>
                            {(activity.date || activity.capacity) && (
                              <div className="flex gap-2 mt-1 text-xs text-gray-600">
                                {activity.date && <span>📅 {new Date(activity.date).toLocaleDateString()}</span>}
                                {activity.capacity && <span>👥 {activity.capacity}</span>}
                              </div>
                            )}
                          </div>
                          <span className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                            Add →
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.content_pages.length > 0 && (
                <div className="p-3">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Pages ({results.content_pages.length})</h4>
                  <div className="space-y-1">
                    {results.content_pages.map((page) => (
                      <button
                        key={page.id}
                        onClick={() => handleSelectReference({
                          type: 'content_page',
                          id: page.id,
                          name: page.title,
                          metadata: { slug: page.slug, type: page.type },
                        })}
                        className="w-full text-left px-2 py-2 rounded hover:bg-green-50 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="inline-block px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                                Page
                              </span>
                              <span className="font-medium text-sm text-gray-900 truncate">{page.title}</span>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">🔗 /{page.slug}</div>
                          </div>
                          <span className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                            Add →
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.accommodations.length > 0 && (
                <div className="p-3">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Accommodations ({results.accommodations.length})</h4>
                  <div className="space-y-1">
                    {results.accommodations.map((accommodation) => (
                      <button
                        key={accommodation.id}
                        onClick={() => handleSelectReference({
                          type: 'accommodation',
                          id: accommodation.id,
                          name: accommodation.name,
                          metadata: { slug: accommodation.slug, location: accommodation.location, room_count: accommodation.room_count },
                        })}
                        className="w-full text-left px-2 py-2 rounded hover:bg-orange-50 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="inline-block px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                                Accommodation
                              </span>
                              <span className="font-medium text-sm text-gray-900 truncate">{accommodation.name}</span>
                            </div>
                            {(accommodation.location || accommodation.room_count) && (
                              <div className="flex gap-2 mt-1 text-xs text-gray-600">
                                {accommodation.location && <span>📍 {accommodation.location}</span>}
                                {accommodation.room_count && <span>🏠 {accommodation.room_count} rooms</span>}
                              </div>
                            )}
                          </div>
                          <span className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                            Add →
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
