import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import * as emailService from '@/services/emailService';
import { sendBulkEmailSchema } from '@/schemas/emailSchemas';

/**
 * POST /api/admin/emails/send
 * Sends email to multiple recipients
 * Requirements: 4.1, 4.2, 4.3
 */
export async function POST(request: Request) {
  try {
    // 1. Auth check
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
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
            details: validation.error.issues 
          } 
        },
        { status: 400 }
      );
    }

    // 3. Call service
    const result = await emailService.sendBulkEmail(validation.data);

    // 4. Return response
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      const statusCode = result.error.code === 'VALIDATION_ERROR' ? 400 
                       : result.error.code === 'NOT_FOUND' ? 404 
                       : 500;
      return NextResponse.json(result, { status: statusCode });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
