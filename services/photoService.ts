import { createClient } from '@supabase/supabase-js';
import { sanitizeInput, sanitizeRichText } from "../utils/sanitization";
import {
  createPhotoSchema,
  updatePhotoSchema,
  moderatePhotoSchema,
  batchUploadSchema,
  photoFilterSchema,
  type CreatePhotoDTO,
  type UpdatePhotoDTO,
  type ModeratePhotoDTO,
  type BatchUploadDTO,
  type PhotoFilterDTO,
} from '../schemas/photoSchemas';
import { uploadToB2, isB2Healthy } from './b2Service';

type Result<T> = 
  | { success: true; data: T } 
  | { success: false; error: { code: string; message: string; details?: any } };

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Photo {
  id: string;
  uploader_id: string;
  photo_url: string;
  storage_type: 'b2' | 'supabase';
  page_type: 'event' | 'activity' | 'accommodation' | 'memory';
  page_id?: string;
  caption?: string;
  alt_text?: string;
  moderation_status: 'pending' | 'approved' | 'rejected';
  moderation_reason?: string;
  display_order?: number;
  created_at: string;
  moderated_at?: string;
  updated_at: string;
}

// Lazy load supabase to avoid initialization issues
let _supabase: any = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabase;
}

/**
 * Uploads a photo with automatic storage selection and failover.
 * Tries B2 first, falls back to Supabase Storage if B2 is unavailable.
 * 
 * @param file - File buffer to upload
 * @param fileName - Original filename
 * @param contentType - MIME type
 * @param metadata - Photo metadata (uploader, page info, caption, etc.)
 * @returns Result containing the created photo record
 * 
 * @example
 * const result = await uploadPhoto(
 *   fileBuffer,
 *   'wedding-photo.jpg',
 *   'image/jpeg',
 *   {
 *     uploader_id: 'user-123',
 *     page_type: 'memory',
 *     caption: 'Beautiful sunset ceremony'
 *   }
 * );
 */
export async function uploadPhoto(
  file: Buffer,
  fileName: string,
  contentType: string,
  metadata: Omit<CreatePhotoDTO, 'photo_url' | 'storage_type'>
): Promise<Result<Photo>> {
  try {
    // 1. Validate metadata
    const metadataValidation = createPhotoSchema.omit({ photo_url: true, storage_type: true }).safeParse(metadata);
    if (!metadataValidation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid photo metadata',
          details: metadataValidation.error.issues,
        },
      };
    }

    // 2. Sanitize text fields
    const sanitizedMetadata = {
      ...metadataValidation.data,
      caption: metadataValidation.data.caption
        ? sanitizeInput(metadataValidation.data.caption)
        : undefined,
      alt_text: metadataValidation.data.alt_text
        ? sanitizeInput(metadataValidation.data.alt_text)
        : undefined,
    };

    // 3. Check B2 health and attempt upload
    const b2HealthResult = await isB2Healthy();
    let photoUrl: string;
    let storageType: 'b2' | 'supabase';

    if (b2HealthResult.success && b2HealthResult.data) {
      // Try B2 upload
      const b2Result = await uploadToB2(file, fileName, contentType);
      if (b2Result.success) {
        photoUrl = b2Result.data.url;
        storageType = 'b2';
      } else {
        // B2 failed, fallback to Supabase
        const supabaseResult = await uploadToSupabaseStorage(file, fileName, contentType);
        if (!supabaseResult.success) {
          return supabaseResult;
        }
        photoUrl = supabaseResult.data.url;
        storageType = 'supabase';
      }
    } else {
      // B2 unhealthy, use Supabase directly
      const supabaseResult = await uploadToSupabaseStorage(file, fileName, contentType);
      if (!supabaseResult.success) {
        return supabaseResult;
      }
      photoUrl = supabaseResult.data.url;
      storageType = 'supabase';
    }

    // 4. Create photo record in database
    const photoData: CreatePhotoDTO = {
      ...sanitizedMetadata,
      photo_url: photoUrl,
      storage_type: storageType,
    };

    const { data, error } = await supabase
      .from('photos')
      .insert(photoData)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: error.message,
          details: error,
        },
      };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error during photo upload',
        details: error,
      },
    };
  }
}

/**
 * Uploads a file to Supabase Storage as fallback.
 * 
 * @param file - File buffer
 * @param fileName - Original filename
 * @param contentType - MIME type
 * @returns Result containing the storage URL
 */
