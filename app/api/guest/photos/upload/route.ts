import { getAuthenticatedUser } from '@/lib/apiAuth';
import { NextResponse } from 'next/server';
import { sanitizeInput } from '@/utils/sanitization';

/**
 * POST /api/guest/photos/upload
 * 
 * Uploads a photo from a guest to the wedding gallery.
 * Photos are queued for moderation before appearing publicly.
 * 
 * Requirements: 13.9, 11.1, 11.11
 */
export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedUser();
    
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { user, supabase } = auth;
    
    // Get current guest
    const { data: currentGuest, error: currentGuestError } = await supabase
      .from('guests')
      .select('id')
      .eq('email', user.email)
      .single();
    
    if (currentGuestError || !currentGuest) {
      return NextResponse.json(
        { success: false, error: { code: 'GUEST_NOT_FOUND', message: 'Guest not found' } },
        { status: 404 }
      );
    }
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const caption = formData.get('caption') as string;
    const altText = formData.get('alt_text') as string;
    const pageType = formData.get('page_type') as string || 'memory';
    const pageId = formData.get('page_id') as string | null;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No file provided' } },
        { status: 400 }
      );
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'File must be an image' } },
        { status: 400 }
      );
    }
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'File size must be less than 10MB' } },
        { status: 400 }
      );
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${fileExt}`;
    const filePath = `photos/${fileName}`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('wedding-photos')
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600',
      });
    
    if (uploadError) {
      return NextResponse.json(
        { success: false, error: { code: 'STORAGE_ERROR', message: uploadError.message } },
        { status: 500 }
      );
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('wedding-photos')
      .getPublicUrl(filePath);
    
    // Create photo record in database
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .insert({
        uploader_id: user.id,
        photo_url: urlData.publicUrl,
        storage_type: 'supabase',
        page_type: pageType,
        page_id: pageId,
        caption: caption ? sanitizeInput(caption) : null,
        alt_text: altText ? sanitizeInput(altText) : null,
        moderation_status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (photoError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('wedding-photos').remove([filePath]);
      
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: photoError.message } },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: photo }, { status: 201 });
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
