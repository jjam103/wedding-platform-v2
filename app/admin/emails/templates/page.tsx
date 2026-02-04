'use client';

export const dynamic = 'force-dynamic';

/**
 * Email Templates Page
 * 
 * List and manage email templates with usage statistics
 * Requirements: 17.5, 17.6, 17.7, 17.10
 */

import { useState, useEffect, useCallback, Suspense } from 'react';
import { EmailTemplateEditor } from '@/components/admin/EmailTemplateEditor';
import { DataTable } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/ToastContext';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  category: string;
  usage_count: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchTemplates = useCallback(async () => {
    // Only fetch on client-side
    if (typeof window === 'undefined') return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/admin/emails/templates');
      const data = await response.json();

      if (data.success) {
        setTemplates(data.data);
      } else {
        addToast({
          type: 'error',
          message: data.error.message || 'Failed to load templates',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to load templates',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreate = useCallback(() => {
    setEditingTemplate(null);
    setShowEditor(true);
  }, []);

  const handleEdit = useCallback((template: EmailTemplate) => {
    setEditingTemplate(template);
    setShowEditor(true);
  }, []);

  const handleSave = useCallback(
    async (templateData: {
      name: string;
      subject: string;
      body_html: string;
      category?: string;
    }) => {
      try {
        const url = editingTemplate
          ? `/api/admin/emails/templates/${editingTemplate.id}`
          : '/api/admin/emails/templates';
        const method = editingTemplate ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(templateData),
        });

        const data = await response.json();

        if (data.success) {
          addToast({
            type: 'success',
            message: editingTemplate
              ? 'Template updated successfully'
              : 'Template created successfully',
          });
          setShowEditor(false);
          setEditingTemplate(null);
          fetchTemplates();
        } else {
          addToast({
            type: 'error',
            message: data.error.message || 'Failed to save template',
          });
        }
      } catch (error) {
        addToast({
          type: 'error',
          message: 'Failed to save template',
        });
      }
    },
    [editingTemplate, addToast, fetchTemplates]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/admin/emails/templates/${id}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (data.success) {
          addToast({
            type: 'success',
            message: 'Template deleted successfully',
          });
          setDeleteConfirm(null);
          fetchTemplates();
        } else {
          addToast({
            type: 'error',
            message: data.error.message || 'Failed to delete template',
          });
        }
      } catch (error) {
        addToast({
          type: 'error',
          message: 'Failed to delete template',
        });
      }
    },
    [addToast, fetchTemplates]
  );

  const handleDuplicate = useCallback(
    async (template: EmailTemplate) => {
      try {
        const response = await fetch('/api/admin/emails/templates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: `${template.name} (Copy)`,
            subject: template.subject,
            body_html: template.body_html,
            category: template.category,
          }),
        });

        const data = await response.json();

        if (data.success) {
          addToast({
            type: 'success',
            message: 'Template duplicated successfully',
          });
          fetchTemplates();
        } else {
          addToast({
            type: 'error',
            message: data.error.message || 'Failed to duplicate template',
          });
        }
      } catch (error) {
        addToast({
          type: 'error',
          message: 'Failed to duplicate template',
        });
      }
    },
    [addToast, fetchTemplates]
  );

  const columns = [
    {
      key: 'name',
      label: 'Template Name',
      sortable: true,
      render: (template: EmailTemplate) => (
        <div>
          <div className="font-medium text-gray-900">{template.name}</div>
          {template.is_default && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
              Default
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (template: EmailTemplate) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
          {template.category}
        </span>
      ),
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (template: EmailTemplate) => (
        <div className="text-sm text-gray-600 truncate max-w-md">{template.subject}</div>
      ),
    },
    {
      key: 'usage_count',
      label: 'Usage',
      sortable: true,
      render: (template: EmailTemplate) => (
        <div className="text-sm text-gray-900">{template.usage_count} times</div>
      ),
    },
    {
      key: 'updated_at',
      label: 'Last Updated',
      sortable: true,
      render: (template: EmailTemplate) => (
        <div className="text-sm text-gray-600">
          {new Date(template.updated_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (template: EmailTemplate) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(template)}
            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => handleDuplicate(template)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Duplicate
          </button>
          {!template.is_default && (
            <button
              onClick={() => setDeleteConfirm(template.id)}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  if (showEditor) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {editingTemplate ? 'Edit Template' : 'Create Template'}
          </h1>
          <p className="text-gray-600 mt-1">
            {editingTemplate
              ? 'Update your email template'
              : 'Create a new email template with dynamic variables'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <EmailTemplateEditor
            value={editingTemplate || undefined}
            onChange={(template) => {
              if (editingTemplate) {
                setEditingTemplate({ ...editingTemplate, ...template });
              }
            }}
            onSave={() => {
              if (editingTemplate) {
                handleSave(editingTemplate);
              }
            }}
            onCancel={() => {
              setShowEditor(false);
              setEditingTemplate(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600 mt-1">
            Manage email templates for automated and manual communications
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Create Template
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total Templates</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{templates.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Default Templates</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {templates.filter((t) => t.is_default).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Custom Templates</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {templates.filter((t) => !t.is_default).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total Usage</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {templates.reduce((sum, t) => sum + t.usage_count, 0)}
          </div>
        </div>
      </div>

      {/* Templates Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading templates...</div>}>
          <DataTable
            data={templates}
            columns={columns}
            loading={loading}
          />
        </Suspense>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Template</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this template? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
