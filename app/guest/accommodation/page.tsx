export const dynamic = 'force-dynamic';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AccommodationViewer } from '@/components/guest/AccommodationViewer';

/**
 * Accommodation Details Page
 * 
 * Displays guest's accommodation assignment:
 * - Assigned room information
 * - Accommodation details
 * - Check-in/check-out dates
 * 
 * Requirements: 13.8, 9.1-9.14
 */
export default async function AccommodationPage() {
  const supabase = createServerComponentClient({ cookies });
  
  // Check authentication
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session) {
    redirect('/auth/login?redirect=/guest/accommodation');
  }
  
  // Get guest information
  const { data: guest, error: guestError } = await supabase
    .from('guests')
    .select('*')
    .eq('email', session.user.email)
    .single();
  
  if (guestError || !guest) {
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
  
  // Get room assignment
  const { data: assignment, error: assignmentError } = await supabase
    .from('room_assignments')
    .select(`
      *,
      room_types (
        *,
        accommodations (*)
      )
    `)
    .eq('guest_id', guest.id)
    .maybeSingle();
  
  return <AccommodationViewer guest={guest} assignment={assignment} />;
}
