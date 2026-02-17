'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CollapsibleForm } from '@/components/admin/CollapsibleForm';
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
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Load locations hierarchy
  const loadLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[LocationPage] Loading locations...');
      const response = await fetch('/api/admin/locations');
      const result = await response.json();
      
      console.log('[LocationPage] Locations loaded:', {
        success: result.success,
        count: result.data?.length || 0,
        locationNames: result.data?.map((l: any) => l.name) || [],
        data: result.data
      });
      
      if (result.success) {
        console.log('[LocationPage] Setting locations state with', result.data.length, 'locations');
        setLocations(result.data);
        // Don't increment treeKey - this preserves expandedNodes state
        console.log('[LocationPage] Locations state updated, expandedNodes preserved');
        setError(null);
      } else {
        setError(result.error.message);
        setLocations([]); // Keep locations as empty array on error
      }
    } catch (err) {
      console.error('[LocationPage] Failed to load locations:', err);
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
    // Convert empty string to null for parentLocationId
    const submitData = {
      ...data,
      parentLocationId: data.parentLocationId === '' ? null : data.parentLocationId,
    };

    console.log('[LocationPage] Submitting location data:', submitData);

    const url = editingLocation
      ? `/api/admin/locations/${editingLocation.id}`
      : '/api/admin/locations';
    const method = editingLocation ? 'PUT' : 'POST';

    try {
      console.log('[LocationPage] Making API request:', { url, method, data: submitData });
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();
      console.log('[LocationPage] Location API response:', result);

      if (!result.success) {
        const errorMessage = result.error?.message || 'Failed to save location';
        console.error('[LocationPage] Location save error:', result.error);
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      console.log('[LocationPage] Location saved successfully:', result.data);

      // If creating a new location with a parent, expand the parent node
      if (!editingLocation && submitData.parentLocationId) {
        console.log('[LocationPage] Expanding parent node:', submitData.parentLocationId);
        setExpandedNodes((prev) => ({
          ...prev,
          [submitData.parentLocationId]: true
        }));
      }

      // Reload locations to get updated hierarchy
      console.log('[LocationPage] Reloading locations after save...');
      await loadLocations();
      console.log('[LocationPage] Locations reload complete, new count:', locations.length);
      setError(null);
      
      // Close form after successful save and reload
      setIsFormOpen(false);
      setEditingLocation(null);
      console.log('[LocationPage] Form closed, submission complete');
    } catch (error) {
      console.error('[LocationPage] Form submission error:', error);
      // Error already set above, just re-throw to prevent form from closing
      throw error;
    }
  }, [editingLocation, loadLocations, locations.length]);

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

  // Toggle node expansion - FIXED: Force re-render by creating new object
  const toggleNode = useCallback((id: string) => {
    console.log('[LocationPage] toggleNode called for:', id);
    setExpandedNodes((prev) => {
      const newExpanded = {
        ...prev,
        [id]: !prev[id]
      };
      console.log('[LocationPage] expandedNodes updated:', newExpanded);
      return newExpanded;
    });
  }, []);

  // Render tree node - FIXED: Use key prop to force re-render on state changes
  const renderTreeNode = useCallback((location: LocationWithChildren, level: number = 0): React.JSX.Element => {
    const hasChildren = location.children && location.children.length > 0;
    const isExpanded = expandedNodes[location.id] || false;
    const indent = level * 24;

    console.log('[LocationPage] Rendering tree node:', {
      name: location.name,
      id: location.id,
      hasChildren,
      childrenCount: location.children?.length || 0,
      isExpanded,
      level,
      expandedNodes
    });

    return (
      <div key={`${location.id}-${isExpanded}`} className="border-b border-gray-200">
        <div
          className="flex items-center py-3 px-4 hover:bg-gray-50"
          style={{ paddingLeft: `${indent + 16}px` }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[LocationPage] Toggle button clicked for:', location.id, 'current expanded:', isExpanded);
                toggleNode(location.id);
              }}
              className="mr-2 text-gray-500 hover:text-gray-700"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              aria-expanded={isExpanded}
              type="button"
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleEdit(location);
              }}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
              title="Edit location"
              type="button"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDelete(location.id);
              }}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
              title="Delete location"
              type="button"
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

  const filteredLocations = useMemo(() => {
    const filtered = filterLocations(locations, searchQuery);
    if (typeof window !== 'undefined') {
      console.log('[LocationPage CLIENT] Filtered locations:', {
        totalLocations: locations.length,
        searchQuery,
        filteredCount: filtered.length,
        locationNames: locations.map(l => l.name),
        expandedNodesCount: Object.keys(expandedNodes).length
      });
    }
    return filtered;
  }, [locations, searchQuery, filterLocations, expandedNodes]);

  // Form fields - recalculated when locations or editingLocation changes
  const formFields = useMemo(() => {
    const flatLocations = flattenLocations(locations);
    const parentOptions = [
      { value: '', label: 'None (Root Location)' },
      ...flatLocations
        .filter((loc) => !editingLocation || loc.id !== editingLocation.id) // Exclude current location when editing
        .map((loc) => ({
          value: loc.id,
          label: loc.name,
        })),
    ];
    
    console.log('[LocationPage] Recalculating formFields:', {
      locationsCount: locations.length,
      flatLocationsCount: flatLocations.length,
      parentOptionsCount: parentOptions.length,
      locationNames: flatLocations.map(l => l.name),
      editingLocationId: editingLocation?.id
    });
    
    return [
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
        options: parentOptions,
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
  }, [locations, editingLocation]);

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
          data-testid="add-location-button"
        >
          {isFormOpen ? 'Cancel' : '+ Add Location'}
        </button>
      </div>

      <CollapsibleForm
        key={`location-form-${editingLocation?.id || 'new'}-${locations.length}`}
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
        submitLabel={editingLocation ? "Save" : "Create"}
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
