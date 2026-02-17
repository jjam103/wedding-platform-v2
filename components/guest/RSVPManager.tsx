'use client';

import { useState, useEffect } from 'react';
import type { Guest, Event, Activity, RSVP } from '@/types';

interface RSVPManagerProps {
  guest: Guest;
}

interface EventWithRSVP extends Event {
  rsvp?: RSVP;
}

interface ActivityWithRSVP extends Activity {
  rsvp?: RSVP;
}

/**
 * RSVP Manager Component
 * 
 * Manages guest RSVPs for events and activities:
 * - Event-level RSVP forms
 * - Activity-level RSVP forms
 * - Dietary restrictions input
 * - RSVP confirmation display
 * 
 * Requirements: 13.6, 6.1-6.8
 */
export function RSVPManager({ guest }: RSVPManagerProps) {
  const [events, setEvents] = useState<EventWithRSVP[]>([]);
  const [activities, setActivities] = useState<ActivityWithRSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadRSVPData();
  }, [guest.id]);

  const loadRSVPData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [eventsResponse, activitiesResponse, rsvpsResponse] = await Promise.all([
        fetch('/api/guest/events/list'),
        fetch('/api/guest/activities/list'),
        fetch('/api/guest/rsvps'),
      ]);

      if (!eventsResponse.ok || !activitiesResponse.ok || !rsvpsResponse.ok) {
        throw new Error('Failed to load RSVP data');
      }

      const eventsData = await eventsResponse.json();
      const activitiesData = await activitiesResponse.json();
      const rsvpsData = await rsvpsResponse.json();

      if (eventsData.success && activitiesData.success && rsvpsData.success) {
        // Map RSVPs to events and activities
        const rsvpMap = new Map<string, RSVP>();
        rsvpsData.data.forEach((rsvp: RSVP) => {
          if (rsvp.event_id) {
            rsvpMap.set(`event-${rsvp.event_id}`, rsvp);
          }
          if (rsvp.activity_id) {
            rsvpMap.set(`activity-${rsvp.activity_id}`, rsvp);
          }
        });

        const eventsWithRSVP = eventsData.data.map((event: Event) => ({
          ...event,
          rsvp: rsvpMap.get(`event-${event.id}`),
        }));

        const activitiesWithRSVP = activitiesData.data.map((activity: Activity) => ({
          ...activity,
          rsvp: rsvpMap.get(`activity-${activity.id}`),
        }));

        setEvents(eventsWithRSVP);
        setActivities(activitiesWithRSVP);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const submitRSVP = async (
    type: 'event' | 'activity',
    id: string,
    status: 'attending' | 'declined' | 'maybe',
    guestCount?: number,
    dietaryNotes?: string,
    specialRequirements?: string
  ) => {
    try {
      setSubmitting(`${type}-${id}`);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/guest/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_id: guest.id,
          [type === 'event' ? 'event_id' : 'activity_id']: id,
          status,
          guest_count: guestCount,
          dietary_notes: dietaryNotes,
          special_requirements: specialRequirements,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error?.message || 'Failed to submit RSVP');
        return;
      }

      setSuccess('RSVP submitted successfully!');
      
      // Reload data to show updated RSVP
      await loadRSVPData();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(null);
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
              <h1 className="text-3xl font-bold text-jungle-700">RSVP Management</h1>
              <p className="text-sage-600 mt-1">Respond to wedding events and activities</p>
            </div>
            <a
              href="/guest/dashboard"
              className="text-ocean-600 hover:text-ocean-700 font-medium"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {success && (
          <div className="bg-jungle-50 border border-jungle-200 rounded-lg p-4 mb-6">
            <p className="text-jungle-800">✓ {success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-volcano-50 border border-volcano-200 rounded-lg p-4 mb-6">
            <p className="text-volcano-800">✗ {error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jungle-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Events Section */}
            <section>
              <h2 className="text-2xl font-bold text-jungle-700 mb-4">Wedding Events</h2>
              {events.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-sage-600">No events available at this time.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <RSVPCard
                      key={event.id}
                      type="event"
                      item={event}
                      rsvp={event.rsvp}
                      onSubmit={submitRSVP}
                      submitting={submitting === `event-${event.id}`}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      getRSVPStatusColor={getRSVPStatusColor}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Activities Section */}
            <section>
              <h2 className="text-2xl font-bold text-jungle-700 mb-4">Activities</h2>
              {activities.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-sage-600">No activities available at this time.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <RSVPCard
                      key={activity.id}
                      type="activity"
                      item={activity}
                      rsvp={activity.rsvp}
                      onSubmit={submitRSVP}
                      submitting={submitting === `activity-${activity.id}`}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      getRSVPStatusColor={getRSVPStatusColor}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

interface RSVPCardProps {
  type: 'event' | 'activity';
  item: EventWithRSVP | ActivityWithRSVP;
  rsvp?: RSVP;
  onSubmit: (
    type: 'event' | 'activity',
    id: string,
    status: 'attending' | 'declined' | 'maybe',
    guestCount?: number,
    dietaryNotes?: string,
    specialRequirements?: string
  ) => Promise<void>;
  submitting: boolean;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
  getRSVPStatusColor: (status?: string) => string;
}

function RSVPCard({
  type,
  item,
  rsvp,
  onSubmit,
  submitting,
  formatDate,
  formatTime,
  getRSVPStatusColor,
}: RSVPCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState<'attending' | 'declined' | 'maybe'>(
    rsvp?.status === 'attending' || rsvp?.status === 'declined' || rsvp?.status === 'maybe'
      ? rsvp.status
      : 'attending'
  );
  const [guestCount, setGuestCount] = useState(rsvp?.guest_count?.toString() || '1');
  const [dietaryNotes, setDietaryNotes] = useState(rsvp?.dietary_notes || '');
  const [specialRequirements, setSpecialRequirements] = useState(
    rsvp?.special_requirements || ''
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(
      type,
      item.id,
      status,
      parseInt(guestCount) || undefined,
      dietaryNotes || undefined,
      specialRequirements || undefined
    );
    setShowForm(false);
  };

  const dateField = 'start_date' in item ? item.start_date : item.start_time;

  return (
    <div className="bg-white rounded-lg shadow-md border border-sage-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-jungle-700">{item.name}</h3>
            <div className="mt-2 space-y-1">
              <p className="text-sage-700 text-sm">📅 {formatDate(dateField)}</p>
              <p className="text-sage-700 text-sm">🕐 {formatTime(dateField)}</p>
              {item.description && (
                <p className="text-sage-600 text-sm mt-2">{item.description}</p>
              )}
            </div>
          </div>
          {rsvp && (
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getRSVPStatusColor(
                rsvp.status
              )}`}
            >
              {rsvp.status.charAt(0).toUpperCase() + rsvp.status.slice(1)}
            </span>
          )}
        </div>

        {!showForm ? (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowForm(true)}
              className="bg-jungle-600 hover:bg-jungle-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              {rsvp ? 'Update RSVP' : 'Respond to RSVP'}
            </button>
            {rsvp && (
              <div className="text-sm text-sage-600">
                Responded on {new Date(rsvp.responded_at || rsvp.created_at).toLocaleDateString()}
              </div>
            )}
          </div>
        ) : (
          <form 
            onSubmit={handleSubmit} 
            className="space-y-4 mt-4 pt-4 border-t border-sage-200"
            aria-label={`RSVP form for ${item.name}`}
          >
            <div>
              <label className="block text-sm font-medium text-sage-700 mb-2">
                Your Response
              </label>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setStatus('attending')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    status === 'attending'
                      ? 'bg-jungle-600 text-white'
                      : 'bg-sage-100 text-sage-700 hover:bg-sage-200'
                  }`}
                >
                  Attending
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('maybe')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    status === 'maybe'
                      ? 'bg-sunset-600 text-white'
                      : 'bg-sage-100 text-sage-700 hover:bg-sage-200'
                  }`}
                >
                  Maybe
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('declined')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    status === 'declined'
                      ? 'bg-sage-600 text-white'
                      : 'bg-sage-100 text-sage-700 hover:bg-sage-200'
                  }`}
                >
                  Decline
                </button>
              </div>
            </div>

            {(status === 'attending' || status === 'maybe') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-sage-700 mb-1">
                    Number of Guests
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-jungle-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-sage-700 mb-1">
                    Dietary Restrictions
                  </label>
                  <textarea
                    value={dietaryNotes}
                    onChange={(e) => setDietaryNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-jungle-500"
                    placeholder="Any dietary restrictions or allergies..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-sage-700 mb-1">
                    Special Requirements
                  </label>
                  <textarea
                    value={specialRequirements}
                    onChange={(e) => setSpecialRequirements(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-jungle-500 focus:border-jungle-500"
                    placeholder="Any special requirements or notes..."
                  />
                </div>
              </>
            )}

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-jungle-600 hover:bg-jungle-700 disabled:bg-sage-400 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit RSVP'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={submitting}
                className="bg-sage-200 hover:bg-sage-300 disabled:bg-sage-100 text-sage-700 font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
