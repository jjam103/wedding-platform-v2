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
}

interface Itinerary {
  guest_id: string;
  guest_name: string;
  events: ItineraryEvent[];
  accommodation?: any;
  transportation?: any;
  generated_at: string;
}

/**
 * Itinerary Viewer Component
 * 
 * Displays personalized itinerary with offline caching:
 * - Events and activities timeline
 * - Accommodation information
 * - Transportation details
 * - PDF export (future enhancement)
 * - Offline access via caching
 * 
 * Requirements: 13.10, 18.3, 18.4
 */
export function ItineraryViewer({ guest }: ItineraryViewerProps) {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

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
              <a
                href="/guest/dashboard"
                className="text-ocean-600 hover:text-ocean-700 font-medium"
              >
                ← Back to Dashboard
              </a>
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
              
              {itinerary.events.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sage-600">No events scheduled yet.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {groupEventsByDate(itinerary.events).map(({ date, events }) => (
                    <div key={date}>
                      <h3 className="text-lg font-semibold text-jungle-700 mb-4 pb-2 border-b border-sage-200">
                        {formatDate(events[0].date)}
                      </h3>
                      <div className="space-y-4">
                        {events.map(event => (
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
                                <div>
                                  <h4 className="font-semibold text-sage-800">{event.name}</h4>
                                  {event.description && (
                                    <p className="text-sm text-sage-600 mt-1">
                                      {event.description}
                                    </p>
                                  )}
                                </div>
                                {event.rsvp_status && (
                                  <span
                                    className={`ml-4 inline-block px-2 py-1 rounded-full text-xs font-medium border ${getRSVPStatusColor(
                                      event.rsvp_status
                                    )}`}
                                  >
                                    {event.rsvp_status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
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
