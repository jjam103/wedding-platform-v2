'use client';

import { useState, useEffect } from 'react';

interface Reference {
  type: 'event' | 'activity' | 'content_page' | 'accommodation';
  id: string;
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface SimpleReferenceSelectorProps {
  onSelect: (reference: Reference) => void;
}

interface EntityItem {
  id: string;
  name: string;
  slug?: string;
  date?: string;
  location?: string;
  capacity?: number;
  room_count?: number;
  type?: string;
}

/**
 * SimpleReferenceSelector Component
 * 
 * Inline reference selector with dropdown and list
 * - Dropdown to select entity type (Events, Activities, Pages, Accommodations)
 * - Click to select specific items
 * - No search, just simple selection
 */
export function SimpleReferenceSelector({ onSelect }: SimpleReferenceSelectorProps) {
  const [selectedType, setSelectedType] = useState<'event' | 'activity' | 'content_page' | 'accommodation'>('activity');
  const [items, setItems] = useState<EntityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch items when type changes
  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      setError(null);

      try {
        let endpoint = '';
        switch (selectedType) {
          case 'event':
            endpoint = '/api/admin/events';
            break;
          case 'activity':
            endpoint = '/api/admin/activities';
            break;
          case 'content_page':
            endpoint = '/api/admin/content-pages';
            break;
          case 'accommodation':
            endpoint = '/api/admin/accommodations';
            break;
        }

        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error('Failed to fetch items');
        }

        const result = await response.json();
        
        if (result.success) {
          // Handle different response formats from different APIs
          let dataArray = [];
          
          if (result.data) {
            // Check for paginated response (activities, events)
            if (result.data.activities) {
              dataArray = result.data.activities;
            } else if (result.data.events) {
              dataArray = result.data.events;
            } else if (result.data.items) {
              dataArray = result.data.items;
            } else if (Array.isArray(result.data)) {
              // Direct array response (content_pages, accommodations)
              dataArray = result.data;
            }
          }
          
          const normalizedItems = dataArray.map((item: any) => ({
            id: item.id,
            name: item.name || item.title,
            slug: item.slug,
            date: item.date || item.start_time,
            location: item.location?.name || item.locations?.name,
            capacity: item.capacity,
            room_count: item.room_count,
            type: item.type,
          }));
          setItems(normalizedItems);
        } else {
          setError(result.error?.message || 'Failed to load items');
        }
      } catch (err) {
        console.error('Error fetching items:', err);
        setError(err instanceof Error ? err.message : 'Failed to load items');
      } finally {
        setLoading(false);
      }
    }

    fetchItems();
  }, [selectedType]);

  const handleSelectItem = (item: EntityItem) => {
    onSelect({
      type: selectedType,
      id: item.id,
      name: item.name,
      metadata: {
        slug: item.slug,
        date: item.date,
        location: item.location,
        capacity: item.capacity,
        room_count: item.room_count,
        type: item.type,
      },
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'event':
        return 'Events';
      case 'activity':
        return 'Activities';
      case 'content_page':
        return 'Content Pages';
      case 'accommodation':
        return 'Accommodations';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'event':
        return 'purple';
      case 'activity':
        return 'blue';
      case 'content_page':
        return 'green';
      case 'accommodation':
        return 'orange';
      default:
        return 'gray';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      {/* Type Selector */}
      <div className="p-4 border-b border-gray-200">
        <label htmlFor="type-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Type
        </label>
        <select
          id="type-select"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as any)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="activity">Activities</option>
          <option value="event">Events</option>
          <option value="content_page">Content Pages</option>
          <option value="accommodation">Accommodations</option>
        </select>
      </div>

      {/* Items List */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No {getTypeLabel(selectedType).toLowerCase()} found</p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="space-y-2">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="w-full text-left border border-gray-200 rounded-md p-3 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer transition-colors"
                onClick={() => handleSelectItem(item)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-medium bg-${getTypeColor(selectedType)}-100 text-${getTypeColor(selectedType)}-800 rounded`}
                  >
                    {getTypeLabel(selectedType).slice(0, -1)}
                  </span>
                  <span className="font-medium text-gray-900">{item.name}</span>
                </div>
                {item.date && (
                  <p className="text-xs text-gray-600">
                    📅 {new Date(item.date).toLocaleDateString()}
                  </p>
                )}
                {item.location && (
                  <p className="text-xs text-gray-600">📍 {item.location}</p>
                )}
                {item.capacity && (
                  <p className="text-xs text-gray-600">👥 Capacity: {item.capacity}</p>
                )}
                {item.room_count !== undefined && (
                  <p className="text-xs text-gray-600">🏠 {item.room_count} rooms</p>
                )}
                {item.slug && (
                  <p className="text-xs text-gray-600">🔗 /{item.slug}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
