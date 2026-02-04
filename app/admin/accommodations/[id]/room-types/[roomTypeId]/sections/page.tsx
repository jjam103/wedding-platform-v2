'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SectionEditor } from '@/components/admin/SectionEditor';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';

interface PageProps {
  params: Promise<{ id: string; roomTypeId: string }>;
}

/**
 * Room Type Sections Management Page
 * 
 * Provides section editing interface for room type pages.
 * Uses SectionEditor component for managing rich content sections.
 */
export default function RoomTypeSectionsPage({ params }: PageProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [accommodationId, setAccommodationId] = useState<string>('');
  const [roomTypeId, setRoomTypeId] = useState<string>('');
  const [roomTypeName, setRoomTypeName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Unwrap params Promise
  useEffect(() => {
    params.then(({ id, roomTypeId: rtId }) => {
      setAccommodationId(id);
      setRoomTypeId(rtId);
      fetchRoomTypeDetails(id, rtId);
    });
  }, [params]);

  const fetchRoomTypeDetails = async (accId: string, rtId: string) => {
    try {
      const response = await fetch(`/api/admin/accommodations/${accId}/room-types/${rtId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setRoomTypeName(result.data.name);
      } else {
        addToast({
          type: 'error',
          message: 'Failed to load room type details',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to load room type details',
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
    router.push(`/admin/accommodations/${accommodationId}/room-types`);
  };

  if (loading || !roomTypeId) {
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
            {roomTypeName ? `Room Type: ${roomTypeName}` : 'Room Type Sections'}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleClose}
          aria-label="Back to room types"
        >
          ← Back to Room Types
        </Button>
      </div>

      {/* Section Editor */}
      <SectionEditor
        pageType="room_type"
        pageId={roomTypeId}
        onSave={handleSave}
        onClose={handleClose}
      />
    </div>
  );
}
