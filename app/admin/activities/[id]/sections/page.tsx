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
 * Activity Sections Management Page
 * 
 * Provides section editing interface for activity pages.
 * Uses SectionEditor component for managing rich content sections.
 */
export default function ActivitySectionsPage({ params }: PageProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [activityId, setActivityId] = useState<string>('');
  const [activityName, setActivityName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Unwrap params Promise
  useEffect(() => {
    params.then(({ id }) => {
      setActivityId(id);
      fetchActivityDetails(id);
    });
  }, [params]);

  const fetchActivityDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/activities/${id}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setActivityName(result.data.name);
      } else {
        addToast({
          type: 'error',
          message: 'Failed to load activity details',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to load activity details',
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
    router.push('/admin/activities');
  };

  if (loading || !activityId) {
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
            {activityName ? `Activity: ${activityName}` : 'Activity Sections'}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleClose}
          aria-label="Back to activities"
        >
          ← Back to Activities
        </Button>
      </div>

      {/* Section Editor */}
      <SectionEditor
        pageType="activity"
        pageId={activityId}
        onSave={handleSave}
        onClose={handleClose}
      />
    </div>
  );
}
