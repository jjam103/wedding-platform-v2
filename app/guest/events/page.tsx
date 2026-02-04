'use client';

import { useState, useEffect, useCallback } from 'react';
import { EventCard } from '@/components/guest/EventCard';
import { EventPreviewModal } from '@/components/guest/EventPreviewModal';
import type { Event } from '@/schemas/eventSchemas';

interface EventWithRSVP extends Event {
  rsvpStatus?: 'attending' | 'declined' | 'maybe' | 'pending';
  activityCount?: number;
}

/**
 * Guest Events Page
 * 
 * Displays list of events guest is invited to with RSVP status and filtering.
 * 
 * Requirements: 9.1, 9.2, 9.5, 9.6
 */
export default function GuestEventsPage() {
  const [events, setEvents] = useState<EventWithRSVP[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventWithRSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventWithRSVP | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Filter state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/guest/events');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch events');
      }

      setEvents(result.data || []);
      setFilteredEvents(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Apply date range filter
  useEffect(() => {
    let filtered = [...events];

    if (dateFrom) {
      filtered = filtered.filter(event => 
        new Date(event.startDate) >= new Date(dateFrom)
      );
    }

    if (dateTo) {
      filtered = filtered.filter(event => 
        new Date(event.startDate) <= new Date(dateTo)
      );
    }

    setFilteredEvents(filtered);
  }, [events, dateFrom, dateTo]);

  // Handle event card click
  const handleEventClick = useCallback((event: EventWithRSVP) => {
    setSelectedEvent(event);
    setShowPreviewModal(true);
  }, []);

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setShowPreviewModal(false);
    setSelectedEvent(null);
  }, []);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setDateFrom('');
    setDateTo('');
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Events</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchEvents}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-emerald-900 mb-2">Events</h1>
          <p className="text-lg text-emerald-700">
            View all wedding events and manage your attendance
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-emerald-900 mb-4">Filter Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                id="dateFrom"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                id="dateTo"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-xl text-gray-600">
              {events.length === 0 
                ? "No events found. Check back later for updates!"
                : "No events match your filters. Try adjusting your date range."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => handleEventClick(event)}
              />
            ))}
          </div>
        )}

        {/* Event Preview Modal */}
        {selectedEvent && (
          <EventPreviewModal
            event={selectedEvent}
            isOpen={showPreviewModal}
            onClose={handleCloseModal}
          />
        )}
      </div>
    </div>
  );
}
