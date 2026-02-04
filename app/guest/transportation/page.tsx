export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { TransportationForm } from '@/components/guest/TransportationForm';

/**
 * Transportation Information Page
 * 
 * Allows guests to enter and manage their flight information:
 * - Airport selection (SJO, LIR, Other)
 * - Flight details (number, airline, times)
 * 
 * Requirements: 13.7, 10.1
 */
export default async function TransportationPage() {
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
    redirect('/auth/login?redirect=/guest/transportation');
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
  
  return <TransportationForm guest={guest} />;
}
