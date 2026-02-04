import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { GuestNavigation } from '@/components/guest/GuestNavigation';

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
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/guest-login');
  }

  // Verify user is a guest (not admin)
  const { data: guest } = await supabase
    .from('guests')
    .select('id, first_name, last_name, email')
    .eq('email', session.user.email)
    .single();

  if (!guest) {
    redirect('/auth/unauthorized');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <GuestNavigation />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
