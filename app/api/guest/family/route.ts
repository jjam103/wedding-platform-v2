import { NextResponse } from 'next/server';
import { validateGuestAuth } from '@/lib/guestAuth';
import { createSupabaseClient } from '@/lib/supabase';

/**
 * Family Members API Routes
 * 
 * GET: Get all family members in the guest's group
 * 
 * Requirements: 6.3
 */

/**
 * GET /api/guest/family
 * Get all family members in the guest's group
 */
export async function GET(request: Request) {
  try {
    // Auth check
    const authResult = await validateGuestAuth();
    if (!authResult.success) {
      return NextResponse.json(authResult.error, { status: authResult.status });
    }
    const guest = authResult.guest;
    
    // Get family members based on access control
    const supabase = createSupabaseClient();
    let familyMembers = [];
    
    if (guest.age_type === 'adult') {
      // Adults can see all family members in their group
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('group_id', guest.group_id)
        .order('age_type', { ascending: false }) // Adults first
        .order('first_name', { ascending: true });
      
      if (error) {
        return NextResponse.json(
          { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
          { status: 500 }
        );
      }
      
      familyMembers = data || [];
    } else {
      // Children can only see themselves
      familyMembers = [guest];
    }
    
    return NextResponse.json({
      success: true,
      data: familyMembers
    });
  } catch (error) {
    console.error('Error fetching family members:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch family members' } },
      { status: 500 }
    );
  }
}
