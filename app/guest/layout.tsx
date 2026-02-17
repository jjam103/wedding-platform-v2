import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { GuestNavigation } from '@/components/guest/GuestNavigation';
import { createSupabaseClient } from '@/lib/supabase';

export const metadata = {
  title: 'Guest Portal - Costa Rica Wedding',
  description: 'Manage your wedding attendance, view itinerary, and more',
};

export default async function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('guest_session')?.value;

  // Check if guest session exists
  if (!sessionToken) {
    redirect('/auth/guest-login');
  }

  // Verify session and get guest information using service role
  const supabase = createSupabaseClient();
  
  const { data: session, error: sessionError } = await supabase
    .from('guest_sessions')
    .select('guest_id, expires_at')
    .eq('token', sessionToken)
    .single();

  if (sessionError || !session) {
    // Invalid session
    redirect('/auth/guest-login');
  }

  // Check if session has expired
  if (new Date(session.expires_at) < new Date()) {
    // Session expired
    redirect('/auth/guest-login');
  }

  // Get guest information
  const { data: guest, error: guestError } = await supabase
    .from('guests')
    .select('id, first_name, last_name, email')
    .eq('id', session.guest_id)
    .single();

  if (guestError || !guest) {
    redirect('/auth/unauthorized');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 overflow-x-hidden w-full">
      <GuestNavigation />
      <main className="pt-16 w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
