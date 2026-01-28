export const dynamic = 'force-dynamic';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { FamilyManager } from '@/components/guest/FamilyManager';

/**
 * Family Information Page
 * 
 * Displays family group information with access control:
 * - Adults can view/edit all family members
 * - Children can only view/edit their own information
 * 
 * Requirements: 13.2, 13.3, 13.4
 */
export default async function FamilyPage() {
  const supabase = createServerComponentClient({ cookies });
  
  // Check authentication
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session) {
    redirect('/auth/login?redirect=/guest/family');
  }
  
  // Get guest information for the logged-in user
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
  
  // Fetch family members based on access control
  let familyMembers = [];
  
  if (guest.age_type === 'adult') {
    // Adults can see all family members in their group
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('group_id', guest.group_id)
      .order('age_type', { ascending: false }) // Adults first
      .order('first_name', { ascending: true });
    
    if (!error && data) {
      familyMembers = data;
    }
  } else {
    // Children can only see themselves
    familyMembers = [guest];
  }
  
  return <FamilyManager currentGuest={guest} familyMembers={familyMembers} />;
}
