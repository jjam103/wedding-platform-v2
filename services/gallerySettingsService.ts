import {
  createGallerySettingsSchema,
  updateGallerySettingsSchema,
  type CreateGallerySettingsDTO,
  type UpdateGallerySettingsDTO,
  type GallerySettings,
} from '../schemas/cmsSchemas';

type Result<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: any } };

// Lazy load supabase to avoid initialization issues in tests
let _supabase: any = null;
function getSupabase() {
  if (!_supabase) {
    const { supabase } = require('../lib/supabase');
    _supabase = supabase;
  }
  return _supabase;
}

/**
 * Gets gallery settings for a page
 * 
 * @param pageType - Type of page (activity, event, accommodation, room_type, custom, memory)
 * @param pageId - Page ID
 * @returns Result containing gallery settings or error details
 */
export async function getSettings(pageType: string, pageId: string): Promise<Result<GallerySettings>> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('gallery_settings')
      .select('*')
      .eq('page_type', pageType)
      .eq('page_id', pageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, return default settings
        return {
          success: true,
          data: {
            id: '',
            page_type: pageType as any,
            page_id: pageId,
            display_mode: 'gallery',
            show_captions: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        };
      }

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
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Creates or updates gallery settings for a page
 * 
 * @param data - Gallery settings data
 * @returns Result containing the created/updated settings or error details
 */
export async function upsertSettings(data: CreateGallerySettingsDTO): Promise<Result<GallerySettings>> {
  try {
    // 1. Validate
    const validation = createGallerySettingsSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: validation.error.issues,
        },
      };
    }

    // 2. Upsert settings
    const supabase = getSupabase();
    const { data: settings, error } = await supabase
      .from('gallery_settings')
      .upsert(
        {
          page_type: validation.data.page_type,
          page_id: validation.data.page_id,
          display_mode: validation.data.display_mode,
          photos_per_row: validation.data.photos_per_row,
          show_captions: validation.data.show_captions,
          autoplay_interval: validation.data.autoplay_interval,
          transition_effect: validation.data.transition_effect,
        },
        {
          onConflict: 'page_type,page_id',
        }
      )
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

    return { success: true, data: settings };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Updates display mode for a gallery
 * 
 * @param pageId - Page ID
 * @param mode - Display mode (gallery, carousel, loop)
 * @returns Result indicating success or error details
 */
export async function updateDisplayMode(
  pageId: string,
  mode: 'gallery' | 'carousel' | 'loop'
): Promise<Result<void>> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('gallery_settings')
      .update({ display_mode: mode })
      .eq('page_id', pageId);

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
      },
    };
  }
}

/**
 * Updates photo ordering for a gallery
 * 
 * @param pageId - Page ID
 * @param photoIds - Array of photo IDs in desired order
 * @returns Result indicating success or error details
 */
export async function updatePhotoOrder(pageId: string, photoIds: string[]): Promise<Result<void>> {
  try {
    const supabase = getSupabase();
    // Update display_order for each photo
    const updates = photoIds.map((photoId, index) =>
      supabase
        .from('photos')
        .update({ display_order: index })
        .eq('id', photoId)
        .eq('page_id', pageId)
    );

    const results = await Promise.all(updates);
    const errors = results.filter(r => r.error);

    if (errors.length > 0) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update photo order',
          details: errors,
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
      },
    };
  }
}

/**
 * Configures gallery options
 * 
 * @param pageId - Page ID
 * @param options - Gallery configuration options
 * @returns Result indicating success or error details
 */
export async function configureGallery(
  pageId: string,
  options: {
    photos_per_row?: number;
    show_captions?: boolean;
    autoplay_interval?: number;
    transition_effect?: string;
  }
): Promise<Result<void>> {
  try {
    // Validate options
    const validation = updateGallerySettingsSchema.safeParse(options);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: validation.error.issues,
        },
      };
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from('gallery_settings')
      .update(validation.data)
      .eq('page_id', pageId);

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
      },
    };
  }
}

/**
 * Deletes gallery settings for a page
 * 
 * @param pageId - Page ID
 * @returns Result indicating success or error details
 */
export async function deleteSettings(pageId: string): Promise<Result<void>> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('gallery_settings')
      .delete()
      .eq('page_id', pageId);

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
      },
    };
  }
}
