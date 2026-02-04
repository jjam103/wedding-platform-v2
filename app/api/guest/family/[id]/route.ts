import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sanitizeInput } from '@/utils/sanitization';
import { sendEmail } from '@/services/emailService';

/**
 * Family Member Update API Route
 * 
 * PUT: Update family member (group owner only)
 * 
 * Requirements: 6.4, 6.5, 6.6, 6.7, 6.8, 6.12
 */

const updateFamilyMemberSchema = z.object({
  first_name: z.string().min(1).max(50).optional(),
  last_name: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  dietary_restrictions: z.string().max(500).optional(),
});

/**
 * PUT /api/guest/family/[id]
 * Update family member (group owner only)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Await params (Next.js 15+)
    const { id } = await params;
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    // Get current guest
    const { data: currentGuest, error: guestError } = await supabase
      .from('guests')
      .select('id, group_id, age_type')
      .eq('email', session.user.email)
      .single();
    
    if (guestError || !currentGuest) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Guest profile not found' } },
        { status: 404 }
      );
    }
    
    // Get target family member
    const { data: targetMember, error: targetError } = await supabase
      .from('guests')
      .select('*')
      .eq('id', id)
      .single();
    
    if (targetError || !targetMember) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Family member not found' } },
        { status: 404 }
      );
    }
    
    // Check permissions: adults can edit all family members, children can only edit themselves
    const canEdit = currentGuest.age_type === 'adult' 
      ? targetMember.group_id === currentGuest.group_id
      : targetMember.id === currentGuest.id;
    
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to edit this family member' } },
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
            details: validation.error.issues 
          } 
        },
        { status: 400 }
      );
    }
    
    // Sanitize inputs
    const sanitized: Record<string, any> = {};
    if (validation.data.first_name) {
      sanitized.first_name = sanitizeInput(validation.data.first_name);
    }
    if (validation.data.last_name) {
      sanitized.last_name = sanitizeInput(validation.data.last_name);
    }
    if (validation.data.email) {
      sanitized.email = sanitizeInput(validation.data.email);
    }
    if (validation.data.phone) {
      sanitized.phone = sanitizeInput(validation.data.phone);
    }
    if (validation.data.dietary_restrictions !== undefined) {
      sanitized.dietary_restrictions = validation.data.dietary_restrictions 
        ? sanitizeInput(validation.data.dietary_restrictions)
        : null;
    }
    
    // Update family member
    const { data: updatedMember, error: updateError } = await supabase
      .from('guests')
      .update(sanitized)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: updateError.message } },
        { status: 500 }
      );
    }
    
    // Send admin notification for critical updates
    const criticalFields = ['email', 'dietary_restrictions'];
    const hasCriticalUpdate = Object.keys(sanitized).some(key => criticalFields.includes(key));
    
    if (hasCriticalUpdate) {
      try {
        await sendEmail({
          to: process.env.ADMIN_EMAIL || 'admin@example.com',
          subject: 'Family Member Profile Update',
          html: `
            <h2>Family Member Profile Updated</h2>
            <p><strong>Updated by:</strong> ${currentGuest.id === targetMember.id ? 'Self' : 'Group Owner'}</p>
            <p><strong>Guest:</strong> ${updatedMember.first_name} ${updatedMember.last_name}</p>
            <p><strong>Updated Fields:</strong></p>
            <ul>
              ${Object.keys(sanitized).map(key => `<li>${key}: ${sanitized[key]}</li>`).join('')}
            </ul>
          `
        });
      } catch (emailError) {
        console.error('Failed to send admin notification:', emailError);
        // Don't fail the request if email fails
      }
    }
    
    return NextResponse.json({
      success: true,
      data: updatedMember
    });
  } catch (error) {
    console.error('Error updating family member:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update family member' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/guest/family/[id]
 * Alias for PUT to support partial updates
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params });
}
