'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type { Guest, Event, Activity, RSVP, Vendor } from '@/types';
import { DashboardSkeleton } from '@/components/ui/SkeletonLoaders';

interface DashboardMetrics {
  totalGuests: number;
  rsvpResponseRate: number;
  totalBudget: number;
  upcomingEvents: number;
  pendingPhotos: number;
  capacityAlerts: number;
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  href: string;
  color: string;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
}

/**
 * Admin Dashboard Component
 * 
 * Main dashboard for wedding hosts providing:
 * - Key metrics display (guest count, RSVP rates, budget)
 * - Quick-action shortcuts for common tasks
 * - Real-time alerts and notifications
 * - Customizable widgets
 * - Search functionality
 */
export default function AdminDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalGuests: 0,
    rsvpResponseRate: 0,
    totalBudget: 0,
    upcomingEvents: 0,
    pendingPhotos: 0,
    capacityAlerts: 0,
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Quick action shortcuts
  const quickActions: QuickAction[] = [
    { id: 'add-guest', label: 'Add Guest', icon: '👤', href: '/admin/guests', color: 'jungle' },
    { id: 'create-event', label: 'Create Event', icon: '📅', href: '/admin/events', color: 'sunset' },
    { id: 'add-activity', label: 'Add Activity', icon: '🎯', href: '/admin/activities', color: 'ocean' },
    { id: 'manage-vendors', label: 'Manage Vendors', icon: '🤝', href: '/admin/vendors', color: 'volcano' },
    { id: 'view-rsvps', label: 'View RSVPs', icon: '✉️', href: '/admin/rsvps', color: 'sage' },
    { id: 'moderate-photos', label: 'Moderate Photos', icon: '📸', href: '/admin/photos', color: 'jungle' },
  ];

  /**
   * Fetch dashboard metrics from API
   */
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch metrics from API
      const response = await fetch('/api/admin/metrics');
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const result = await response.json();
      if (result.success) {
        setMetrics(result.data);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch real-time alerts
   */
  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/alerts');
      if (!response.ok) {
        return;
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setAlerts(result.data);
      } else {
        // If data is not an array, set empty array
        setAlerts([]);
      }
    } catch (err) {
      // Silently fail for alerts
      console.error('Failed to fetch alerts:', err);
      setAlerts([]); // Ensure alerts is always an array
    }
  }, []);

  /**
   * Handle search submission
   */
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
    }
  }, [searchQuery, router]);

  /**
   * Navigate to quick action
   */
  const handleQuickAction = useCallback((href: string) => {
    router.push(href);
  }, [router]);

  /**
   * Dismiss alert
   */
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchMetrics();
    fetchAlerts();

    // Refresh metrics every 30 seconds
    const metricsInterval = setInterval(fetchMetrics, 30000);
    // Refresh alerts every 60 seconds
    const alertsInterval = setInterval(fetchAlerts, 60000);

    return () => {
      clearInterval(metricsInterval);
      clearInterval(alertsInterval);
    };
  }, [fetchMetrics, fetchAlerts]);

  /**
   * Set up real-time subscription for RSVP changes
   */
  useEffect(() => {
    // Create Supabase client for real-time subscriptions
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables for real-time subscriptions');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Subscribe to RSVP table changes
    const channel = supabase
      .channel('rsvps-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'rsvps',
        },
        (payload) => {
          console.log('RSVP change detected:', payload);

          // Update dashboard metrics immediately
          fetchMetrics();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMetrics]);

  if (loading && metrics.totalGuests === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="w-full overflow-x-hidden">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-volcano-50 border border-volcano-200 rounded-lg p-4">
            <p className="text-volcano-800">⚠️ {error}</p>
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-3">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`flex items-start justify-between p-4 rounded-lg border ${
                  alert.type === 'error' ? 'bg-volcano-50 border-volcano-200' :
                  alert.type === 'warning' ? 'bg-sunset-50 border-sunset-200' :
                  'bg-ocean-50 border-ocean-200'
                }`}
              >
                <div className="flex-1">
                  <p className={`font-medium ${
                    alert.type === 'error' ? 'text-volcano-900' :
                    alert.type === 'warning' ? 'text-sunset-900' :
                    'text-ocean-900'
                  }`}>
                    {alert.type === 'error' ? '❌' : alert.type === 'warning' ? '⚠️' : 'ℹ️'} {alert.message}
                  </p>
                  <p className="text-sm text-sage-600 mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="ml-4 text-sage-400 hover:text-sage-600"
                  aria-label="Dismiss alert"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Total Guests"
            value={metrics.totalGuests}
            icon="👥"
            color="jungle"
            href="/admin/guests"
          />
          <MetricCard
            title="RSVP Response Rate"
            value={`${(metrics.rsvpResponseRate ?? 0).toFixed(1)}%`}
            icon="✉️"
            color="ocean"
            href="/admin/rsvps"
          />
          <MetricCard
            title="Total Budget"
            value={`$${metrics.totalBudget.toLocaleString()}`}
            icon="💰"
            color="sunset"
            href="/admin/budget"
          />
          <MetricCard
            title="Upcoming Events"
            value={metrics.upcomingEvents}
            icon="📅"
            color="volcano"
            href="/admin/events"
          />
          <MetricCard
            title="Pending Photos"
            value={metrics.pendingPhotos}
            icon="📸"
            color="sage"
            href="/admin/photos"
          />
          <MetricCard
            title="Capacity Alerts"
            value={metrics.capacityAlerts}
            icon="⚠️"
            color="volcano"
            href="/admin/capacity"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-sage-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map(action => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.href)}
                className={`p-4 bg-white border-2 border-${action.color}-200 rounded-lg hover:border-${action.color}-400 hover:shadow-md transition-all text-center`}
                aria-label={action.label}
              >
                <div className="text-3xl mb-2">{action.icon}</div>
                <div className="text-sm font-medium text-sage-900">{action.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Customizable Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity Widget */}
          <div className="bg-white rounded-lg shadow-sm border border-sage-200 p-6">
            <h3 className="text-lg font-semibold text-sage-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <ActivityItem
                icon="👤"
                text="New guest added: John Doe"
                time="5 minutes ago"
              />
              <ActivityItem
                icon="✉️"
                text="RSVP received from Jane Smith"
                time="15 minutes ago"
              />
              <ActivityItem
                icon="📸"
                text="3 new photos pending moderation"
                time="1 hour ago"
              />
            </div>
          </div>

          {/* Upcoming Deadlines Widget */}
          <div className="bg-white rounded-lg shadow-sm border border-sage-200 p-6">
            <h3 className="text-lg font-semibold text-sage-900 mb-4">Upcoming Deadlines</h3>
            <div className="space-y-3">
              <DeadlineItem
                title="RSVP Deadline"
                date="March 15, 2025"
                daysLeft={48}
                color="volcano"
              />
              <DeadlineItem
                title="Final Payment Due"
                date="April 1, 2025"
                daysLeft={65}
                color="sunset"
              />
              <DeadlineItem
                title="Menu Selection"
                date="March 20, 2025"
                daysLeft={53}
                color="ocean"
              />
            </div>
          </div>
        </div>
    </div>
  );
}

/**
 * Metric Card Component
 */
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  href: string;
}

function MetricCard({ title, value, icon, color, href }: MetricCardProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(href)}
      className="bg-white rounded-lg shadow-sm border border-sage-200 p-6 hover:shadow-md transition-shadow text-left w-full"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
        <span className={`text-2xl font-bold text-${color}-600`}>{value}</span>
      </div>
      <h3 className="text-sm font-medium text-sage-600">{title}</h3>
    </button>
  );
}

/**
 * Activity Item Component
 */
interface ActivityItemProps {
  icon: string;
  text: string;
  time: string;
}

function ActivityItem({ icon, text, time }: ActivityItemProps) {
  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-sage-50 rounded-lg transition-colors">
      <span className="text-xl">{icon}</span>
      <div className="flex-1">
        <p className="text-sm text-sage-900">{text}</p>
        <p className="text-xs text-sage-500 mt-1">{time}</p>
      </div>
    </div>
  );
}

/**
 * Deadline Item Component
 */
interface DeadlineItemProps {
  title: string;
  date: string;
  daysLeft: number;
  color: string;
}

function DeadlineItem({ title, date, daysLeft, color }: DeadlineItemProps) {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-sage-50 rounded-lg transition-colors">
      <div>
        <p className="text-sm font-medium text-sage-900">{title}</p>
        <p className="text-xs text-sage-500 mt-1">{date}</p>
      </div>
      <div className={`px-3 py-1 bg-${color}-100 text-${color}-700 rounded-full text-xs font-medium`}>
        {daysLeft} days
      </div>
    </div>
  );
}
