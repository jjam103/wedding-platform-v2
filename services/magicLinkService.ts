import { createSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
import { sanitizeInput } from '@/utils/sanitization';

/**
 * Magic Link Service
 * 
 * Handles passwordless authentication via email magic links.
 * Generates secure tokens, sends emails, and verifies tokens.
 * 
 * Requirements: 5.3, 5.9
 * Tasks: 6.1, 6.2, 6.3
 */

type Result<T> = 
  | { success: true; data: T } 
  | { success: false; error: { code: string; message: string; details?: any } };

interface MagicLinkToken {
  id: string;
  token: string;
  guest_id: string;
  expires_at: string;
  used: boolean;
  used_at: string | null;
  created_at: string;
}

interface GenerateMagicLinkResult {
  token: string;
  expiresAt: Date;
  magicLink: string;
}

interface VerifyTokenResult {
  guestId: string;
  groupId: string;
  firstName: string;
  lastName: string;
  email: string;
}

const TOKEN_EXPIRY_MINUTES = 15;

/**
 * Generates a cryptographically secure random token
 */
function generateSecureToken(): string {
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(tokenBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generates a magic link for guest authentication
 * 
 * @param email - Guest email address
 * @param ipAddress - Request IP address for audit
 * @param userAgent - Request user agent for audit
 * @returns Result with token and magic link URL
 */
export async function generateMagicLink(
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<Result<GenerateMagicLinkResult>> {
  try {
    // 1. Validate and sanitize email
    const emailValidation = z.string().email().safeParse(email);
    if (!emailValidation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email format',
          details: emailValidation.error.issues,
        },
      };
    }

    const sanitizedEmail = sanitizeInput(emailValidation.data.toLowerCase());

    // 2. Find guest with magic_link auth method
    const supabase = createSupabaseClient();
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('id, email, auth_method')
      .eq('email', sanitizedEmail)
      .eq('auth_method', 'magic_link')
      .maybeSingle();

    if (guestError) {
      console.error('Guest lookup error:', guestError);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to lookup guest',
        },
      };
    }

    if (!guest) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Email not found or not configured for magic link authentication',
        },
      };
    }

    // 3. Generate secure token
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    // 4. Store token in database
    const { error: insertError } = await supabase
      .from('magic_link_tokens')
      .insert({
        guest_id: guest.id,
        token,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
      });

    if (insertError) {
      console.error('Failed to create magic link token:', insertError);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to generate magic link',
        },
      };
    }

    // 5. Generate magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const magicLink = `${baseUrl}/auth/guest-login/verify?token=${token}`;

    // 6. Log magic link request
    await supabase.from('audit_logs').insert({
      action: 'magic_link_requested',
      entity_type: 'guest',
      entity_id: guest.id,
      details: {
        email: guest.email,
        ip_address: ipAddress,
        expires_at: expiresAt.toISOString(),
      },
    });

    return {
      success: true,
      data: {
        token,
        expiresAt,
        magicLink,
      },
    };
  } catch (error) {
    console.error('Generate magic link error:', error);
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Verifies a magic link token and returns guest information
 * 
 * @param token - Magic link token to verify
 * @returns Result with guest information or error
 */
export async function verifyMagicLinkToken(
  token: string
): Promise<Result<VerifyTokenResult>> {
  try {
    // 1. Validate token format (64 hex characters)
    const tokenValidation = z.string().regex(/^[a-f0-9]{64}$/).safeParse(token);
    if (!tokenValidation.success) {
      return {
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token format',
        },
      };
    }

    const supabase = createSupabaseClient();

    // 2. Find token in database
    const { data: tokenRecord, error: tokenError } = await supabase
      .from('magic_link_tokens')
      .select('id, guest_id, expires_at, used, used_at')
      .eq('token', token)
      .maybeSingle();

    if (tokenError) {
      console.error('Token lookup error:', tokenError);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to verify token',
        },
      };
    }

    if (!tokenRecord) {
      return {
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired magic link',
        },
      };
    }

    // 3. Check if token has been used
    if (tokenRecord.used) {
      await supabase.from('audit_logs').insert({
        action: 'magic_link_verification_failed',
        entity_type: 'guest',
        entity_id: tokenRecord.guest_id,
        details: {
          reason: 'token_already_used',
          token_id: tokenRecord.id,
          used_at: tokenRecord.used_at,
        },
      });

      return {
        success: false,
        error: {
          code: 'TOKEN_USED',
          message: 'This magic link has already been used',
        },
      };
    }

    // 4. Check if token has expired (MUST check BEFORE marking as used)
    const expiresAt = new Date(tokenRecord.expires_at);
    const now = new Date();
    
    if (expiresAt < now) {
      // Log failed verification attempt (fire-and-forget)
      supabase.from('audit_logs').insert({
        action: 'magic_link_verification_failed',
        entity_type: 'guest',
        entity_id: tokenRecord.guest_id,
        details: {
          reason: 'token_expired',
          token_id: tokenRecord.id,
          expires_at: tokenRecord.expires_at,
          attempted_at: now.toISOString(),
        },
      }).then(({ error: auditError }) => {
        if (auditError) {
          console.error('Failed to log audit event:', auditError);
        }
      });

      return {
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'This magic link has expired',
        },
      };
    }

    // 5. Mark token as used
    const { error: updateError } = await supabase
      .from('magic_link_tokens')
      .update({
        used: true,
        used_at: new Date().toISOString(),
      })
      .eq('id', tokenRecord.id);

    if (updateError) {
      console.error('Failed to mark token as used:', updateError);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to verify token',
        },
      };
    }

    // 6. Get guest information
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('id, group_id, first_name, last_name, email')
      .eq('id', tokenRecord.guest_id)
      .maybeSingle();

    if (guestError) {
      console.error('Guest lookup error:', guestError);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to retrieve guest information',
        },
      };
    }

    if (!guest) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Guest not found',
        },
      };
    }

    // 7. Log successful verification
    await supabase.from('audit_logs').insert({
      action: 'magic_link_verified',
      entity_type: 'guest',
      entity_id: guest.id,
      details: {
        email: guest.email,
        token_id: tokenRecord.id,
      },
    });

    return {
      success: true,
      data: {
        guestId: guest.id,
        groupId: guest.group_id,
        firstName: guest.first_name,
        lastName: guest.last_name,
        email: guest.email,
      },
    };
  } catch (error) {
    console.error('Verify magic link token error:', error);
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Sends a magic link email to the guest
 * 
 * @param email - Guest email address
 * @param magicLink - Magic link URL
 * @param guestName - Guest's first name for personalization
 * @returns Result indicating success or failure
 */
export async function sendMagicLinkEmail(
  email: string,
  magicLink: string,
  guestName: string
): Promise<Result<void>> {
  try {
    // Import email service dynamically to avoid circular dependencies
    const { sendEmail } = await import('@/services/emailService');

    const result = await sendEmail({
      to: email,
      subject: 'Your Wedding Portal Login Link',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Welcome to Our Wedding Portal</h2>
          <p>Hi ${guestName},</p>
          <p>Click the button below to log in to your personalized wedding portal:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Log In to Wedding Portal
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            This link will expire in ${TOKEN_EXPIRY_MINUTES} minutes and can only be used once.
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            If you didn't request this link, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${magicLink}" style="color: #059669;">${magicLink}</a>
          </p>
        </div>
      `,
    });

    if (!result.success) {
      return {
        success: false,
        error: {
          code: 'EMAIL_SERVICE_ERROR',
          message: 'Failed to send magic link email',
        },
      };
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Send magic link email error:', error);
    return {
      success: false,
      error: {
        code: 'EMAIL_SERVICE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to send email',
      },
    };
  }
}
