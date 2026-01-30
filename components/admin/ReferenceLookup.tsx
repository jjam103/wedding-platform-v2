'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Reference {
  id: string;
  type: 'event' | 'activity' | 'accommodation' | 'room_type' | 'content_page';
  name: string;
  slug?: string;
}

interface SearchResult {
  id: string;
  name: string;
  type: string;
  slug?: string;
  status?: string;
  preview?: string;
}

interface ReferenceLookupProps {
  entityTypes: Array<'event' | 'activity' | 'accommodation' | 'room_type' | 'content_page'>;
  onSelect: (reference: Reference) => void;
  placeholder?: string;
  excludeIds?: string[];
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
  event: 'EVENT',
  activity: 'ACTIVITY',
  accommodation: 'ACCOMMODATION',
  room_type: 'ROOM TYPE',
  content_page: 'PAGE',
};

const ENTITY_TYPE_COLORS: Record<string, string> = {
  event: 'bg-blue-100 text-blue-800',
  activity: 'bg-green-100 text-green-800',
  accommodation: 'bg-purple-100 text-purple-800',
  room_type: 'bg-orange-100 text-orange-800',
  content_page: 'bg-gray-100 text-gray-800',
};

export function ReferenceLookup({
  entityTypes,
  onSelect,
  placeholder = 'Search for events, activities, pages...',
  excludeIds = [],
}: ReferenceLookupProps): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hoveredResult, setHoveredResult] = useState<SearchResult | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search function
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const typeParam = entityTypes.join(',');
        const response = await fetch(
          `/api/admin/references/search?q=${encodeURIComponent(searchQuery)}&type=${typeParam}`
        );
        const data = await response.json();

        if (data.success) {
          // Filter out excluded IDs
          const filteredResults = data.data.results.filter(
            (result: SearchResult) => !excludeIds.includes(result.id)
          );
          setResults(filteredResults);
          setIsOpen(filteredResults.length > 0);
          setSelectedIndex(-1);
        } else {
          setResults([]);
          setIsOpen(false);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    },
    [entityTypes, excludeIds]
  );

  // Handle input change with debouncing
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer for debounced search (300ms)
      debounceTimerRef.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    },
    [performSearch]
  );

  // Handle result selection
  const handleSelect = useCallback(
    (result: SearchResult) => {
      onSelect({
        id: result.id,
        type: result.type as Reference['type'],
        name: result.name,
        slug: result.slug,
      });
      setQuery('');
      setResults([]);
      setIsOpen(false);
      setSelectedIndex(-1);
    },
    [onSelect]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || results.length === 0) {
        if (e.key === 'Escape') {
          setQuery('');
          setResults([]);
          setIsOpen(false);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setQuery('');
          setResults([]);
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
    },
    [isOpen, results, selectedIndex, handleSelect]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Search for references"
          aria-autocomplete="list"
          aria-controls="reference-results"
          aria-expanded={isOpen}
          role="combobox"
        />
        {/* Search Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading ? (
            <svg
              className="animate-spin h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          id="reference-results"
          role="listbox"
          className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {/* Results Header */}
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm text-gray-600 font-medium">
            Search Results ({results.length})
          </div>

          {/* Results List */}
          <ul className="py-1">
            {results.map((result, index) => (
              <li
                key={result.id}
                data-index={index}
                role="option"
                aria-selected={index === selectedIndex}
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  index === selectedIndex
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : 'hover:bg-gray-50 border-l-4 border-transparent'
                }`}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setHoveredResult(result)}
                onMouseLeave={() => setHoveredResult(null)}
              >
                <div className="flex items-start gap-3">
                  {/* Entity Type Badge */}
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                      ENTITY_TYPE_COLORS[result.type] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {ENTITY_TYPE_LABELS[result.type] || result.type.toUpperCase()}
                  </span>

                  {/* Result Details */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{result.name}</div>
                    {result.preview && (
                      <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                        <span>→</span>
                        <span className="truncate">{result.preview}</span>
                      </div>
                    )}
                    {result.slug && (
                      <div className="text-xs text-gray-500 mt-1">/{result.slug}</div>
                    )}
                    {result.status && (
                      <div className="text-xs text-gray-500 mt-1 capitalize">
                        {result.status}
                      </div>
                    )}
                  </div>
                </div>

                {/* Hover Preview (if available) */}
                {hoveredResult?.id === result.id && result.preview && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700 border border-gray-200">
                    {result.preview}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No Results Message */}
      {isOpen && results.length === 0 && query.trim() && !loading && (
        <div
          className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500"
          role="status"
        >
          No results found for &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
