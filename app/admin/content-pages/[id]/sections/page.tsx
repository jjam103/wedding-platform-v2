'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SectionEditor } from '@/components/admin/SectionEditor';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Content Page Sections Management Page
 * 
 * Provides section editing interface for custom content pages.
 * Uses SectionEditor component for managing rich content sections.
 */
export default function ContentPageSectionsPage({ params }: PageProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [pageId, setPageId] = useState<string>('');
  const [pageName, setPageName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Unwrap params Promise
  useEffect(() => {
    params.then(({ id }) => {
      setPageId(id);
      fetchPageDetails(id);
    });
  }, [params]);

  const fetchPageDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/content-pages/${id}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setPageName(result.data.title);
      } else {
        addToast({
          type: 'error',
          message: 'Failed to load page details',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to load page details',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    addToast({
      type: 'success',
      message: 'Sections saved successfully',
    });
  };

  const handleClose = () => {
    router.push('/admin/content-pages');
  };

  if (loading || !pageId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-sage-900">Manage Sections</h1>
          <p className="text-sage-600 mt-1">
            {pageName ? `Page: ${pageName}` : 'Content Page Sections'}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleClose}
          aria-label="Back to content pages"
        >
          ← Back to Content Pages
        </Button>
      </div>

      {/* Section Editor */}
      <SectionEditor
        pageType="custom"
        pageId={pageId}
        onSave={handleSave}
        onClose={handleClose}
      />
    </div>
  );
}
