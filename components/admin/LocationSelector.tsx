'use client';

import { useState, useEffect, useMemo } from 'react';
import type { LocationWithChildren } from '@/schemas/locationSchemas';

interface LocationSelectorProps {
  value: string | null;
  onChange: (locationId: string | null) => void;
  placeholder?: string;
  excludeId?: string; // Exclude this location and its descendants (for circular reference prevention)
  required?: boolean;
}

export function LocationSelector({
  value,
  onChange,
  placeholder = 'Select a location',
  excludeId,
  required = false,
}: LocationSelectorProps) {
  const [locations, setLocations] = useState<LocationWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Load locations
  useEffect(() => {
    async function loadLocations() {
      try {
        const response = await fetch('/api/admin/locations');
        const result = await response.json();
        
        if (result.success) {
          setLocations(result.data);
        }
      } catch (err) {
        console.error('Failed to load locations:', err);
      } finally {
        setLoading(false);
      }
    }

    loadLocations();
  }, []);

  // Flatten locations with hierarchy path
  const flatLocations = useMemo(() => {
    const result: Array<{ id: string; name: string; path: string; level: number }> = [];

    function traverse(
      locs: LocationWithChildren[],
      parentPath: string = '',
      level: number = 0
    ) {
      for (const loc of locs) {
        // Skip excluded location and its descendants
        if (excludeId && loc.id === excludeId) {
          continue;
        }

        const path = parentPath ? `${parentPath} → ${loc.name}` : loc.name;
        result.push({
          id: loc.id,
          name: loc.name,
          path,
          level,
        });

        if (loc.children && loc.children.length > 0) {
          traverse(loc.children, path, level + 1);
        }
      }
    }

    traverse(locations);
    return result;
  }, [locations, excludeId]);

  // Filter locations by search query
  const filteredLocations = useMemo(() => {
    if (!searchQuery) return flatLocations;
    
    const lowerQuery = searchQuery.toLowerCase();
    return flatLocations.filter((loc) =>
      loc.name.toLowerCase().includes(lowerQuery) ||
      loc.path.toLowerCase().includes(lowerQuery)
    );
  }, [flatLocations, searchQuery]);

  // Get selected location
  const selectedLocation = flatLocations.find((loc) => loc.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {loading ? (
          <span className="text-gray-500">Loading...</span>
        ) : selectedLocation ? (
          <span className="text-gray-900">{selectedLocation.path}</span>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
              <input
                type="text"
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {!required && (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                  setSearchQuery('');
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700"
              >
                <span className="italic">None</span>
              </button>
            )}

            {filteredLocations.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-center">
                No locations found
              </div>
            ) : (
              filteredLocations.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => {
                    onChange(loc.id);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                    value === loc.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                  }`}
                  style={{ paddingLeft: `${16 + loc.level * 16}px` }}
                >
                  <span className="mr-2">📍</span>
                  {loc.path}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
