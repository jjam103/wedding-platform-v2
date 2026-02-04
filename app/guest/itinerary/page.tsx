export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ItineraryViewer } from '@/components/guest/ItineraryViewer';

/**
 * Itinerary Page
 * 
 * Displays personalized itinerary for the guest with enhanced features:
 * - Events and activities schedule in chronological order
 * - Multiple view modes (day-by-day, calendar, list)
 * - Date range filtering
 * - Capacity warnings and deadline alerts
 * - PDF export capability
 * - Accommodation details
 * - Transportation information
 * 
 * Requirements: 26.1, 26.2, 26.4, 26.5, 26.6, 13.10, 18.3, 18.4
 */
export default async function ItineraryPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
  
  // Check authentication
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session) {
    redirect('/auth/login?redirect=/guest/itinerary');
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
  
  return <ItineraryViewer guest={guest} />;
}
