'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Reference {
  type: 'event' | 'activity' | 'content_page' | 'accommodation' | 'location';
  id: string;
  name?: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface ReferencePreviewProps {
  reference: Reference;
  onRemove: () => void;
}

interface ReferenceDetails {
  name: string;
  description?: string;
  date?: string;
  time?: string;
  location?: string;
  capacity?: number;
  cost?: number;
  slug?: string;
  status?: string;
  activity_type?: string;
  event_date?: string;
  address?: string;
  city?: string;
  room_count?: number;
  [key: string]: any;
}

export function ReferencePreview({ reference, onRemove }: ReferencePreviewProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [details, setDetails] = useState<ReferenceDetails | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch full details when expanded
  useEffect(() => {
    if (isExpanded && !details && !loading) {
      fetchDetails();
    }
  }, [isExpanded]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/references/${reference.type}/${reference.id}`);
      const result = await response.json();
      
      if (result.success) {
        setDetails(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch reference details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = () => {
    const badges = {
      event: { label: 'Event', color: 'bg-purple-100 text-purple-800' },
      activity: { label: 'Activity', color: 'bg-blue-100 text-blue-800' },
      content_page: { label: 'Page', color: 'bg-green-100 text-green-800' },
      accommodation: { label: 'Accommodation', color: 'bg-orange-100 text-orange-800' },
      location: { label: 'Location', color: 'bg-teal-100 text-teal-800' },
    };

    const badge = badges[reference.type];
    return (
      <span className={`inline-block px-2 py-1 text-xs font-medium ${badge.color} rounded`}>
        {badge.label}
      </span>
    );
  };

  const getViewUrl = () => {
    switch (reference.type) {
      case 'event':
        return `/admin/events`;
      case 'activity':
        return `/admin/activities`;
      case 'content_page':
        return `/admin/content-pages`;
      case 'accommodation':
        return `/admin/accommodations`;
      case 'location':
        return `/admin/locations`;
      default:
        return '#';
    }
  };

  const handleNavigate = () => {
    router.push(getViewUrl());
  };

  const renderQuickInfo = () => {
    // Use fetched details if available, otherwise fall back to metadata
    const data = details || reference.metadata || {};
    const items: React.ReactElement[] = [];

    // For events
    if (data.date || data.startTime || data.details?.startTime) {
      const dateStr = data.date || data.startTime || data.details?.startTime;
      items.push(
        <span key="date" className="text-xs text-gray-500">
          📅 {new Date(dateStr).toLocaleDateString()}
        </span>
      );
    }

    // For activities - capacity
    if (data.capacity || data.details?.capacity) {
      const cap = data.capacity || data.details?.capacity;
      items.push(
        <span key="capacity" className="text-xs text-gray-500">
          👥 {cap} guests
        </span>
      );
    }

    // Location
    if (data.location || data.details?.location) {
      const loc = data.location || data.details?.location;
      items.push(
        <span key="location" className="text-xs text-gray-500 truncate max-w-[150px]">
          📍 {loc}
        </span>
      );
    }

    // For accommodations - room count
    if (data.room_count || data.details?.roomTypeCount) {
      const rooms = data.room_count || data.details?.roomTypeCount;
      items.push(
        <span key="rooms" className="text-xs text-gray-500">
          🏠 {rooms} rooms
        </span>
      );
    }

    return items.length > 0 ? (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {items.map((item, idx) => (
          <span key={idx} className="flex items-center gap-1">
            {idx > 0 && <span>•</span>}
            {item}
          </span>
        ))}
      </div>
    ) : (
      <div className="text-xs text-gray-400 italic">
        Click to view details
      </div>
    );
  };

  const renderExpandedDetails = () => {
    if (!isExpanded) return null;

    if (loading) {
      return (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-center py-4">
            <svg className="animate-spin h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="ml-2 text-sm text-gray-600">Loading details...</span>
          </div>
        </div>
      );
    }

    if (!details) return null;

    const data = details;

    return (
      <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
        {data.description && (
          <div>
            <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Description</h5>
            <p className="text-sm text-gray-700">{data.description}</p>
          </div>
        )}

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-3">
          {data.date && (
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="text-xs text-gray-500">Date</div>
                <div className="text-sm text-gray-900">{new Date(data.date).toLocaleDateString()}</div>
              </div>
            </div>
          )}

          {data.time && (
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-xs text-gray-500">Time</div>
                <div className="text-sm text-gray-900">{data.time}</div>
              </div>
            </div>
          )}

          {data.location && (
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <div className="text-xs text-gray-500">Location</div>
                <div className="text-sm text-gray-900">{data.location}</div>
              </div>
            </div>
          )}

          {data.capacity && (
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div>
                <div className="text-xs text-gray-500">Capacity</div>
                <div className="text-sm text-gray-900">{data.capacity} guests</div>
              </div>
            </div>
          )}

          {data.cost && (
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-xs text-gray-500">Cost</div>
                <div className="text-sm text-gray-900">${data.cost}</div>
              </div>
            </div>
          )}

          {data.slug && (
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <div>
                <div className="text-xs text-gray-500">Slug</div>
                <div className="text-sm text-gray-900 font-mono">/{data.slug}</div>
              </div>
            </div>
          )}

          {data.room_count && (
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <div>
                <div className="text-xs text-gray-500">Rooms</div>
                <div className="text-sm text-gray-900">{data.room_count}</div>
              </div>
            </div>
          )}

          {data.status && (
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-xs text-gray-500">Status</div>
                <div className="text-sm text-gray-900 capitalize">{data.status}</div>
              </div>
            </div>
          )}
        </div>

        {/* Type-specific details */}
        {reference.type === 'activity' && data.activity_type && (
          <div>
            <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Activity Type</h5>
            <p className="text-sm text-gray-700 capitalize">{data.activity_type.replace('_', ' ')}</p>
          </div>
        )}

        {reference.type === 'event' && data.event_date && (
          <div>
            <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Event Date</h5>
            <p className="text-sm text-gray-700">{new Date(data.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        )}

        {reference.type === 'accommodation' && (data.address || data.city) && (
          <div>
            <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Address</h5>
            <p className="text-sm text-gray-700">
              {data.address && <span>{data.address}</span>}
              {data.city && <span>{data.address ? ', ' : ''}{data.city}</span>}
            </p>
          </div>
        )}

        {/* View button in expanded section */}
        <div className="pt-2 border-t border-gray-100">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNavigate();
            }}
            className="w-full px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View {reference.type === 'content_page' ? 'Page' : reference.type.charAt(0).toUpperCase() + reference.type.slice(1)} in Admin
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="border-2 border-gray-300 rounded-lg bg-white hover:border-emerald-500 hover:shadow-md transition-all">
      {/* Collapsed header - clickable to expand */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="w-full flex items-start justify-between gap-4 p-4 text-left hover:bg-gray-50 transition-colors rounded-lg group"
      >
        {/* Left side - main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {getTypeBadge()}
            <h4 className="font-semibold text-gray-900 truncate">
              {reference.name || details?.name || `${reference.type} (${reference.id.slice(0, 8)}...)`}
            </h4>
            {/* Expand/collapse indicator - more prominent */}
            <svg 
              className={`w-5 h-5 text-gray-500 group-hover:text-emerald-600 transition-all flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Quick info - always visible */}
          {renderQuickInfo()}
          
          {/* Click to expand hint */}
          {!isExpanded && (
            <div className="mt-2 text-xs text-gray-500 group-hover:text-emerald-600 transition-colors flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Click to view details
            </div>
          )}
        </div>

        {/* Right side - action buttons */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {/* Navigate button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNavigate();
            }}
            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 rounded transition-colors"
            aria-label="Go to reference"
            title="View in admin"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>

          {/* Remove button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
            aria-label="Remove reference"
            title="Remove reference"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </button>

      {/* Expanded details */}
      {renderExpandedDetails()}
    </div>
  );
}
