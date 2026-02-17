export const dynamic = 'force-dynamic';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ItineraryViewer } from '@/components/guest/ItineraryViewer';
import { generateItinerary } from '@/services/itineraryService';

/**
 * Activities Overview / Itinerary Page
 * 
 * Displays a personalized itinerary for the authenticated guest.
 * Shows all activities the guest has RSVP'd to in chronological order.
 * 
 * Requirements:
 * - Itinerary Generation with personalized guest schedules
 * - Activity RSVP filtering
 * - Chronological ordering
 * - E2E Critical Path Testing - itinerary access
 * 
 * Features:
 * - Personalized schedule based on RSVPs
 * - Day-by-day breakdown
 * - Activity details (time, location, description)
 * - PDF export capability
 * - Mobile-responsive timeline view
 */
export default async function ActivitiesOverviewPage() {
  const supabase = createServerComponentClient({ cookies });
  
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // Not authenticated, redirect to login
    redirect('/auth/guest-login');
  }
  
  // Get guest ID from session
  // Note: In the actual implementation, we need to map the auth user to a guest record
  // For now, we'll try to fetch the guest record by email
  const { data: guestData } = await supabase
    .from('guests')
    .select('*')
    .eq('email', session.user.email)
    .single();
  
  if (!guestData) {
    // Guest record not found
    return (
      <div className="min-h-screen bg-gradient-to-br from-jungle-50 to-ocean-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-jungle-800 mb-4">
            Guest Record Not Found
          </h1>
          <p className="text-sage-700 mb-6">
            We couldn't find your guest information. Please contact the wedding hosts.
          </p>
          <a 
            href="/guest/dashboard"
            className="inline-block px-6 py-3 bg-jungle-600 text-white rounded-lg hover:bg-jungle-700 transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }
  
  // Generate personalized itinerary
  const itineraryResult = await generateItinerary(guestData.id);
  
  if (!itineraryResult.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-jungle-50 to-ocean-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-jungle-800 mb-4">
            Unable to Load Itinerary
          </h1>
          <p className="text-sage-700 mb-6">
            {itineraryResult.error.message}
          </p>
          <a 
            href="/guest/dashboard"
            className="inline-block px-6 py-3 bg-jungle-600 text-white rounded-lg hover:bg-jungle-700 transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }
  
  const itinerary = itineraryResult.data;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-jungle-50 to-ocean-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-jungle-800 mb-4">
            Your Itinerary
          </h1>
          <p className="text-lg text-sage-700">
            Welcome, {guestData.first_name}! Here's your personalized schedule.
          </p>
        </div>
        
        {/* Itinerary Viewer */}
        {itinerary.events && itinerary.events.length > 0 ? (
          <ItineraryViewer 
            guest={guestData}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-sage-600">
              <svg 
                className="mx-auto h-16 w-16 mb-4 text-sage-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
              <h2 className="text-xl font-semibold text-sage-800 mb-2">
                No Activities Yet
              </h2>
              <p className="text-sage-600 mb-6">
                You haven't RSVP'd to any activities yet. Browse available activities and RSVP to build your itinerary.
              </p>
              <a 
                href="/guest/activities"
                className="inline-block px-6 py-3 bg-jungle-600 text-white rounded-lg hover:bg-jungle-700 transition-colors"
              >
                Browse Activities
              </a>
            </div>
          </div>
        )}
        
        {/* Export Options */}
        {itinerary.events && itinerary.events.length > 0 && (
          <div className="mt-8 text-center">
            <a 
              href={`/api/guest/itinerary/pdf?guestId=${guestData.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-jungle-700 border-2 border-jungle-600 rounded-lg hover:bg-jungle-50 transition-colors"
            >
              <svg 
                className="h-5 w-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
              Download PDF
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
