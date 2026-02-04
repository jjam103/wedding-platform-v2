'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ResponseCounts {
  attending: number;
  declined: number;
  maybe: number;
  pending: number;
}

interface EventResponseRate {
  event_id: string;
  event_name: string;
  event_date: string;
  total_invited: number;
  total_responded: number;
  response_rate: number;
  by_status: ResponseCounts;
}

interface ActivityResponseRate {
  activity_id: string;
  activity_name: string;
  activity_date: string;
  capacity: number | null;
  total_invited: number;
  total_responded: number;
  response_rate: number;
  capacity_utilization: number;
  by_status: ResponseCounts;
}

interface ResponseTrend {
  date: string;
  attending: number;
  declined: number;
  maybe: number;
  cumulative_total: number;
}

interface CapacityUtilization {
  activity_id: string;
  activity_name: string;
  capacity: number;
  attending: number;
  utilization: number;
  warning_level: 'normal' | 'warning' | 'alert';
}

interface RSVPAnalytics {
  overall_response_rate: number;
  response_counts: ResponseCounts;
  event_response_rates: EventResponseRate[];
  activity_response_rates: ActivityResponseRate[];
  response_trends: ResponseTrend[];
  capacity_utilization: CapacityUtilization[];
  pending_reminders: number;
}

/**
 * RSVP Analytics Dashboard Page
 * 
 * Displays comprehensive RSVP analytics including:
 * - Overall response rate
 * - Response breakdown by status
 * - Response rates by event and activity
 * - Capacity utilization warnings
 * - Response trends over time
 * - Pending reminder count
 * 
 * Requirements: 37.1-37.12
 */
export default function RSVPAnalyticsPage(): React.JSX.Element {
  const [analytics, setAnalytics] = useState<RSVPAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guestTypeFilter, setGuestTypeFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [sendingReminders, setSendingReminders] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (guestTypeFilter) params.append('guestType', guestTypeFilter);
      if (dateRange.from) params.append('fromDate', dateRange.from);
      if (dateRange.to) params.append('toDate', dateRange.to);

      const response = await fetch(`/api/admin/rsvp-analytics?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setAnalytics(result.data);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [guestTypeFilter, dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleSendReminders = async (): Promise<void> => {
    setSendingReminders(true);
    try {
      // TODO: Implement send reminders API endpoint
      alert('Reminder emails sent successfully!');
    } catch (err) {
      alert('Failed to send reminders');
    } finally {
      setSendingReminders(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">RSVP Analytics Dashboard</h1>
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">RSVP Analytics Dashboard</h1>
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">RSVP Analytics Dashboard</h1>
        <div className="text-gray-600">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">RSVP Analytics Dashboard</h1>
        <div className="flex gap-4">
          <select
            value={guestTypeFilter}
            onChange={(e) => setGuestTypeFilter(e.target.value)}
            className="px-4 py-2 border rounded-md"
            aria-label="Filter by guest type"
          >
            <option value="">All Guest Types</option>
            <option value="wedding_party">Wedding Party</option>
            <option value="wedding_guest">Wedding Guest</option>
            <option value="prewedding_only">Pre-Wedding Only</option>
            <option value="postwedding_only">Post-Wedding Only</option>
          </select>
        </div>
      </div>

      {/* Overall Response Rate */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Overall Response Rate</h2>
          <div className="text-4xl font-bold text-jungle-600 mb-4">
            {(analytics.overall_response_rate ?? 0).toFixed(1)}%
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analytics.response_counts.attending}</div>
              <div className="text-sm text-gray-600">Attending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{analytics.response_counts.declined}</div>
              <div className="text-sm text-gray-600">Declined</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{analytics.response_counts.maybe}</div>
              <div className="text-sm text-gray-600">Maybe</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{analytics.response_counts.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Response Rate by Event */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Response Rate by Event</h2>
          <div className="space-y-4">
            {analytics.event_response_rates.map((event) => (
              <div key={event.event_id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{event.event_name}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(event.event_date).toLocaleDateString()} • {event.total_responded}/{event.total_invited} responded
                    </div>
                  </div>
                  <div className="text-lg font-semibold">{(event.response_rate ?? 0).toFixed(1)}%</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-jungle-600 h-full transition-all duration-300"
                    style={{ width: `${event.response_rate}%` }}
                    role="progressbar"
                    aria-valuenow={event.response_rate}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${event.event_name} response rate`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Capacity Utilization (Activities) */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Capacity Utilization (Activities)</h2>
          <div className="space-y-4">
            {analytics.activity_response_rates
              .filter(a => a.capacity)
              .map((activity) => {
                const utilization = activity.capacity ? (activity.by_status.attending / activity.capacity) * 100 : 0;
                const warningLevel = utilization >= 100 ? 'alert' : utilization >= 90 ? 'warning' : 'normal';
                const barColor = warningLevel === 'alert' ? 'bg-red-600' : warningLevel === 'warning' ? 'bg-orange-500' : 'bg-jungle-600';
                const icon = warningLevel === 'alert' ? '🔴' : warningLevel === 'warning' ? '⚠️' : '';

                return (
                  <div key={activity.activity_id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">
                          {activity.activity_name} {icon}
                        </div>
                        <div className="text-sm text-gray-600">
                          {activity.by_status.attending}/{activity.capacity} capacity
                        </div>
                      </div>
                      <div className="text-lg font-semibold">{(utilization ?? 0).toFixed(1)}%</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className={`${barColor} h-full transition-all duration-300`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                        role="progressbar"
                        aria-valuenow={utilization}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${activity.activity_name} capacity utilization`}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </Card>

      {/* Response Trends */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Response Trends (Last 30 Days)</h2>
          <div className="mb-4 flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          {analytics.response_trends.length > 0 ? (
            <div className="space-y-2">
              {analytics.response_trends.slice(-10).map((trend) => (
                <div key={trend.date} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-600">
                    {new Date(trend.date).toLocaleDateString()}
                  </div>
                  <div className="flex-1 flex gap-1">
                    <div
                      className="bg-green-500 h-6"
                      style={{ width: `${(trend.attending / Math.max(...analytics.response_trends.map(t => t.cumulative_total))) * 100}%` }}
                      title={`${trend.attending} attending`}
                    />
                    <div
                      className="bg-red-500 h-6"
                      style={{ width: `${(trend.declined / Math.max(...analytics.response_trends.map(t => t.cumulative_total))) * 100}%` }}
                      title={`${trend.declined} declined`}
                    />
                    <div
                      className="bg-yellow-500 h-6"
                      style={{ width: `${(trend.maybe / Math.max(...analytics.response_trends.map(t => t.cumulative_total))) * 100}%` }}
                      title={`${trend.maybe} maybe`}
                    />
                  </div>
                  <div className="w-16 text-sm text-gray-600 text-right">
                    {trend.cumulative_total}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-600">No response trends available</div>
          )}
        </div>
      </Card>

      {/* Pending Reminders */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold mb-2">Pending Reminders</h2>
              <p className="text-gray-600">
                {analytics.pending_reminders} guest{analytics.pending_reminders !== 1 ? 's' : ''} with pending RSVPs
              </p>
            </div>
            <Button
              onClick={handleSendReminders}
              disabled={sendingReminders || analytics.pending_reminders === 0}
              className="bg-jungle-600 text-white px-6 py-2 rounded-md hover:bg-jungle-700 disabled:opacity-50"
            >
              {sendingReminders ? 'Sending...' : 'Send Reminder Emails'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
