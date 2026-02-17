export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { GuestDashboard } from '@/components/guest/GuestDashboard';
import { createSupabaseClient } from '@/lib/supabase';

/**
 * Guest Dashboard Page
 * 
 * Displays personalized dashboard for authenticated guests with:
 * - Upcoming events
 * - RSVP status summary
 * - Quick actions
 * 
 * Requirements: 13.1, 13.5
 */
export default async function GuestDashboardPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('guest_session')?.value;
  
  // Check if guest session exists
  if (!sessionToken) {
    redirect('/auth/guest-login');
  }
  
  // Verify session and get guest information in a single query (optimized)
  const supabase = createSupabaseClient();
  const { data: session, error: sessionError } = await supabase
    .from('guest_sessions')
    .select(`
      guest_id,
      expires_at,
      guests (
        id,
        first_name,
        last_name,
        email,
        group_id,
        age_type,
        guest_type,
        auth_method
      )
    `)
    .eq('token', sessionToken)
    .single();
  
  if (sessionError || !session || !session.guests) {
    // Invalid session or guest not found
    redirect('/auth/guest-login');
  }
  
  // Check if session has expired
  if (new Date(session.expires_at) < new Date()) {
    // Session expired
    redirect('/auth/guest-login');
  }
  
  // Extract guest data from the joined query
  const guestData = Array.isArray(session.guests) ? session.guests[0] : session.guests;
  
  if (!guestData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-jungle-50 to-ocean-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-volcano-600 mb-4">Guest Not Found</h1>
          <p className="text-sage-700 mb-4">
            We couldn't find your guest information. Please contact the wedding hosts.
          </p>
        </div>
      </div>
    );
  }
  
  // Map database fields to Guest type
  const guest = {
    id: guestData.id,
    first_name: guestData.first_name,
    last_name: guestData.last_name,
    email: guestData.email,
    group_id: guestData.group_id,
    age_type: guestData.age_type,
    guest_type: guestData.guest_type,
    auth_method: guestData.auth_method,
    invitation_sent: false, // Default value
    created_at: new Date().toISOString(), // Default value
    updated_at: new Date().toISOString(), // Default value
  };
  
  return <GuestDashboard guest={guest} />;
}
