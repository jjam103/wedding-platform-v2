import { createAuthenticatedClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';
import { sendBulkEmail } from '@/services/emailService';
import { sendBulkEmailSchema } from '@/schemas/emailSchemas';

/**
 * POST /api/admin/emails/send
 * Sends bulk emails to multiple recipients.
 * Requirements: 8.3, 8.7
 */
export async function POST(request: Request) {
  try {
    // 1. Auth check
    const supabase = await createAuthenticatedClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        },
        { status: 401 }
      );
    }

    // 2. Parse and validate
    const body = await request.json();
    const validation = sendBulkEmailSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    // 3. Send emails
    const result = await sendBulkEmail(validation.data);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
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
