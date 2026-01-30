'use client';

import { useState, useEffect, useCallback } from 'react';
import { CollapsibleForm } from '@/components/admin/CollapsibleForm';
import { DataTable } from '@/components/ui/DataTable';
import type { Location, LocationWithChildren } from '@/schemas/locationSchemas';
import { createLocationSchema } from '@/schemas/locationSchemas';

interface LocationManagementPageProps {}

export default function LocationManagementPage({}: LocationManagementPageProps) {
  const [locations, setLocations] = useState<LocationWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Load locations hierarchy
  const loadLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/locations');
      const result = await response.json();
      
      if (result.success) {
        setLocations(result.data);
        setError(null);
      } else {
        setError(result.error.message);
        setLocations([]); // Keep locations as empty array on error
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load locations');
      setLocations([]); // Keep locations as empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  // Handle form submission
  const handleSubmit = useCallback(async (data: any) => {
    try {
      const url = editingLocation
        ? `/api/admin/locations/${editingLocation.id}`
        : '/api/admin/locations';
      const method = editingLocation ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        await loadLocations();
        setIsFormOpen(false);
        setEditingLocation(null);
        setError(null);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save location');
    }
  }, [editingLocation, loadLocations]);

  // Handle delete
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this location? Child locations will become orphaned.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/locations/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        await loadLocations();
      } else {
        alert(result.error.message);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete location');
    }
  }, [loadLocations]);

  // Handle edit
  const handleEdit = useCallback((location: Location) => {
    setEditingLocation(location);
    setIsFormOpen(true);
  }, []);

  // Toggle node expansion
  const toggleNode = useCallback((id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Render tree node
  const renderTreeNode = useCallback((location: LocationWithChildren, level: number = 0): React.JSX.Element => {
    const hasChildren = location.children && location.children.length > 0;
    const isExpanded = expandedNodes.has(location.id);
    const indent = level * 24;

    return (
      <div key={location.id} className="border-b border-gray-200">
        <div
          className="flex items-center py-3 px-4 hover:bg-gray-50"
          style={{ paddingLeft: `${indent + 16}px` }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleNode(location.id)}
              className="mr-2 text-gray-500 hover:text-gray-700"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          {!hasChildren && <span className="mr-2 w-4" />}
          
          <span className="mr-2">📍</span>
          
          <div className="flex-1">
            <div className="font-medium text-gray-900">{location.name}</div>
            {location.address && (
              <div className="text-sm text-gray-500">{location.address}</div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(location)}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(location.id)}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {location.children.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  }, [expandedNodes, toggleNode, handleEdit, handleDelete]);

  // Filter locations by search query
  const filterLocations = useCallback((locs: LocationWithChildren[], query: string): LocationWithChildren[] => {
    if (!query) return locs;

    const filtered: LocationWithChildren[] = [];
    const lowerQuery = query.toLowerCase();

    for (const loc of locs) {
      const matches = 
        loc.name.toLowerCase().includes(lowerQuery) ||
        (loc.address && loc.address.toLowerCase().includes(lowerQuery)) ||
        (loc.description && loc.description.toLowerCase().includes(lowerQuery));

      const filteredChildren = filterLocations(loc.children, query);

      if (matches || filteredChildren.length > 0) {
        filtered.push({
          ...loc,
          children: filteredChildren,
        });
      }
    }

    return filtered;
  }, []);

  const filteredLocations = filterLocations(locations, searchQuery);

  // Form fields
  const formFields = [
    {
      name: 'name',
      label: 'Location Name',
      type: 'text' as const,
      required: true,
      placeholder: 'e.g., Tamarindo Beach',
    },
    {
      name: 'parentLocationId',
      label: 'Parent Location',
      type: 'select' as const,
      required: false,
      options: [
        { value: '', label: 'None (Root Location)' },
        ...flattenLocations(locations).map((loc) => ({
          value: loc.id,
          label: loc.name,
        })),
      ],
    },
    {
      name: 'address',
      label: 'Address',
      type: 'text' as const,
      required: false,
      placeholder: 'e.g., Tamarindo, Guanacaste, Costa Rica',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea' as const,
      required: false,
      placeholder: 'Optional description',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
        <p className="text-gray-600">Manage location hierarchy</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
          {error}
        </div>
      )}

      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Search locations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => {
            setEditingLocation(null);
            setIsFormOpen(!isFormOpen);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {isFormOpen ? 'Cancel' : '+ Add Location'}
        </button>
      </div>

      <CollapsibleForm
        title={editingLocation ? 'Edit Location' : 'Add New Location'}
        fields={formFields}
        schema={createLocationSchema}
        onSubmit={handleSubmit}
        onCancel={() => {
          setIsFormOpen(false);
          setEditingLocation(null);
        }}
        initialData={editingLocation || undefined}
        isOpen={isFormOpen}
        onToggle={() => setIsFormOpen(!isFormOpen)}
      />

      <div className="mt-6 bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading locations...</div>
        ) : filteredLocations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchQuery ? 'No locations match your search' : 'No locations yet. Add your first location above.'}
          </div>
        ) : (
          <div>
            {filteredLocations.map((location) => renderTreeNode(location))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to flatten location hierarchy
function flattenLocations(locations: LocationWithChildren[]): Location[] {
  const result: Location[] = [];
  
  function traverse(locs: LocationWithChildren[]) {
    for (const loc of locs) {
      result.push(loc);
      if (loc.children && loc.children.length > 0) {
        traverse(loc.children);
      }
    }
  }
  
  traverse(locations);
  return result;
}
