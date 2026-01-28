import {
  systemSettingsSchema,
  updateSystemSettingsSchema,
  type SystemSettings,
  type UpdateSystemSettingsDTO,
} from '../schemas/settingsSchemas';

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
 * Gets system settings
 * 
 * @returns Result containing system settings or error details
 * 
 * @example
 * const result = await settingsService.getSettings();
 * if (result.success) {
 *   console.log(result.data.wedding_date);
 * }
 */
export async function getSettings(): Promise<Result<SystemSettings>> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, return default settings
        return {
          success: true,
          data: {
            id: '',
            wedding_date: null,
            venue_name: null,
            couple_name_1: null,
            couple_name_2: null,
            timezone: 'America/Costa_Rica',
            send_rsvp_confirmations: true,
            send_activity_reminders: true,
            send_deadline_reminders: true,
            reminder_days_before: 7,
            require_photo_moderation: true,
            max_photos_per_guest: 20,
            allowed_photo_formats: ['jpg', 'jpeg', 'png', 'heic'],
            home_page_title: null,
            home_page_subtitle: null,
            home_page_welcome_message: null,
            home_page_hero_image_url: null,
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
 * Updates system settings
 * 
 * @param data - Settings data to update
 * @returns Result containing the updated settings or error details
 * 
 * @example
 * const result = await settingsService.updateSettings({
 *   wedding_date: '2024-06-15T00:00:00Z',
 *   venue_name: 'Dreams Las Mareas',
 *   couple_name_1: 'John',
 *   couple_name_2: 'Jane',
 * });
 */
export async function updateSettings(data: UpdateSystemSettingsDTO): Promise<Result<SystemSettings>> {
  try {
    // 1. Validate
    const validation = updateSystemSettingsSchema.safeParse(data);
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

    // 2. Check if settings exist
    const supabase = getSupabase();
    const { data: existing } = await supabase
      .from('system_settings')
      .select('id')
      .single();

    let result;
    if (existing) {
      // Update existing settings
      const { data: updated, error } = await supabase
        .from('system_settings')
        .update(validation.data)
        .eq('id', existing.id)
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

      result = updated;
    } else {
      // Create new settings
      const { data: created, error } = await supabase
        .from('system_settings')
        .insert(validation.data)
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

      result = created;
    }

    return { success: true, data: result };
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
