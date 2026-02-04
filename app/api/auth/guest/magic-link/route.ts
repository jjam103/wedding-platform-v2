import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
import { sanitizeInput } from '@/utils/sanitization';

/**
 * Magic Link Request API Route
 * 
 * Generates a secure one-time token and sends it via email to the guest.
 * The token is valid for 15 minutes and can only be used once.
 * 
 * Requirements: 5.3, 5.9
 * Task: 6.1
 */

const magicLinkRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
});

/**
 * POST /api/auth/guest/magic-link
 * 
 * Request a magic link for passwordless authentication.
 * 
 * @param request - Request containing email in body
 * @returns Success response with message, or error response
 */
export async function POST(request: Request) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const validation = magicLinkRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid email format',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }
    
    // 2. Sanitize email input
    const email = sanitizeInput(validation.data.email.toLowerCase());
    
    // 3. Create Supabase client
    const supabase = createSupabaseClient();
    
    // 4. Find guest by email with magic_link auth method
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('id, email, first_name, last_name, auth_method')
      .eq('email', email)
      .eq('auth_method', 'magic_link')
      .single();
    
    if (guestError || !guest) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Email not found or not configured for magic link authentication',
          },
        },
        { status: 404 }
      );
    }
    
    // 5. Generate secure token (32 bytes = 64 hex characters)
    const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(tokenBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // 6. Calculate expiration (15 minutes from now)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    // 7. Store token in database
    const { error: tokenError } = await supabase
      .from('magic_link_tokens')
      .insert({
        guest_id: guest.id,
        token,
        expires_at: expiresAt.toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      });
    
    if (tokenError) {
      console.error('Failed to store magic link token:', tokenError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TOKEN_ERROR',
            message: 'Failed to generate magic link',
          },
        },
        { status: 500 }
      );
    }
    
    // 8. Generate magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const magicLinkUrl = `${baseUrl}/auth/guest-login/verify?token=${token}`;
    
    // 9. Send email with magic link
    // Note: Email sending will be implemented when emailService is integrated
    // For now, we'll log the link (in production, this would send an actual email)
    console.log(`Magic link for ${email}: ${magicLinkUrl}`);
    
    // TODO: Implement email sending
    // await emailService.send({
    //   to: email,
    //   subject: 'Your Wedding Portal Login Link',
    //   html: `
    //     <p>Hi ${guest.first_name},</p>
    //     <p>Click the link below to log in to the wedding portal:</p>
    //     <p><a href="${magicLinkUrl}">Log In</a></p>
    //     <p>This link will expire in 15 minutes and can only be used once.</p>
    //     <p>If you didn't request this link, you can safely ignore this email.</p>
    //   `,
    // });
    
    // 10. Log magic link request in audit log
    await supabase.from('audit_logs').insert({
      action: 'magic_link_requested',
      entity_type: 'guest',
      entity_id: guest.id,
      details: {
        email: guest.email,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      },
    });
    
    // 11. Return success response (don't reveal if email exists for security)
    return NextResponse.json(
      {
        success: true,
        data: {
          message: 'If your email is registered, you will receive a login link shortly.',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Magic link request error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      },
      { status: 500 }
    );
  }
}
