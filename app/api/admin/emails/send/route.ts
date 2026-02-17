import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabaseServer';
import * as emailService from '@/services/emailService';
import { sendBulkEmailSchema } from '@/schemas/emailSchemas';

/**
 * POST /api/admin/emails/send
 * Sends email to multiple recipients
 * Requirements: 4.1, 4.2, 4.3
 */
export async function POST(request: Request) {
  try {
    console.log('[API /api/admin/emails/send] Request received');
    
    // 1. Auth check
    const supabase = await createAuthenticatedClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      console.log('[API /api/admin/emails/send] Auth failed');
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Parse and validate
    const body = await request.json();
    console.log('[API /api/admin/emails/send] Body parsed, recipients:', body.recipients?.length);
    
    const validation = sendBulkEmailSchema.safeParse(body);
    
    if (!validation.success) {
      console.log('[API /api/admin/emails/send] Validation failed:', validation.error);
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
    console.log('[API /api/admin/emails/send] Calling sendBulkEmail service');
    const result = await emailService.sendBulkEmail(validation.data);
    console.log('[API /api/admin/emails/send] Service returned:', result.success ? 'SUCCESS' : 'FAILURE');

    // 4. Return response
    if (result.success) {
      console.log('[API /api/admin/emails/send] Returning 200 success');
      return NextResponse.json(result, { status: 200 });
    } else {
      const statusCode = result.error.code === 'VALIDATION_ERROR' ? 400 
                       : result.error.code === 'NOT_FOUND' ? 404 
                       : 500;
      console.log('[API /api/admin/emails/send] Returning error with status:', statusCode);
      return NextResponse.json(result, { status: statusCode });
    }
  } catch (error) {
    console.error('[API /api/admin/emails/send] Exception caught:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
