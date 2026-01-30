'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useContentPages } from '@/hooks/useContentPages';
import { useToast } from '@/components/ui/ToastContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { ContentPage } from '@/schemas/cmsSchemas';

// Lazy load ContentPageForm
const ContentPageForm = dynamic(() => import('@/components/admin/ContentPageForm').then(mod => ({ default: mod.ContentPageForm })), {
  loading: () => (
    <div className="animate-pulse space-y-4 p-4 border border-gray-200 rounded-lg">
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="flex gap-2">
        <div className="h-10 w-24 bg-gray-200 rounded"></div>
        <div className="h-10 w-24 bg-gray-200 rounded"></div>
      </div>
    </div>
  ),
  ssr: false,
});

interface ContentPageFormData {
  title: string;
  slug: string;
  status: 'draft' | 'published';
}

export default function ContentPagesPage() {
  const { data: pages, loading, error, refetch, create, update, remove } = useContentPages();
  const { showToast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null);
  const [deleteConfirmPage, setDeleteConfirmPage] = useState<ContentPage | null>(null);

  const handleCreate = useCallback(async (data: ContentPageFormData) => {
    const result = await create(data);
    if (result.success) {
      showToast({ type: 'success', message: 'Content page created successfully' });
      setIsFormOpen(false);
      await refetch();
    } else {
      showToast({ type: 'error', message: result.error || 'Failed to create page' });
    }
  }, [create, showToast, refetch]);

  const handleUpdate = useCallback(async (data: ContentPageFormData) => {
    if (!editingPage) return;
    
    const result = await update(editingPage.id, data);
    if (result.success) {
      showToast({ type: 'success', message: 'Content page updated successfully' });
      setEditingPage(null);
      setIsFormOpen(false);
      await refetch();
    } else {
      showToast({ type: 'error', message: result.error || 'Failed to update page' });
    }
  }, [editingPage, update, showToast, refetch]);

  const handleDelete = useCallback(async () => {
    if (!deleteConfirmPage) return;
    
    const result = await remove(deleteConfirmPage.id);
    if (result.success) {
      showToast({ type: 'success', message: 'Content page deleted successfully' });
      setDeleteConfirmPage(null);
      await refetch();
    } else {
      showToast({ type: 'error', message: result.error || 'Failed to delete page' });
    }
  }, [deleteConfirmPage, remove, showToast, refetch]);

  const handleEdit = useCallback((page: ContentPage) => {
    setEditingPage(page);
    setIsFormOpen(true);
  }, []);

  const handleCancel = useCallback(() => {
    setEditingPage(null);
    setIsFormOpen(false);
  }, []);

  const handleManageSections = useCallback((page: ContentPage) => {
    // TODO: Navigate to section editor
    window.location.href = `/admin/content-pages/${page.id}/sections`;
  }, []);

  const columns = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
    },
    {
      key: 'slug',
      label: 'Slug',
      sortable: true,
      render: (value: string) => (
        <code className="text-sm bg-gray-100 px-2 py-1 rounded">/{value}</code>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => {
        const statusMap: Record<string, 'page-published' | 'page-draft'> = {
          published: 'page-published',
          draft: 'page-draft',
        };
        return <StatusBadge status={statusMap[value] || 'page-draft'} />;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, page: ContentPage) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => window.location.href = `/${page.slug}`}
            aria-label={`View ${page.title} as guest`}
          >
            View
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleEdit(page)}
            aria-label={`Edit ${page.title}`}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleManageSections(page)}
            aria-label={`Manage sections for ${page.title}`}
          >
            Sections
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setDeleteConfirmPage(page)}
            aria-label={`Delete ${page.title}`}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading content pages: {error.message}</p>
          <Button onClick={refetch} className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Content Pages</h1>
        <p className="text-gray-600">
          Manage custom content pages with rich text and sections
        </p>
      </div>

      <ContentPageForm
        title={editingPage ? 'Edit Content Page' : 'Add Content Page'}
        onSubmit={editingPage ? handleUpdate : handleCreate}
        onCancel={handleCancel}
        initialData={editingPage || undefined}
        isOpen={isFormOpen}
        onToggle={() => setIsFormOpen(!isFormOpen)}
        submitLabel={editingPage ? 'Update' : 'Create'}
      />

      <div className="mt-6">
        <DataTable
          data={pages || []}
          columns={columns}
        />
      </div>

      {deleteConfirmPage && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Content Page"
          message={`Are you sure you want to delete "${deleteConfirmPage.title}"? This will also delete all associated sections and cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleDelete}
          onClose={() => setDeleteConfirmPage(null)}
          variant="danger"
        />
      )}
    </div>
  );
}
