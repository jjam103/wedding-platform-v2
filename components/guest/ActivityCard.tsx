'use client';

import { format } from 'date-fns';
import type { Activity } from '@/schemas/activitySchemas';

interface ActivityCardProps {
  activity: Activity & {
    rsvpStatus?: 'attending' | 'declined' | 'maybe' | 'pending';
    capacityRemaining?: number;
    netCost?: number;
  };
  onClick: () => void;
}

/**
 * ActivityCard Component
 * 
 * Displays activity information with RSVP status, capacity, and cost.
 * 
 * Requirements: 9.3, 9.4
 */
export function ActivityCard({ activity, onClick }: ActivityCardProps) {
  // Calculate capacity percentage
  const capacityPercentage = activity.capacity && activity.capacityRemaining !== undefined
    ? ((activity.capacity - activity.capacityRemaining) / activity.capacity) * 100
    : null;

  // Determine capacity warning level
  const isNearCapacity = capacityPercentage !== null && capacityPercentage >= 90;
  const isAtCapacity = capacityPercentage !== null && capacityPercentage >= 100;

  // Format date and time
  const activityDate = format(new Date(activity.startTime), 'MMM d, yyyy');
  const activityTime = format(new Date(activity.startTime), 'h:mm a');

  // Get RSVP status badge
  const getRSVPBadge = () => {
    if (!activity.rsvpStatus || activity.rsvpStatus === 'pending') {
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

    const badge = badges[activity.rsvpStatus];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${badge.color}-100 text-${badge.color}-800`}>
        {badge.label}
      </span>
    );
  };

  // Get capacity badge
  const getCapacityBadge = () => {
    if (!activity.capacity) return null;

    if (isAtCapacity) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          ⚠️ Full
        </span>
      );
    }

    if (isNearCapacity) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          ⚠️ Almost Full
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {activity.capacityRemaining} spots left
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
            {activity.name}
          </h3>
          <span className="ml-2 text-xs px-2 py-1 bg-white bg-opacity-20 text-white rounded">
            {activity.activityType}
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
            <div className="font-medium text-gray-900">{activityDate}</div>
            <div>{activityTime}</div>
          </div>
        </div>

        {/* Location */}
        {activity.locationId && (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>View location</span>
          </div>
        )}

        {/* Capacity */}
        {activity.capacity && (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{activity.capacity} capacity</span>
          </div>
        )}

        {/* Cost */}
        {activity.netCost !== undefined && activity.netCost > 0 && (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>${(activity.netCost ?? 0).toFixed(2)} per person</span>
          </div>
        )}

        {/* Badges */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
          {getRSVPBadge()}
          {getCapacityBadge()}
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
