'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { Event } from '@/schemas/eventSchemas';

interface EventPreviewModalProps {
  event: Event & {
    rsvpStatus?: 'attending' | 'declined' | 'maybe' | 'pending';
    activityCount?: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

interface Activity {
  id: string;
  name: string;
  activityType: string;
  startTime: string;
  capacity?: number;
  costPerPerson?: number;
}

/**
 * EventPreviewModal Component
 * 
 * Displays detailed event information in a modal with activities list and RSVP actions.
 * 
 * Requirements: 25.1, 25.2, 25.3, 25.4
 */
export function EventPreviewModal({ event, isOpen, onClose }: EventPreviewModalProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch activities for this event
  useEffect(() => {
    if (isOpen && event.id) {
      fetchActivities();
    }
  }, [isOpen, event.id]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/guest/activities?eventId=${event.id}`);
      const result = await response.json();

      if (result.success) {
        setActivities(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle RSVP action
  const handleRSVP = () => {
    // Navigate to RSVP page or open RSVP form
    window.location.href = `/guest/rsvp?eventId=${event.id}`;
  };

  // Handle view full details
  const handleViewDetails = () => {
    window.location.href = `/event/${event.slug || event.id}`;
  };

  if (!isOpen) return null;

  // Format date and time
  const eventDate = format(new Date(event.startDate), 'EEEE, MMMM d, yyyy');
  const eventTime = format(new Date(event.startDate), 'h:mm a');
  const endTime = event.endDate ? format(new Date(event.endDate), 'h:mm a') : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all w-full max-w-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
            <div className="flex items-start justify-between">
              <h3 className="text-2xl font-bold text-white" id="modal-title">
                {event.name}
              </h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20 text-white">
                {event.eventType}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            {/* Date and Time */}
            <div className="flex items-start">
              <svg className="w-6 h-6 mr-3 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="font-semibold text-gray-900">{eventDate}</div>
                <div className="text-gray-600">
                  {eventTime}{endTime && ` - ${endTime}`}
                </div>
              </div>
            </div>

            {/* Location */}
            {event.locationId && (
              <div className="flex items-start">
                <svg className="w-6 h-6 mr-3 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <div className="font-semibold text-gray-900">Location</div>
                  <div className="text-gray-600">View location details</div>
                </div>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <div 
                  className="text-gray-600 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              </div>
            )}

            {/* RSVP Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Your RSVP Status</div>
                  <div>
                    {event.rsvpStatus === 'attending' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        ✓ Attending
                      </span>
                    )}
                    {event.rsvpStatus === 'declined' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        ✗ Declined
                      </span>
                    )}
                    {event.rsvpStatus === 'maybe' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        ? Maybe
                      </span>
                    )}
                    {!event.rsvpStatus || event.rsvpStatus === 'pending' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleRSVP}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  {event.rsvpStatus && event.rsvpStatus !== 'pending' ? 'Update RSVP' : 'RSVP Now'}
                </button>
              </div>
            </div>

            {/* Activities */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : activities.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Activities ({activities.length})</h4>
                <div className="space-y-2">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{activity.name}</div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(activity.startTime), 'h:mm a')}
                          {activity.capacity && ` • Capacity: ${activity.capacity}`}
                          {activity.costPerPerson && ` • $${activity.costPerPerson}/person`}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {activity.activityType}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              Close
            </button>
            <button
              onClick={handleViewDetails}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              View Full Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
