'use client';

import { useState, useEffect, useCallback } from 'react';
import { ActivityCard } from '@/components/guest/ActivityCard';
import { ActivityPreviewModal } from '@/components/guest/ActivityPreviewModal';
import type { Activity } from '@/schemas/activitySchemas';

interface ActivityWithRSVP extends Activity {
  rsvpStatus?: 'attending' | 'declined' | 'maybe' | 'pending';
  capacityRemaining?: number;
  netCost?: number;
}

/**
 * Guest Activities Page
 * 
 * Displays list of activities guest is invited to with RSVP status, capacity, and filtering.
 * 
 * Requirements: 9.3, 9.4, 9.5, 9.7
 */
export default function GuestActivitiesPage() {
  const [activities, setActivities] = useState<ActivityWithRSVP[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityWithRSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityWithRSVP | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Filter state
  const [activityType, setActivityType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/guest/activities');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch activities');
      }

      setActivities(result.data || []);
      setFilteredActivities(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Apply filters
  useEffect(() => {
    let filtered = [...activities];

    if (activityType) {
      filtered = filtered.filter(activity => 
        activity.activityType === activityType
      );
    }

    if (dateFrom) {
      filtered = filtered.filter(activity => 
        new Date(activity.startTime) >= new Date(dateFrom)
      );
    }

    if (dateTo) {
      filtered = filtered.filter(activity => 
        new Date(activity.startTime) <= new Date(dateTo)
      );
    }

    setFilteredActivities(filtered);
  }, [activities, activityType, dateFrom, dateTo]);

  // Handle activity card click
  const handleActivityClick = useCallback((activity: ActivityWithRSVP) => {
    setSelectedActivity(activity);
    setShowPreviewModal(true);
  }, []);

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setShowPreviewModal(false);
    setSelectedActivity(null);
  }, []);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setActivityType('');
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
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Activities</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchActivities}
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
          <h1 className="text-4xl font-bold text-emerald-900 mb-2">Activities</h1>
          <p className="text-lg text-emerald-700">
            Browse all wedding activities and manage your participation
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-emerald-900 mb-4">Filter Activities</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="activityType" className="block text-sm font-medium text-gray-700 mb-1">
                Activity Type
              </label>
              <select
                id="activityType"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All Types</option>
                <option value="ceremony">Ceremony</option>
                <option value="reception">Reception</option>
                <option value="meal">Meal</option>
                <option value="transport">Transport</option>
                <option value="activity">Activity</option>
                <option value="other">Other</option>
              </select>
            </div>
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

        {/* Activities List */}
        {filteredActivities.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-xl text-gray-600">
              {activities.length === 0 
                ? "No activities found. Check back later for updates!"
                : "No activities match your filters. Try adjusting your criteria."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onClick={() => handleActivityClick(activity)}
              />
            ))}
          </div>
        )}

        {/* Activity Preview Modal */}
        {selectedActivity && showPreviewModal && (
          <ActivityPreviewModal
            activityId={selectedActivity.id}
            onClose={handleCloseModal}
          />
        )}
      </div>
    </div>
  );
}
