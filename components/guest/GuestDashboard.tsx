'use client';

import { useState, useEffect } from 'react';
import type { Guest, Event, Activity, RSVP } from '@/types';

interface GuestDashboardProps {
  guest: Guest;
}

interface UpcomingEvent {
  id: string;
  name: string;
  type: 'event' | 'activity';
  date: string;
  time: string;
  location?: string;
  rsvpStatus: 'pending' | 'attending' | 'declined' | 'maybe';
}

interface RSVPSummary {
  total: number;
  attending: number;
  declined: number;
  pending: number;
  maybe: number;
}

interface WeddingInfo {
  date: string;
  location: string;
  venue: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  urgent: boolean;
  created_at: string;
}

/**
 * Guest Dashboard Component
 * 
 * Displays personalized dashboard for guests with:
 * - Welcome message with guest name
 * - Wedding date, location, and venue
 * - Upcoming events and activities
 * - RSVP status summary
 * - Quick action links
 * - Urgent announcements
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.9, 13.1, 13.5
 */
export function GuestDashboard({ guest }: GuestDashboardProps) {
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [rsvpSummary, setRsvpSummary] = useState<RSVPSummary>({
    total: 0,
    attending: 0,
    declined: 0,
    pending: 0,
    maybe: 0,
  });
  const [weddingInfo, setWeddingInfo] = useState<WeddingInfo | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/guest-auth/logout', {
        method: 'POST',
        credentials: 'include', // Include cookies
      });

      if (response.ok) {
        // Redirect to login page
        window.location.href = '/auth/guest-login';
      } else {
        console.error('Logout failed');
        // Still redirect to login page even if logout fails
        window.location.href = '/auth/guest-login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect to login page even if logout fails
      window.location.href = '/auth/guest-login';
    }
  };

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch dashboard data
        const [eventsResponse, rsvpsResponse, weddingResponse, announcementsResponse] = await Promise.all([
          fetch('/api/guest/events', { credentials: 'include' }),
          fetch('/api/guest/rsvps', { credentials: 'include' }),
          fetch('/api/guest/wedding-info', { credentials: 'include' }),
          fetch('/api/guest/announcements', { credentials: 'include' }),
        ]);

        // Check for authentication errors (401) - redirect to login
        if (eventsResponse.status === 401 || rsvpsResponse.status === 401) {
          console.log('Authentication failed, redirecting to login');
          window.location.href = '/auth/guest-login';
          return;
        }

        // Check for other errors
        if (!eventsResponse.ok || !rsvpsResponse.ok) {
          throw new Error('Failed to load dashboard data');
        }

        // Parse JSON responses with error handling
        let eventsData, rsvpsData, weddingData, announcementsData;
        
        try {
          eventsData = await eventsResponse.json();
        } catch (e) {
          console.error('Failed to parse events response:', e);
          throw new Error('Failed to load events data');
        }
        
        try {
          rsvpsData = await rsvpsResponse.json();
        } catch (e) {
          console.error('Failed to parse RSVPs response:', e);
          throw new Error('Failed to load RSVP data');
        }
        
        try {
          weddingData = weddingResponse.ok ? await weddingResponse.json() : null;
        } catch (e) {
          console.error('Failed to parse wedding info response:', e);
          weddingData = null;
        }
        
        try {
          announcementsData = announcementsResponse.ok ? await announcementsResponse.json() : null;
        } catch (e) {
          console.error('Failed to parse announcements response:', e);
          announcementsData = null;
        }

        if (eventsData.success && rsvpsData.success) {
          // Process upcoming events
          const now = new Date();
          const upcoming = eventsData.data
            .filter((item: any) => new Date(item.date) >= now)
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5);

          setUpcomingEvents(upcoming);

          // Calculate RSVP summary
          const rsvps: RSVP[] = rsvpsData.data;
          const summary = {
            total: rsvps.length,
            attending: rsvps.filter(r => r.status === 'attending').length,
            declined: rsvps.filter(r => r.status === 'declined').length,
            pending: rsvps.filter(r => r.status === 'pending').length,
            maybe: rsvps.filter(r => r.status === 'maybe').length,
          };

          setRsvpSummary(summary);

          // Set wedding info
          if (weddingData?.success) {
            setWeddingInfo(weddingData.data);
          }

          // Set announcements (urgent first)
          if (announcementsData?.success) {
            const sorted = announcementsData.data.sort((a: Announcement, b: Announcement) => {
              if (a.urgent && !b.urgent) return -1;
              if (!a.urgent && b.urgent) return 1;
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
            setAnnouncements(sorted.slice(0, 3)); // Show top 3
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [guest.id]);

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

  const getRSVPStatusColor = (status: string) => {
    switch (status) {
      case 'attending':
        return 'bg-jungle-100 text-jungle-800 border-jungle-300';
      case 'declined':
        return 'bg-sage-100 text-sage-800 border-sage-300';
      case 'maybe':
        return 'bg-sunset-100 text-sunset-800 border-sunset-300';
      case 'pending':
        return 'bg-volcano-100 text-volcano-800 border-volcano-300';
      default:
        return 'bg-sage-100 text-sage-800 border-sage-300';
    }
  };

  const getRSVPStatusLabel = (status: string) => {
    switch (status) {
      case 'attending':
        return 'Attending';
      case 'declined':
        return 'Declined';
      case 'maybe':
        return 'Maybe';
      case 'pending':
        return 'Pending Response';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-jungle-50 via-ocean-50 to-sunset-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-sage-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-jungle-700">
                ¡Pura Vida, {guest.first_name}!
              </h1>
              <p className="text-sage-600 mt-1">Welcome to your wedding dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/guest/profile"
                className="text-ocean-600 hover:text-ocean-700 font-medium"
              >
                My Profile
              </a>
              <button
                onClick={handleLogout}
                className="text-sage-600 hover:text-sage-700 font-medium"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jungle-600"></div>
          </div>
        ) : error ? (
          <div className="bg-volcano-50 border border-volcano-200 rounded-lg p-4 mb-6">
            <p className="text-volcano-800">{error}</p>
          </div>
        ) : (
          <>
            {/* Wedding Info Banner */}
            {weddingInfo && (
              <div className="bg-gradient-to-r from-jungle-600 to-ocean-600 rounded-lg shadow-lg p-6 mb-6 text-white">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">🌴 Costa Rica Wedding 🌴</h2>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-lg">
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span>{formatDate(weddingInfo.date)}</span>
                    </div>
                    <div className="hidden sm:block">•</div>
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span>{weddingInfo.location}</span>
                    </div>
                    <div className="hidden sm:block">•</div>
                    <div className="flex items-center gap-2">
                      <span>🏨</span>
                      <span>{weddingInfo.venue}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Urgent Announcements */}
            {announcements.length > 0 && (
              <div className="mb-6 space-y-3">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className={`rounded-lg shadow-md p-4 border-l-4 ${
                      announcement.urgent
                        ? 'bg-volcano-50 border-volcano-500'
                        : 'bg-ocean-50 border-ocean-500'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {announcement.urgent && (
                        <span className="text-2xl">⚠️</span>
                      )}
                      <div className="flex-1">
                        <h3 className={`font-bold ${
                          announcement.urgent ? 'text-volcano-800' : 'text-ocean-800'
                        }`}>
                          {announcement.title}
                        </h3>
                        <p className={`mt-1 ${
                          announcement.urgent ? 'text-volcano-700' : 'text-ocean-700'
                        }`}>
                          {announcement.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* RSVP Summary Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 border border-sage-200">
                <h2 className="text-xl font-bold text-jungle-700 mb-4">RSVP Summary</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sage-700">Total Events:</span>
                    <span className="font-bold text-jungle-700">{rsvpSummary.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sage-700">Attending:</span>
                    <span className="font-bold text-jungle-600">{rsvpSummary.attending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sage-700">Pending:</span>
                    <span className="font-bold text-volcano-600">{rsvpSummary.pending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sage-700">Maybe:</span>
                    <span className="font-bold text-sunset-600">{rsvpSummary.maybe}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sage-700">Declined:</span>
                    <span className="font-bold text-sage-600">{rsvpSummary.declined}</span>
                  </div>
                </div>
                <div className="mt-6">
                  <a
                    href="/guest/rsvp"
                    className="block w-full text-center bg-jungle-600 hover:bg-jungle-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Manage RSVPs
                  </a>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white rounded-lg shadow-md p-6 border border-sage-200 mt-6">
                <h2 className="text-xl font-bold text-jungle-700 mb-4">Quick Actions</h2>
                <div className="space-y-2">
                  <a
                    href="/guest/family"
                    className="block w-full text-left bg-ocean-50 hover:bg-ocean-100 text-ocean-700 font-medium py-3 px-4 rounded-lg transition-colors border border-ocean-200"
                  >
                    👨‍👩‍👧‍👦 Family Information
                  </a>
                  <a
                    href="/guest/transportation"
                    className="block w-full text-left bg-sunset-50 hover:bg-sunset-100 text-sunset-700 font-medium py-3 px-4 rounded-lg transition-colors border border-sunset-200"
                  >
                    ✈️ Transportation Details
                  </a>
                  <a
                    href="/guest/accommodation"
                    className="block w-full text-left bg-jungle-50 hover:bg-jungle-100 text-jungle-700 font-medium py-3 px-4 rounded-lg transition-colors border border-jungle-200"
                  >
                    🏨 Accommodation Info
                  </a>
                  <a
                    href="/guest/photos"
                    className="block w-full text-left bg-volcano-50 hover:bg-volcano-100 text-volcano-700 font-medium py-3 px-4 rounded-lg transition-colors border border-volcano-200"
                  >
                    📸 Upload Photos
                  </a>
                  <a
                    href="/guest/itinerary"
                    className="block w-full text-left bg-sage-50 hover:bg-sage-100 text-sage-700 font-medium py-3 px-4 rounded-lg transition-colors border border-sage-200"
                  >
                    📅 View Itinerary
                  </a>
                </div>
              </div>
            </div>

            {/* Upcoming Events Card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6 border border-sage-200">
                <h2 className="text-xl font-bold text-jungle-700 mb-4">Upcoming Events</h2>
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sage-600">No upcoming events at this time.</p>
                    <p className="text-sage-500 text-sm mt-2">
                      Check back later for event updates!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="border border-sage-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-jungle-700">
                              {event.name}
                            </h3>
                            <div className="mt-2 space-y-1">
                              <p className="text-sage-700 text-sm">
                                📅 {formatDate(event.date)}
                              </p>
                              <p className="text-sage-700 text-sm">
                                🕐 {formatTime(event.date)}
                              </p>
                              {event.location && (
                                <p className="text-sage-700 text-sm">
                                  📍 {event.location}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getRSVPStatusColor(
                                event.rsvpStatus
                              )}`}
                            >
                              {getRSVPStatusLabel(event.rsvpStatus)}
                            </span>
                          </div>
                        </div>
                        {event.rsvpStatus === 'pending' && (
                          <div className="mt-4">
                            <a
                              href={`/guest/rsvp?${event.type}=${event.id}`}
                              className="inline-block bg-jungle-600 hover:bg-jungle-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                            >
                              Respond to RSVP
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
