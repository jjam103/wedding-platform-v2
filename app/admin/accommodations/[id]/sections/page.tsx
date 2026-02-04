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
 * Accommodation Sections Management Page
 * 
 * Provides section editing interface for accommodation pages.
 * Uses SectionEditor component for managing rich content sections.
 */
export default function AccommodationSectionsPage({ params }: PageProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [accommodationId, setAccommodationId] = useState<string>('');
  const [accommodationName, setAccommodationName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Unwrap params Promise
  useEffect(() => {
    params.then(({ id }) => {
      setAccommodationId(id);
      fetchAccommodationDetails(id);
    });
  }, [params]);

  const fetchAccommodationDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/accommodations/${id}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setAccommodationName(result.data.name);
      } else {
        addToast({
          type: 'error',
          message: 'Failed to load accommodation details',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to load accommodation details',
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
    router.push('/admin/accommodations');
  };

  if (loading || !accommodationId) {
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
            {accommodationName ? `Accommodation: ${accommodationName}` : 'Accommodation Sections'}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleClose}
          aria-label="Back to accommodations"
        >
          ← Back to Accommodations
        </Button>
      </div>

      {/* Section Editor */}
      <SectionEditor
        pageType="accommodation"
        pageId={accommodationId}
        onSave={handleSave}
        onClose={handleClose}
      />
    </div>
  );
}
