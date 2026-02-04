import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sanitizeInput } from '@/utils/sanitization';
import { sendEmail } from '@/services/emailService';

/**
 * Guest Profile API Routes
 * 
 * GET: Get guest profile with group membership
 * PUT: Update guest profile
 * 
 * Requirements: 6.2, 6.4, 6.5, 6.6, 6.7, 6.8, 6.12
 */

const updateProfileSchema = z.object({
  first_name: z.string().min(1).max(50).optional(),
  last_name: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  dietary_restrictions: z.string().max(500).optional(),
});

/**
 * GET /api/guest/profile
 * Get guest profile with group membership
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
    
    // Get guest profile
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select(`
        *,
        groups:group_id (
          id,
          name,
          group_type
        )
      `)
      .eq('email', session.user.email)
      .single();
    
    if (guestError || !guest) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Guest profile not found' } },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: guest
    });
  } catch (error) {
    console.error('Error fetching guest profile:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch profile' } },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/guest/profile
 * Update guest profile
 */
export async function PUT(request: Request) {
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
      .select('*')
      .eq('email', session.user.email)
      .single();
    
    if (guestError || !guest) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Guest profile not found' } },
        { status: 404 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);
    
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
    
    // Update profile
    const { data: updatedGuest, error: updateError } = await supabase
      .from('guests')
      .update(sanitized)
      .eq('id', guest.id)
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
          subject: 'Guest Profile Update',
          html: `
            <h2>Guest Profile Updated</h2>
            <p><strong>Guest:</strong> ${updatedGuest.first_name} ${updatedGuest.last_name}</p>
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
      data: updatedGuest
    });
  } catch (error) {
    console.error('Error updating guest profile:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update profile' } },
      { status: 500 }
    );
  }
}
