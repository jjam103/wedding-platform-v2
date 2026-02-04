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
 * Event Sections Management Page
 * 
 * Provides section editing interface for event pages.
 * Uses SectionEditor component for managing rich content sections.
 */
export default function EventSectionsPage({ params }: PageProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [eventId, setEventId] = useState<string>('');
  const [eventName, setEventName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Unwrap params Promise
  useEffect(() => {
    params.then(({ id }) => {
      setEventId(id);
      fetchEventDetails(id);
    });
  }, [params]);

  const fetchEventDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/events/${id}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setEventName(result.data.name);
      } else {
        addToast({
          type: 'error',
          message: 'Failed to load event details',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to load event details',
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
    router.push('/admin/events');
  };

  if (loading || !eventId) {
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
            {eventName ? `Event: ${eventName}` : 'Event Sections'}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleClose}
          aria-label="Back to events"
        >
          ← Back to Events
        </Button>
      </div>

      {/* Section Editor */}
      <SectionEditor
        pageType="event"
        pageId={eventId}
        onSave={handleSave}
        onClose={handleClose}
      />
    </div>
  );
}
