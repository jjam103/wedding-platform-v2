import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    // Get current guest
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('id, group_id, age_type')
      .eq('email', session.user.email)
      .single();
    
    if (guestError || !guest) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Guest profile not found' } },
        { status: 404 }
      );
    }
    
    // Get family members based on access control
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
