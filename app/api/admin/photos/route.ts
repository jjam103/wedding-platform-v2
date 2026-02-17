import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { listPhotos, uploadPhoto } from '@/services/photoService';
import { z } from 'zod';

/**
 * GET /api/admin/photos
 * 
 * Lists photos with filtering and pagination
 * 
 * Query parameters:
 * - page_type: Filter by page type (event, activity, accommodation, memory)
 * - page_id: Filter by page ID
 * - moderation_status: Filter by moderation status (pending, approved, rejected)
 * - uploader_id: Filter by uploader ID
 * - limit: Number of photos per page (default: 50)
 * - offset: Offset for pagination (default: 0)
 */
export async function GET(request: Request) {
  try {
    // 1. Authenticate
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              cookieStore.set(name, value);
            });
          },
        },
      }
    );
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const pageType = searchParams.get('page_type');
    const moderationStatus = searchParams.get('moderation_status');
    const pageId = searchParams.get('page_id');
    const uploaderId = searchParams.get('uploader_id');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    
    // Build filters object, only including defined values
    // CRITICAL: Don't include undefined/null values - let Zod defaults handle them
    const filters: any = {};
    
    // Only add filters if they have actual values (not null, "null" string, or empty)
    if (pageType && pageType !== 'null' && pageType !== '') {
      filters.page_type = pageType;
    }
    if (pageId && pageId !== 'null' && pageId !== '') {
      filters.page_id = pageId;
    }
    if (moderationStatus && moderationStatus !== 'null' && moderationStatus !== '') {
      filters.moderation_status = moderationStatus;
    }
    if (uploaderId && uploaderId !== 'null' && uploaderId !== '') {
      filters.uploader_id = uploaderId;
    }
    if (limit && limit !== 'null' && limit !== '') {
      filters.limit = parseInt(limit, 10);
    }
    if (offset && offset !== 'null' && offset !== '') {
      filters.offset = parseInt(offset, 10);
    }

    // 3. Call service
    const result = await listPhotos(filters);

    // 4. Return response
    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
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

/**
 * POST /api/admin/photos
 * 
 * Upload a new photo
 * 
 * Form data:
 * - file: Image file (required)
 * - metadata: JSON string with photo metadata (required)
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              cookieStore.set(name, value);
            });
          },
        },
      }
    );
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const metadataStr = formData.get('metadata') as string;

    // Validate file presence
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'File is required',
          },
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF',
          },
        },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'File too large. Maximum size: 10MB',
          },
        },
        { status: 400 }
      );
    }

    // Validate metadata
    if (!metadataStr) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Metadata is required',
          },
        },
        { status: 400 }
      );
    }

    let metadata: any;
    try {
      metadata = JSON.parse(metadataStr);
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid metadata JSON',
          },
        },
        { status: 400 }
      );
    }

    // Validate metadata schema
    const metadataSchema = z.object({
      page_type: z.enum(['event', 'activity', 'accommodation', 'memory']),
      page_id: z.string().optional(),
      caption: z.string().optional(),
      alt_text: z.string().optional(),
    });

    const metadataValidation = metadataSchema.safeParse(metadata);
    if (!metadataValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid metadata',
            details: metadataValidation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    // 3. Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Call service to upload
    console.log('[Photo API] Calling uploadPhoto service with:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: buffer.length,
      metadata: {
        ...metadataValidation.data,
        uploader_id: session.user.id,
        moderation_status: 'approved',
      }
    });
    
    const result = await uploadPhoto(
      buffer,
      file.name,
      file.type,
      {
        ...metadataValidation.data,
        uploader_id: session.user.id,
        moderation_status: 'approved', // Auto-approve admin uploads
      }
    );

    console.log('[Photo API] Upload result:', result);

    // 5. Return response
    if (!result.success) {
      console.error('[Photo API] Upload failed:', result.error);
      const statusMap: Record<string, number> = {
        VALIDATION_ERROR: 400,
        STORAGE_UNAVAILABLE: 503,
        DATABASE_ERROR: 500,
        UNKNOWN_ERROR: 500,
      };
      return NextResponse.json(result, {
        status: statusMap[result.error.code] || 500,
      });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[Photo API] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
