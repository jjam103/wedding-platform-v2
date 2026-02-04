'use client';

import { format } from 'date-fns';
import type { Event } from '@/schemas/eventSchemas';

interface EventCardProps {
  event: Event & {
    rsvpStatus?: 'attending' | 'declined' | 'maybe' | 'pending';
    activityCount?: number;
  };
  onClick: () => void;
}

/**
 * EventCard Component
 * 
 * Displays event information with RSVP status and activity count.
 * 
 * Requirements: 9.1, 9.2
 */
export function EventCard({ event, onClick }: EventCardProps) {
  // Format date and time
  const eventDate = format(new Date(event.startDate), 'EEEE, MMM d, yyyy');
  const eventTime = format(new Date(event.startDate), 'h:mm a');
  const endTime = event.endDate ? format(new Date(event.endDate), 'h:mm a') : null;

  // Get RSVP status badge
  const getRSVPBadge = () => {
    if (!event.rsvpStatus || event.rsvpStatus === 'pending') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Pending
        </span>
      );
    }

    const badges = {
      attending: { label: 'Attending', color: 'green' },
      declined: { label: 'Declined', color: 'red' },
      maybe: { label: 'Maybe', color: 'yellow' },
    };

    const badge = badges[event.rsvpStatus];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${badge.color}-100 text-${badge.color}-800`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold text-white line-clamp-2">
            {event.name}
          </h3>
          <span className="ml-2 text-xs px-2 py-1 bg-white bg-opacity-20 text-white rounded">
            {event.eventType}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Date and Time */}
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div>
            <div className="font-medium text-gray-900">{eventDate}</div>
            <div>
              {eventTime}{endTime && ` - ${endTime}`}
            </div>
          </div>
        </div>

        {/* Location */}
        {event.locationId && (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>View location</span>
          </div>
        )}

        {/* Activity Count */}
        {event.activityCount !== undefined && event.activityCount > 0 && (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>{event.activityCount} {event.activityCount === 1 ? 'activity' : 'activities'}</span>
          </div>
        )}

        {/* Description Preview */}
        {event.description && (
          <div className="text-sm text-gray-600 line-clamp-2">
            <div dangerouslySetInnerHTML={{ __html: event.description }} />
          </div>
        )}

        {/* RSVP Badge */}
        <div className="pt-2 border-t border-gray-200">
          {getRSVPBadge()}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          View Details →
        </button>
      </div>
    </div>
  );
}
