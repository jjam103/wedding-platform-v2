'use client';

import type { Guest } from '@/types';

interface AccommodationViewerProps {
  guest: Guest;
  assignment: any;
}

/**
 * Accommodation Viewer Component
 * 
 * Displays guest's accommodation assignment details:
 * - Assigned room information
 * - Accommodation property details
 * - Check-in/check-out dates
 * - Room amenities and features
 * 
 * Requirements: 13.8, 9.1-9.14
 */
export function AccommodationViewer({ guest, assignment }: AccommodationViewerProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-jungle-50 via-ocean-50 to-sunset-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-sage-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-jungle-700">Accommodation Details</h1>
              <p className="text-sage-600 mt-1">Your room assignment information</p>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!assignment ? (
          /* No Assignment */
          <div className="bg-white rounded-lg shadow-md border border-sage-200 p-8 text-center">
            <div className="text-6xl mb-4">🏨</div>
            <h2 className="text-2xl font-bold text-sage-700 mb-2">
              No Room Assignment Yet
            </h2>
            <p className="text-sage-600 mb-4">
              Your accommodation hasn't been assigned yet. The wedding hosts will update this
              information soon.
            </p>
            <p className="text-sm text-sage-500">
              Check back later or contact the wedding hosts if you have questions.
            </p>
          </div>
        ) : (
          /* Assignment Details */
          <div className="space-y-6">
            {/* Accommodation Property Card */}
            <div className="bg-white rounded-lg shadow-md border border-sage-200 overflow-hidden">
              <div className="bg-gradient-to-r from-jungle-600 to-ocean-600 px-6 py-4">
                <h2 className="text-2xl font-bold text-white">
                  {assignment.room_types?.accommodations?.name || 'Accommodation'}
                </h2>
                {assignment.room_types?.accommodations?.address && (
                  <p className="text-jungle-100 mt-1">
                    📍 {assignment.room_types.accommodations.address}
                  </p>
                )}
              </div>

              <div className="p-6">
                {assignment.room_types?.accommodations?.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-jungle-700 mb-2">
                      About the Property
                    </h3>
                    <p className="text-sage-700">
                      {assignment.room_types.accommodations.description}
                    </p>
                  </div>
                )}

                {/* Room Type Details */}
                <div className="border-t border-sage-200 pt-6">
                  <h3 className="text-lg font-semibold text-jungle-700 mb-4">
                    Your Room Assignment
                  </h3>
                  
                  <div className="bg-jungle-50 border border-jungle-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-jungle-800">
                        {assignment.room_types?.name || 'Room'}
                      </span>
                      <span className="text-sm text-jungle-600">
                        Capacity: {assignment.room_types?.capacity || 'N/A'} guests
                      </span>
                    </div>
                    {assignment.room_types?.description && (
                      <p className="text-sm text-jungle-700 mt-2">
                        {assignment.room_types.description}
                      </p>
                    )}
                  </div>

                  {/* Stay Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-sage-50 border border-sage-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-sage-600 mb-1">Check-In</div>
                      <div className="text-lg font-semibold text-sage-800">
                        {formatDate(assignment.check_in)}
                      </div>
                    </div>
                    <div className="bg-sage-50 border border-sage-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-sage-600 mb-1">Check-Out</div>
                      <div className="text-lg font-semibold text-sage-800">
                        {formatDate(assignment.check_out)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-ocean-50 border border-ocean-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ocean-700">Total Nights:</span>
                      <span className="text-lg font-bold text-ocean-800">
                        {calculateNights(assignment.check_in, assignment.check_out)} nights
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {assignment.notes && (
                    <div className="mt-4 bg-sunset-50 border border-sunset-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-sunset-800 mb-2">
                        Special Notes
                      </h4>
                      <p className="text-sm text-sunset-700">{assignment.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Important Information */}
            <div className="bg-white rounded-lg shadow-md border border-sage-200 p-6">
              <h3 className="text-lg font-semibold text-jungle-700 mb-4">
                Important Information
              </h3>
              <div className="space-y-3 text-sm text-sage-700">
                <div className="flex items-start">
                  <span className="text-jungle-600 mr-2">✓</span>
                  <span>
                    Please bring a valid ID for check-in at the accommodation.
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="text-jungle-600 mr-2">✓</span>
                  <span>
                    Check-in time is typically after 3:00 PM, and check-out is before 11:00 AM.
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="text-jungle-600 mr-2">✓</span>
                  <span>
                    If you have any special requests or need to modify your stay, please contact
                    the wedding hosts.
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="text-jungle-600 mr-2">✓</span>
                  <span>
                    Transportation to and from the accommodation will be coordinated by the
                    wedding hosts.
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-sage-50 border border-sage-200 rounded-lg p-4">
              <h3 className="font-semibold text-sage-800 mb-2">Need Help?</h3>
              <p className="text-sm text-sage-700">
                If you have questions about your accommodation or need to make changes, please
                contact the wedding hosts. They'll be happy to assist you with any special
                requests or concerns.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
