import { getAuthenticatedUser } from '@/lib/apiAuth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sanitizeInput } from '@/utils/sanitization';

const updateFamilyMemberSchema = z.object({
  first_name: z.string().min(1).max(50).optional(),
  last_name: z.string().min(1).max(50).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  dietary_restrictions: z.string().max(500).nullable().optional(),
});

/**
 * PATCH /api/guest/family/[id]
 * 
 * Updates family member information with access control:
 * - Adults can update all family members in their group
 * - Children can only update their own information
 * 
 * Requirements: 13.2, 13.3, 13.4
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser();
    
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { user, supabase } = auth;

    // 2. Await params
    const { id } = await params;
    
    // Get current guest information
    const { data: currentGuest, error: currentGuestError } = await supabase
      .from('guests')
      .select('id, group_id, age_type')
      .eq('email', user.email)
      .single();
    
    if (currentGuestError || !currentGuest) {
      return NextResponse.json(
        { success: false, error: { code: 'GUEST_NOT_FOUND', message: 'Current guest not found' } },
        { status: 404 }
      );
    }
    
    // Get target family member
    const { data: targetMember, error: targetError } = await supabase
      .from('guests')
      .select('id, group_id')
      .eq('id', id)
      .single();
    
    if (targetError || !targetMember) {
      return NextResponse.json(
        { success: false, error: { code: 'GUEST_NOT_FOUND', message: 'Family member not found' } },
        { status: 404 }
      );
    }
    
    // Check access control
    const isAdult = currentGuest.age_type === 'adult';
    const isSameGroup = currentGuest.group_id === targetMember.group_id;
    const isSelf = currentGuest.id === id;
    
    // Adults can edit all family members in their group, children can only edit themselves
    if (!isSameGroup || (!isAdult && !isSelf)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to edit this family member',
          },
        },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validation = updateFamilyMemberSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }
    
    // Sanitize input
    const sanitized: any = {};
    if (validation.data.first_name !== undefined) {
      sanitized.first_name = sanitizeInput(validation.data.first_name);
    }
    if (validation.data.last_name !== undefined) {
      sanitized.last_name = sanitizeInput(validation.data.last_name);
    }
    if (validation.data.email !== undefined) {
      sanitized.email = validation.data.email ? sanitizeInput(validation.data.email) : null;
    }
    if (validation.data.phone !== undefined) {
      sanitized.phone = validation.data.phone ? sanitizeInput(validation.data.phone) : null;
    }
    if (validation.data.dietary_restrictions !== undefined) {
      sanitized.dietary_restrictions = validation.data.dietary_restrictions
        ? sanitizeInput(validation.data.dietary_restrictions)
        : null;
    }
    
    // Update family member
    const { data: updated, error: updateError } = await supabase
      .from('guests')
      .update({
        ...sanitized,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: updateError.message } },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
