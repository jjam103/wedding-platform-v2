'use client';

import { useState, useEffect } from 'react';
import type { Guest } from '@/types';
import { generateItinerary, cacheItinerary, getCachedItinerary } from '@/services/itineraryService';

interface ItineraryViewerProps {
  guest: Guest;
}

interface ItineraryEvent {
  id: string;
  name: string;
  type: 'event' | 'activity';
  date: string;
  time: string;
  location?: string;
  description?: string;
  rsvp_status?: string;
  capacity?: number;
  attending_count?: number;
  rsvp_deadline?: string;
}

interface Itinerary {
  guest_id: string;
  guest_name: string;
  events: ItineraryEvent[];
  accommodation?: any;
  transportation?: any;
  generated_at: string;
}

type ViewMode = 'day-by-day' | 'calendar' | 'list';

/**
 * Enhanced Itinerary Viewer Component
 * 
 * Displays personalized itinerary with enhanced features:
 * - Multiple view modes (day-by-day, calendar, list)
 * - Date range filtering
 * - Capacity warnings and deadline alerts
 * - PDF export capability
 * - Offline access via caching
 * - Quick RSVP links
 * 
 * Requirements: 26.1, 26.2, 26.3, 26.4, 26.5, 26.6, 26.7, 26.8, 13.10, 18.3, 18.4
 */
