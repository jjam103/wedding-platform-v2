'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataTable } from '@/components/ui/DataTable';
import type { AuditLog } from '@/services/auditLogService';

interface AuditLogFilters {
  user_id?: string;
  entity_type?: string;
  operation_type?: 'create' | 'update' | 'delete';
  start_date?: string;
  end_date?: string;
  search?: string;
}

interface PaginatedResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (filters.entity_type) params.append('entity_type', filters.entity_type);
      if (filters.operation_type) params.append('operation_type', filters.operation_type);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      params.append('page', page.toString());
      params.append('page_size', '50');

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      const data = result.data as PaginatedResponse;
      
      // Apply client-side search filter if provided
      let filteredLogs = data.logs;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredLogs = data.logs.filter((log) => {
          const description = `${log.operation_type} ${log.entity_type} ${log.entity_id}`.toLowerCase();
          return (
            description.includes(searchLower) ||
            log.user_email?.toLowerCase().includes(searchLower) ||
            log.entity_type.toLowerCase().includes(searchLower)
          );
        });
      }

      setLogs(filteredLogs);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (filters.entity_type) params.append('entity_type', filters.entity_type);
      if (filters.operation_type) params.append('operation_type', filters.operation_type);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);

      const response = await fetch(`/api/admin/audit-logs/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to export audit logs');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export audit logs');
    } finally {
      setExporting(false);
    }
  };

  const handleFilterChange = (key: keyof AuditLogFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1); // Reset to first page when filters change
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isCriticalAction = (action: string) => {
    return action === 'delete';
  };

  const columns = [
    {
      key: 'created_at',
      label: 'Timestamp',
      render: (log: AuditLog) => (
        <div className="text-sm">
          <div className="font-medium">{formatDate(log.created_at).split(',')[0]}</div>
          <div className="text-gray-500">{formatDate(log.created_at).split(',')[1]}</div>
        </div>
      ),
    },
    {
      key: 'user_email',
      label: 'User',
      render: (log: AuditLog) => (
        <div className="text-sm">
          <div className="font-medium">{log.user_email || 'System'}</div>
          {log.user_id && <div className="text-gray-500 text-xs">{log.user_id.slice(0, 8)}...</div>}
        </div>
      ),
    },
    {
      key: 'operation_type',
      label: 'Action',
      render: (log: AuditLog) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${getActionBadgeColor(log.operation_type)}`}
        >
          {log.operation_type}
        </span>
      ),
    },
    {
      key: 'entity_type',
      label: 'Entity Type',
      render: (log: AuditLog) => (
        <span className="text-sm font-medium capitalize">{log.entity_type.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'entity_id',
      label: 'Details',
      render: (log: AuditLog) => (
        <div className="text-sm">
          <div className="text-gray-900">
            {log.operation_type.charAt(0).toUpperCase() + log.operation_type.slice(1)}{' '}
            {log.entity_type.replace('_', ' ')}
          </div>
          <div className="text-gray-500 text-xs">ID: {log.entity_id.slice(0, 8)}...</div>
          {isCriticalAction(log.operation_type) && (
            <div className="mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                ⚠️ Critical Action
              </span>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and search system audit logs for accountability
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search descriptions..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Type */}
          <div>
            <label htmlFor="operation_type" className="block text-sm font-medium text-gray-700 mb-1">
              Action Type
            </label>
            <select
              id="operation_type"
              value={filters.operation_type || ''}
              onChange={(e) => handleFilterChange('operation_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </select>
          </div>

          {/* Entity Type */}
          <div>
            <label htmlFor="entity_type" className="block text-sm font-medium text-gray-700 mb-1">
              Entity Type
            </label>
            <select
              id="entity_type"
              value={filters.entity_type || ''}
              onChange={(e) => handleFilterChange('entity_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Entities</option>
              <option value="guest">Guest</option>
              <option value="event">Event</option>
              <option value="activity">Activity</option>
              <option value="vendor">Vendor</option>
              <option value="accommodation">Accommodation</option>
              <option value="content_page">Content Page</option>
              <option value="location">Location</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                id="start_date"
                value={filters.start_date || ''}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                id="end_date"
                value={filters.end_date || ''}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={() => {
              setFilters({});
              setPage(1);
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Clear Filters
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={logs}
          columns={columns}
          loading={loading}
          emptyMessage="No audit logs found"
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {page} of {totalPages} ({total} total logs)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
