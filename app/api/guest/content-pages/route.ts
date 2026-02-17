import { NextResponse } from 'next/server';
import { listContentPages } from '@/services/contentPagesService';
import { validateGuestAuth } from '@/lib/guestAuth';

/**
 * Guest Content Pages API Route
 * 
 * Returns only published content pages for guest viewing.
 * 
 * Requirements: 8.1, 8.2
 */
export async function GET(request: Request) {
  try {
    // 1. Auth check
    const authResult = await validateGuestAuth();
    if (!authResult.success) {
      return NextResponse.json(authResult.error, { status: authResult.status });
    }
    
    // 2. Get published content pages
    const result = await listContentPages({ status: 'published' });
    
    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }
    
    // 3. Return response
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