export function ItineraryViewer({ guest }: ItineraryViewerProps) {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('day-by-day');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [filteredEvents, setFilteredEvents] = useState<ItineraryEvent[]>([]);

  useEffect(() => {
    loadItinerary();
    
    // Listen for online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [guest.id]);

  // Filter events when itinerary or date filters change
  useEffect(() => {
    if (!itinerary) {
      setFilteredEvents([]);
      return;
    }

    let filtered = [...itinerary.events];

    // Apply date range filter
    if (dateFrom) {
      filtered = filtered.filter(event => new Date(event.date) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(event => new Date(event.date) <= new Date(dateTo));
    }

    // Sort chronologically
    filtered.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });

    setFilteredEvents(filtered);
  }, [itinerary, dateFrom, dateTo]);

  const loadItinerary = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load from cache first
      const cachedResult = await getCachedItinerary(guest.id);
      
      if (cachedResult.success && cachedResult.data) {
        setItinerary(cachedResult.data);
        setLoading(false);
        
        // Still try to fetch fresh data in the background
        fetchFreshItinerary();
        return;
      }
      
      // No cache, fetch fresh data
      await fetchFreshItinerary();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const fetchFreshItinerary = async () => {
    try {
      const result = await generateItinerary(guest.id);
      
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      
      setItinerary(result.data);
      
      // Cache the itinerary for offline access
      await cacheItinerary(guest.id, result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const groupEventsByDate = (events: ItineraryEvent[]) => {
    const grouped = new Map<string, ItineraryEvent[]>();
    
    events.forEach(event => {
      const dateKey = new Date(event.date).toDateString();
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(event);
    });
    
    return Array.from(grouped.entries()).map(([date, events]) => ({
      date,
      events: events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()),
    }));
  };

  const getRSVPStatusColor = (status?: string) => {
    switch (status) {
      case 'attending':
        return 'bg-jungle-100 text-jungle-800 border-jungle-300';
      case 'declined':
        return 'bg-sage-100 text-sage-800 border-sage-300';
      case 'maybe':
        return 'bg-sunset-100 text-sunset-800 border-sunset-300';
      default:
        return 'bg-volcano-100 text-volcano-800 border-volcano-300';
    }
  };

  const getCapacityWarning = (event: ItineraryEvent) => {
    if (!event.capacity || !event.attending_count) return null;
    
    const remaining = event.capacity - event.attending_count;
    const utilizationPercent = (event.attending_count / event.capacity) * 100;

    if (remaining === 0) {
      return { level: 'full', message: 'Full', color: 'bg-volcano-100 text-volcano-800' };
    } else if (utilizationPercent >= 90) {
      return { level: 'critical', message: `${remaining} spots left`, color: 'bg-sunset-100 text-sunset-800' };
    }
    return null;
  };

  const getDeadlineAlert = (event: ItineraryEvent) => {
    if (!event.rsvp_deadline) return null;

    const deadline = new Date(event.rsvp_deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDeadline < 0) {
      return { level: 'passed', message: 'Deadline passed', color: 'bg-sage-100 text-sage-800' };
    } else if (daysUntilDeadline <= 7) {
      return { level: 'approaching', message: `${daysUntilDeadline} days left`, color: 'bg-sunset-100 text-sunset-800' };
    }
    return null;
  };

  const handleExportPDF = async () => {
    try {
      const response = await fetch('/api/guest/itinerary/pdf');
      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `itinerary-${guest.first_name}-${guest.last_name}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export PDF');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-jungle-50 via-ocean-50 to-sunset-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-sage-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-jungle-700">Your Itinerary</h1>
              <p className="text-sage-600 mt-1">Personalized wedding schedule</p>
            </div>
            <div className="flex items-center space-x-4">
              {isOffline && (
                <span className="text-sm text-volcano-600 font-medium">
                  📡 Offline Mode
                </span>
              )}
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-jungle-600 text-white rounded-lg hover:bg-jungle-700 transition-colors font-medium"
              >
                📄 Export PDF
              </button>
              <a
                href="/guest/dashboard"
                className="text-ocean-600 hover:text-ocean-700 font-medium"
              >
                ← Back to Dashboard
              </a>
            </div>
          </div>
          
          {/* View Mode Toggle and Filters */}
          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2 bg-sage-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('day-by-day')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  viewMode === 'day-by-day'
                    ? 'bg-white text-jungle-700 shadow-sm'
                    : 'text-sage-600 hover:text-sage-800'
                }`}
              >
                📅 Day-by-Day
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-white text-jungle-700 shadow-sm'
                    : 'text-sage-600 hover:text-sage-800'
                }`}
              >
                📆 Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-jungle-700 shadow-sm'
                    : 'text-sage-600 hover:text-sage-800'
                }`}
              >
                📋 List
              </button>
            </div>
            
            {/* Date Range Filters */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <label htmlFor="dateFrom" className="text-sm font-medium text-sage-700">
                  From:
                </label>
                <input
                  type="date"
                  id="dateFrom"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-jungle-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label htmlFor="dateTo" className="text-sm font-medium text-sage-700">
                  To:
                </label>
                <input
                  type="date"
                  id="dateTo"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-jungle-500"
                />
              </div>
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="text-sm text-ocean-600 hover:text-ocean-700 font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Offline Notice */}
        {isOffline && itinerary && (
          <div className="bg-ocean-50 border border-ocean-200 rounded-lg p-4 mb-6">
            <p className="text-ocean-800">
              ℹ️ You're viewing a cached version of your itinerary. Connect to the internet to
              see the latest updates.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && !itinerary && (
          <div className="bg-volcano-50 border border-volcano-200 rounded-lg p-4 mb-6">
            <p className="text-volcano-800">✗ {error}</p>
          </div>
        )}

        {loading && !itinerary ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jungle-600"></div>
          </div>
        ) : itinerary ? (
          <div className="space-y-6">
            {/* Transportation Info */}
            {itinerary.transportation && (itinerary.transportation.arrival_date || itinerary.transportation.departure_date) && (
              <div className="bg-white rounded-lg shadow-md border border-sage-200 p-6">
                <h2 className="text-xl font-bold text-jungle-700 mb-4">✈️ Transportation</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {itinerary.transportation.arrival_date && (
                    <div>
                      <div className="text-sm font-medium text-sage-600 mb-1">Arrival</div>
                      <div className="text-lg text-sage-800">
                        {formatDate(itinerary.transportation.arrival_date)}
                      </div>
                      <div className="text-sm text-sage-600">
                        {formatTime(itinerary.transportation.arrival_date)}
                      </div>
                      {itinerary.transportation.airport_code && (
                        <div className="text-sm text-sage-600 mt-1">
                          Airport: {itinerary.transportation.airport_code}
                        </div>
                      )}
                    </div>
                  )}
                  {itinerary.transportation.departure_date && (
                    <div>
                      <div className="text-sm font-medium text-sage-600 mb-1">Departure</div>
                      <div className="text-lg text-sage-800">
                        {formatDate(itinerary.transportation.departure_date)}
                      </div>
                      <div className="text-sm text-sage-600">
                        {formatTime(itinerary.transportation.departure_date)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Accommodation Info */}
            {itinerary.accommodation && (
              <div className="bg-white rounded-lg shadow-md border border-sage-200 p-6">
                <h2 className="text-xl font-bold text-jungle-700 mb-4">🏨 Accommodation</h2>
                <div className="space-y-2">
                  {itinerary.accommodation.accommodation_name && (
                    <div className="text-lg font-semibold text-sage-800">
                      {itinerary.accommodation.accommodation_name}
                    </div>
                  )}
                  {itinerary.accommodation.room_type && (
                    <div className="text-sage-700">
                      Room: {itinerary.accommodation.room_type}
                    </div>
                  )}
                  {itinerary.accommodation.check_in && itinerary.accommodation.check_out && (
                    <div className="text-sm text-sage-600">
                      {formatDate(itinerary.accommodation.check_in)} -{' '}
                      {formatDate(itinerary.accommodation.check_out)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Events Timeline */}
            <div className="bg-white rounded-lg shadow-md border border-sage-200 p-6">
              <h2 className="text-xl font-bold text-jungle-700 mb-6">📅 Schedule</h2>
              
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sage-600">
                    {dateFrom || dateTo
                      ? 'No events in selected date range.'
                      : 'No events scheduled yet.'}
                  </p>
                </div>
              ) : viewMode === 'day-by-day' ? (
                <div className="space-y-8">
                  {groupEventsByDate(filteredEvents).map(({ date, events }) => (
                    <div key={date}>
                      <h3 className="text-lg font-semibold text-jungle-700 mb-4 pb-2 border-b border-sage-200">
                        {formatDate(events[0].date)}
                      </h3>
                      <div className="space-y-4">
                        {events.map(event => {
                          const capacityWarning = getCapacityWarning(event);
                          const deadlineAlert = getDeadlineAlert(event);
                          
                          return (
                            <div
                              key={event.id}
                              className="flex items-start space-x-4 pl-4 border-l-4 border-jungle-300"
                            >
                              <div className="flex-shrink-0 w-20 text-right">
                                <div className="text-sm font-medium text-sage-700">
                                  {formatTime(event.time)}
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-sage-800">{event.name}</h4>
                                    {event.location && (
                                      <p className="text-sm text-sage-600 mt-1">
                                        📍 {event.location}
                                      </p>
                                    )}
                                    {event.description && (
                                      <p className="text-sm text-sage-600 mt-1">
                                        {event.description}
                                      </p>
                                    )}
                                    
                                    {/* Capacity Warning and Deadline Alert Badges */}
                                    <div className="flex items-center gap-2 mt-2">
                                      {capacityWarning && (
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${capacityWarning.color}`}>
                                          ⚠️ {capacityWarning.message}
                                        </span>
                                      )}
                                      {deadlineAlert && (
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${deadlineAlert.color}`}>
                                          ⏰ {deadlineAlert.message}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2 ml-4">
                                    {event.rsvp_status && (
                                      <span
                                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getRSVPStatusColor(
                                          event.rsvp_status
                                        )}`}
                                      >
                                        {event.rsvp_status}
                                      </span>
                                    )}
                                    {/* Quick RSVP Link */}
                                    <a
                                      href={`/guest/${event.type}s/${event.id}/rsvp`}
                                      className="text-xs text-ocean-600 hover:text-ocean-700 font-medium"
                                    >
                                      {event.rsvp_status === 'pending' ? 'RSVP Now →' : 'Update RSVP →'}
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : viewMode === 'calendar' ? (
                <div className="space-y-6">
                  <p className="text-sm text-sage-600 mb-4">
                    Calendar view showing events by month
                  </p>
                  {/* Simple calendar grid - group by month */}
                  {Array.from(
                    new Set(filteredEvents.map(e => new Date(e.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })))
                  ).map(month => {
                    const monthEvents = filteredEvents.filter(
                      e => new Date(e.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) === month
                    );
                    
                    return (
                      <div key={month} className="border border-sage-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-jungle-700 mb-3">{month}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {monthEvents.map(event => {
                            const capacityWarning = getCapacityWarning(event);
                            const deadlineAlert = getDeadlineAlert(event);
                            
                            return (
                              <div
                                key={event.id}
                                className="border border-sage-200 rounded-lg p-3 hover:border-jungle-300 transition-colors"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="text-sm font-medium text-sage-700">
                                    {new Date(event.date).getDate()}
                                  </div>
                                  {event.rsvp_status && (
                                    <span
                                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getRSVPStatusColor(
                                        event.rsvp_status
                                      )}`}
                                    >
                                      {event.rsvp_status}
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-semibold text-sage-800 text-sm mb-1">{event.name}</h4>
                                <p className="text-xs text-sage-600">{formatTime(event.time)}</p>
                                {(capacityWarning || deadlineAlert) && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {capacityWarning && (
                                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${capacityWarning.color}`}>
                                        ⚠️
                                      </span>
                                    )}
                                    {deadlineAlert && (
                                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${deadlineAlert.color}`}>
                                        ⏰
                                      </span>
                                    )}
                                  </div>
                                )}
                                <a
                                  href={`/guest/${event.type}s/${event.id}/rsvp`}
                                  className="text-xs text-ocean-600 hover:text-ocean-700 font-medium mt-2 inline-block"
                                >
                                  {event.rsvp_status === 'pending' ? 'RSVP →' : 'Update →'}
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="space-y-3">
                  {filteredEvents.map(event => {
                    const capacityWarning = getCapacityWarning(event);
                    const deadlineAlert = getDeadlineAlert(event);
                    
                    return (
                      <div
                        key={event.id}
                        className="border border-sage-200 rounded-lg p-4 hover:border-jungle-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-sage-800">{event.name}</h4>
                              {event.rsvp_status && (
                                <span
                                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getRSVPStatusColor(
                                    event.rsvp_status
                                  )}`}
                                >
                                  {event.rsvp_status}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-sage-600">
                              <span>📅 {formatDate(event.date)}</span>
                              <span>🕐 {formatTime(event.time)}</span>
                              {event.location && <span>📍 {event.location}</span>}
                            </div>
                            {event.description && (
                              <p className="text-sm text-sage-600 mt-2">{event.description}</p>
                            )}
                            {(capacityWarning || deadlineAlert) && (
                              <div className="flex items-center gap-2 mt-2">
                                {capacityWarning && (
                                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${capacityWarning.color}`}>
                                    ⚠️ {capacityWarning.message}
                                  </span>
                                )}
                                {deadlineAlert && (
                                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${deadlineAlert.color}`}>
                                    ⏰ {deadlineAlert.message}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <a
                            href={`/guest/${event.type}s/${event.id}/rsvp`}
                            className="text-sm text-ocean-600 hover:text-ocean-700 font-medium ml-4"
                          >
                            {event.rsvp_status === 'pending' ? 'RSVP Now →' : 'Update RSVP →'}
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Generated Timestamp */}
            <div className="text-center text-sm text-sage-500">
              Generated on {new Date(itinerary.generated_at).toLocaleString()}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
