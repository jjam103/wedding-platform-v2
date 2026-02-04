import { createAuthenticatedClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * POST /api/admin/guests/bulk-auth-method
 * 
 * Updates authentication method for multiple guests
 * 
 * Requirements: 22.7
 */

const bulkUpdateAuthMethodSchema = z.object({
  guest_ids: z.array(z.string().uuid()).min(1).max(100),
  auth_method: z.enum(['email_matching', 'magic_link']),
  send_notification: z.boolean().optional().default(false),
});

function getStatusCode(errorCode: string): number {
  const statusMap: Record<string, number> = {
    'VALIDATION_ERROR': 400,
    'UNAUTHORIZED': 401,
    'FORBIDDEN': 403,
    'DATABASE_ERROR': 500,
    'INTERNAL_ERROR': 500,
  };
  return statusMap[errorCode] || 500;
}

export async function POST(request: Request) {
  try {
    // 1. AUTHENTICATION
    const supabase = await createAuthenticatedClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. VALIDATION
    const body = await request.json();
    const validation = bulkUpdateAuthMethodSchema.safeParse(body);

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

    const { guest_ids, auth_method, send_notification } = validation.data;

    // 3. SERVICE CALL
    // Update all guests in a single query
    const { data: updatedGuests, error: updateError } = await supabase
      .from('guests')
      .update({ auth_method })
      .in('id', guest_ids)
      .select('id, email, first_name, last_name, auth_method');

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DATABASE_ERROR', message: 'Failed to update guests', details: updateError },
        },
        { status: 500 }
      );
    }

    // TODO: Send notification emails if requested (Task 8.3)
    // This will be implemented when email system is enhanced
    if (send_notification && updatedGuests && updatedGuests.length > 0) {
      // Future: Send email notifications to guests about auth method change
      console.log(`Would send notifications to ${updatedGuests.length} guests about auth method change`);
    }

    // 4. RESPONSE
    return NextResponse.json(
      {
        success: true,
        data: {
          updated_count: updatedGuests?.length || 0,
          guests: updatedGuests || [],
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API Error:', { path: request.url, method: request.method, error });
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