async function uploadToSupabaseStorage(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<Result<{ url: string; key: string }>> {
  try {
    // Sanitize filename
    const sanitizedFileName = sanitizeInput(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');

    const timestamp = Date.now();
    const key = `photos/${timestamp}-${sanitizedFileName}`;

    const { data, error } = await getSupabase().storage
      .from('photos')
      .upload(key, file, {
        contentType,
        cacheControl: '31536000', // 1 year
      });

    if (error) {
      return {
        success: false,
        error: {
          code: 'STORAGE_ERROR',
          message: error.message,
          details: error,
        },
      };
    }

    // Get public URL
    const { data: urlData } = getSupabase().storage
      .from('photos')
      .getPublicUrl(data.path);

    return {
      success: true,
      data: {
        url: urlData.publicUrl,
        key: data.path,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'STORAGE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to upload to Supabase Storage',
        details: error,
      },
    };
  }
}

/**
 * Uploads multiple photos in batch.
 * 
 * @param uploads - Array of photo uploads with file data and metadata
 * @returns Result containing array of created photo records
 */
export async function batchUploadPhotos(
  uploads: Array<{
    file: Buffer;
    fileName: string;
    contentType: string;
    metadata: Omit<CreatePhotoDTO, 'photo_url' | 'storage_type'>;
  }>
): Promise<Result<Photo[]>> {
  try {
    if (uploads.length === 0) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No photos provided for batch upload',
        },
      };
    }

    if (uploads.length > 50) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Batch upload limited to 50 photos at a time',
        },
      };
    }

    const results: Photo[] = [];
    const errors: any[] = [];

    for (const upload of uploads) {
      const result = await uploadPhoto(
        upload.file,
        upload.fileName,
        upload.contentType,
        upload.metadata
      );

      if (result.success) {
        results.push(result.data);
      } else {
        errors.push({
          fileName: upload.fileName,
          error: result.error,
        });
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: {
          code: 'BATCH_UPLOAD_PARTIAL_FAILURE',
          message: `${errors.length} of ${uploads.length} photos failed to upload`,
          details: { successful: results.length, failed: errors.length, errors },
        },
      };
    }

    return { success: true, data: results };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error during batch upload',
        details: error,
      },
    };
  }
}

/**
 * Gets a photo by ID.
 * 
 * @param id - Photo ID
 * @returns Result containing the photo record
 */
export async function getPhoto(id: string): Promise<Result<Photo>> {
  try {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return {
        success: false,
        error: {
          code: error.code === 'PGRST116' ? 'NOT_FOUND' : 'DATABASE_ERROR',
          message: error.message,
          details: error,
        },
      };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      },
    };
  }
}

/**
 * Lists photos with filtering and pagination.
 * 
 * @param filters - Filter criteria (page type, moderation status, etc.)
 * @returns Result containing array of photos and total count
 */
export async function listPhotos(
  filters: PhotoFilterDTO
): Promise<Result<{ photos: Photo[]; total: number }>> {
  try {
    // Validate filters
    const validation = photoFilterSchema.safeParse(filters);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid filter parameters',
          details: validation.error.issues,
        },
      };
    }

    const { page_type, page_id, moderation_status, uploader_id, limit, offset } = validation.data;

    let query = supabase.from('photos').select('*', { count: 'exact' });

    if (page_type) {
      query = query.eq('page_type', page_type);
    }
    if (page_id) {
      query = query.eq('page_id', page_id);
    }
    if (moderation_status) {
      query = query.eq('moderation_status', moderation_status);
    }
    if (uploader_id) {
      query = query.eq('uploader_id', uploader_id);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: error.message,
          details: error,
        },
      };
    }

    return {
      success: true,
      data: {
        photos: data || [],
        total: count || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      },
    };
  }
}

/**
 * Moderates a photo (approve or reject).
 * 
 * @param id - Photo ID
 * @param moderation - Moderation decision and optional reason
 * @returns Result containing the updated photo
 */
export async function moderatePhoto(
  id: string,
  moderation: ModeratePhotoDTO
): Promise<Result<Photo>> {
  try {
    // Validate moderation data
    const validation = moderatePhotoSchema.safeParse(moderation);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid moderation data',
          details: validation.error.issues,
        },
      };
    }

    // Sanitize moderation reason
    const sanitizedReason = validation.data.moderation_reason
      ? sanitizeInput(validation.data.moderation_reason)
      : undefined;

    const { data, error } = await supabase
      .from('photos')
      .update({
        moderation_status: validation.data.moderation_status,
        moderation_reason: sanitizedReason,
        moderated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: {
          code: error.code === 'PGRST116' ? 'NOT_FOUND' : 'DATABASE_ERROR',
          message: error.message,
          details: error,
        },
      };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      },
    };
  }
}

/**
 * Updates photo metadata (caption, alt text, display order).
 * 
 * @param id - Photo ID
 * @param updates - Fields to update
 * @returns Result containing the updated photo
 */
export async function updatePhoto(
  id: string,
  updates: UpdatePhotoDTO
): Promise<Result<Photo>> {
  try {
    // Validate updates
    const validation = updatePhotoSchema.safeParse(updates);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid update data',
          details: validation.error.issues,
        },
      };
    }

    // Sanitize text fields
    const sanitizedUpdates = {
      ...validation.data,
      caption: validation.data.caption
        ? sanitizeInput(validation.data.caption)
        : undefined,
      alt_text: validation.data.alt_text
        ? sanitizeInput(validation.data.alt_text)
        : undefined,
    };

    const { data, error } = await supabase
      .from('photos')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: {
          code: error.code === 'PGRST116' ? 'NOT_FOUND' : 'DATABASE_ERROR',
          message: error.message,
          details: error,
        },
      };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      },
    };
  }
}

/**
 * Deletes a photo.
 * 
 * @param id - Photo ID
 * @returns Result indicating success or failure
 */
export async function deletePhoto(id: string): Promise<Result<void>> {
  try {
    const { error } = await supabase
      .from('photos')
      .delete()
      .eq('id', id);

    if (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: error.message,
          details: error,
        },
      };
    }

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      },
    };
  }
}

/**
 * Gets photos pending moderation.
 * 
 * @param limit - Maximum number of photos to return
 * @returns Result containing array of pending photos
 */
export async function getPendingPhotos(limit: number = 50): Promise<Result<Photo[]>> {
  return listPhotos({
    moderation_status: 'pending',
    limit,
    offset: 0,
  }).then(result => {
    if (result.success) {
      return { success: true, data: result.data.photos };
    }
    return result;
  });
}
