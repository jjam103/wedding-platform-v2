'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface Activity {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  capacity?: number;
  capacityRemaining?: number;
  cost?: number;
  hostSubsidy?: number;
  slug?: string;
}

interface RSVPStatus {
  status: 'attending' | 'declined' | 'maybe' | 'pending';
  guestCount?: number;
  dietaryRestrictions?: string;
}

interface ActivityPreviewModalProps {
  activityId: string;
  onClose: () => void;
}

export function ActivityPreviewModal({ activityId, onClose }: ActivityPreviewModalProps) {
  const router = useRouter();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState<RSVPStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActivityData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch activity details
        const activityResponse = await fetch(`/api/guest/activities/${activityId}`);
        if (!activityResponse.ok) {
          throw new Error('Failed to load activity');
        }
        const activityResult = await activityResponse.json();
        if (!activityResult.success) {
          throw new Error(activityResult.error?.message || 'Failed to load activity');
        }
        setActivity(activityResult.data);

        // Fetch RSVP status
        const rsvpResponse = await fetch(`/api/guest/rsvps?activityId=${activityId}`);
        if (rsvpResponse.ok) {
          const rsvpResult = await rsvpResponse.json();
          if (rsvpResult.success && rsvpResult.data.length > 0) {
            setRsvpStatus(rsvpResult.data[0]);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load activity');
      } finally {
        setLoading(false);
      }
    }

    fetchActivityData();
  }, [activityId]);

  const handleViewFullDetails = () => {
    if (activity?.slug) {
      router.push(`/activity/${activity.slug}`);
    } else {
      router.push(`/activity/${activityId}`);
    }
    onClose();
  };

  const handleRSVPNow = () => {
    router.push(`/guest/rsvp?activityId=${activityId}`);
    onClose();
  };

  const getStatusBadge = () => {
    if (!rsvpStatus) return null;

    const badges = {
      attending: { label: 'Attending', color: 'green' },
      declined: { label: 'Declined', color: 'red' },
      maybe: { label: 'Maybe', color: 'yellow' },
      pending: { label: 'Pending', color: 'gray' },
    };

    const badge = badges[rsvpStatus.status];
    return (
      <span className={`inline-block px-3 py-1 text-sm font-medium bg-${badge.color}-100 text-${badge.color}-800 rounded-full`}>
        {badge.label}
      </span>
    );
  };

  const getCapacityStatus = () => {
    if (!activity?.capacity) return null;

    const remaining = activity.capacityRemaining ?? activity.capacity;
    const percentFull = ((activity.capacity - remaining) / activity.capacity) * 100;

    let statusColor = 'green';
    let statusText = 'Available';

    if (remaining === 0) {
      statusColor = 'red';
      statusText = 'Full';
    } else if (percentFull >= 90) {
      statusColor = 'yellow';
      statusText = 'Almost Full';
    }

    return (
      <div className="flex items-center gap-2">
        <span className={`inline-block w-2 h-2 rounded-full bg-${statusColor}-500`}></span>
        <span className="text-sm font-medium text-gray-700">
          {remaining} / {activity.capacity} spots {statusText}
        </span>
      </div>
    );
  };

  const getGuestCost = () => {
    if (!activity?.cost) return null;

    const subsidy = activity.hostSubsidy ?? 0;
    const guestCost = (activity.cost ?? 0) - subsidy;

    return (
      <div>
        <p className="text-2xl font-bold text-gray-900">${guestCost.toFixed(2)}</p>
        {subsidy > 0 && (
          <p className="text-sm text-gray-500">
            (${(activity.cost ?? 0).toFixed(2)} - ${subsidy.toFixed(2)} host subsidy)
          </p>
        )}
      </div>
    );
  };

  // Handle click outside modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Activity Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          )}

          {!loading && !error && activity && (
            <div className="space-y-6">
              {/* Activity Title and Status */}
              <div>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-3xl font-bold text-gray-900">{activity.title}</h3>
                  {getStatusBadge()}
                </div>
                {rsvpStatus?.guestCount && (
                  <p className="text-sm text-gray-600">
                    Guest count: {rsvpStatus.guestCount}
                  </p>
                )}
              </div>

              {/* Activity Details */}
              <div className="space-y-3">
                {activity.date && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📅</span>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date</p>
                      <p className="text-lg text-gray-900">
                        {new Date(activity.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {activity.time && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🕐</span>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Time</p>
                      <p className="text-lg text-gray-900">{activity.time}</p>
                    </div>
                  </div>
                )}

                {activity.location && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Location</p>
                      <p className="text-lg text-gray-900">{activity.location}</p>
                    </div>
                  </div>
                )}

                {activity.capacity && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👥</span>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Capacity</p>
                      {getCapacityStatus()}
                    </div>
                  </div>
                )}

                {activity.cost !== undefined && activity.cost > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💰</span>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Cost per Guest</p>
                      {getGuestCost()}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {activity.description && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700 leading-relaxed">{activity.description}</p>
                </div>
              )}

              {/* RSVP Details */}
              {rsvpStatus && rsvpStatus.dietaryRestrictions && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Your Dietary Restrictions</h4>
                  <p className="text-gray-700">{rsvpStatus.dietaryRestrictions}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && activity && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            {(!rsvpStatus || rsvpStatus.status === 'pending') && (
              <Button onClick={handleRSVPNow}>
                RSVP Now
              </Button>
            )}
            <Button variant="primary" onClick={handleViewFullDetails}>
              View Full Details
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
