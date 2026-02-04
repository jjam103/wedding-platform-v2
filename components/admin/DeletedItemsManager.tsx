'use client';

/**
 * Deleted Items Manager Component
 * 
 * Displays list of soft-deleted items with restore and permanent delete actions.
 * Supports filtering by entity type and search functionality.
 */

import { useState, useEffect } from 'react';
import { DataTable } from '../ui/DataTable';

interface DeletedItem {
  id: string;
  type: 'content_page' | 'event' | 'activity' | 'section' | 'column' | 'photo';
  name: string;
  deleted_at: string;
  deleted_by?: string;
  deleted_by_email?: string;
}

interface DeletedItemsManagerProps {
  onRestore: (id: string, type: string) => Promise<void>;
  onPermanentDelete: (id: string, type: string) => Promise<void>;
}

export function DeletedItemsManager({
  onRestore,
  onPermanentDelete,
}: DeletedItemsManagerProps) {
  const [items, setItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch deleted items
  useEffect(() => {
    fetchDeletedItems();
  }, [filterType]);

  const fetchDeletedItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterType !== 'all') {
        params.append('type', filterType);
      }

      const response = await fetch(`/api/admin/deleted-items?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch deleted items');
      }

      setItems(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (item: DeletedItem) => {
    if (!confirm(`Are you sure you want to restore "${item.name}"?`)) {
      return;
    }

    try {
      await onRestore(item.id, item.type);
      await fetchDeletedItems();
    } catch (err) {
      alert(`Failed to restore: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handlePermanentDelete = async (item: DeletedItem) => {
    if (
      !confirm(
        `Are you sure you want to PERMANENTLY delete "${item.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await onPermanentDelete(item.id, item.type);
      await fetchDeletedItems();
    } catch (err) {
      alert(
        `Failed to permanently delete: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  };

  // Filter items by search query
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      key: 'type',
      label: 'Type',
      render: (item: DeletedItem) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {item.type.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      render: (item: DeletedItem) => (
        <div className="text-sm font-medium text-gray-900">{item.name}</div>
      ),
    },
    {
      key: 'deleted_at',
      label: 'Deleted At',
      render: (item: DeletedItem) => (
        <div className="text-sm text-gray-500">
          {new Date(item.deleted_at).toLocaleString()}
        </div>
      ),
    },
    {
      key: 'deleted_by',
      label: 'Deleted By',
      render: (item: DeletedItem) => (
        <div className="text-sm text-gray-500">
          {item.deleted_by_email || 'Unknown'}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: DeletedItem) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleRestore(item)}
            className="text-sm text-emerald-600 hover:text-emerald-900 font-medium"
          >
            Restore
          </button>
          <button
            onClick={() => handlePermanentDelete(item)}
            className="text-sm text-red-600 hover:text-red-900 font-medium"
          >
            Delete Permanently
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading deleted items...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error: {error}</p>
        <button
          onClick={fetchDeletedItems}
          className="mt-2 text-sm text-red-600 hover:text-red-900 font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Deleted Items</h2>
        <button
          onClick={fetchDeletedItems}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        {/* Type Filter */}
        <div>
          <label htmlFor="typeFilter" className="sr-only">
            Filter by type
          </label>
          <select
            id="typeFilter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
          >
            <option value="all">All Types</option>
            <option value="content_page">Content Pages</option>
            <option value="event">Events</option>
            <option value="activity">Activities</option>
            <option value="section">Sections</option>
            <option value="column">Columns</option>
            <option value="photo">Photos</option>
          </select>
        </div>

        {/* Search */}
        <div className="flex-1">
          <label htmlFor="search" className="sr-only">
            Search
          </label>
          <input
            type="text"
            id="search"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
          />
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Deleted items are automatically permanently deleted after 30
          days. Restore items before then to prevent permanent data loss.
        </p>
      </div>

      {/* Table */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No deleted items</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery
              ? 'No items match your search.'
              : 'All deleted items have been restored or permanently deleted.'}
          </p>
        </div>
      ) : (
        <DataTable
          data={filteredItems}
          columns={columns}
        />
      )}
    </div>
  );
}
