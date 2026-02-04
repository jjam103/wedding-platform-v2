import {
  systemSettingsSchema,
  updateSystemSettingsSchema,
  homePageConfigSchema,
  type SystemSettings,
  type UpdateSystemSettingsDTO,
  type HomePageConfig,
} from '../schemas/settingsSchemas';

type Result<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: any } };

interface SettingRow {
  id: string;
  key: string;
  value: any;
  description: string | null;
  category: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

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
 * Gets a single setting by key
 * 
 * @param key - Setting key
 * @returns Result containing the setting value or error details
 */
export async function getSetting(key: string): Promise<Result<any>> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Setting '${key}' not found`,
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

    return { success: true, data: data.value };
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
 * Gets all system settings
 * 
 * @returns Result containing all settings or error details
 * 
 * @example
 * const result = await settingsService.getSettings();
 * if (result.success) {
 *   console.log(result.data);
 * }
 */
export async function getSettings(): Promise<Result<SettingRow[]>> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('category', { ascending: true })
      .order('key', { ascending: true });

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

    return { success: true, data: data || [] };
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
 * Gets settings by category
 * 
 * @param category - Setting category
 * @returns Result containing settings in the category or error details
 */
export async function getSettingsByCategory(category: string): Promise<Result<SettingRow[]>> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('category', category)
      .order('key', { ascending: true });

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

    return { success: true, data: data || [] };
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
 * Updates a single setting
 * 
 * @param key - Setting key
 * @param value - New value (will be stored as JSONB)
 * @returns Result containing the updated setting or error details
 * 
 * @example
 * const result = await settingsService.updateSetting('wedding_date', '2024-06-15');
 */
export async function updateSetting(key: string, value: any): Promise<Result<SettingRow>> {
  try {
    const supabase = getSupabase();
    
    // Check if setting exists
    const { data: existing } = await supabase
      .from('system_settings')
      .select('id')
      .eq('key', key)
      .single();

    let result;
    if (existing) {
      // Update existing setting
      const { data: updated, error } = await supabase
        .from('system_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key)
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
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Setting '${key}' not found`,
        },
      };
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

/**
 * Creates a new setting
 * 
 * @param key - Setting key (must be unique)
 * @param value - Setting value (will be stored as JSONB)
 * @param description - Optional description
 * @param category - Setting category (default: 'general')
 * @param isPublic - Whether the setting is publicly readable (default: false)
 * @returns Result containing the created setting or error details
 */
export async function createSetting(
  key: string,
  value: any,
  description?: string,
  category: string = 'general',
  isPublic: boolean = false
): Promise<Result<SettingRow>> {
  try {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('system_settings')
      .insert({
        key,
        value,
        description,
        category,
        is_public: isPublic,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        return {
          success: false,
          error: {
            code: 'CONFLICT',
            message: `Setting '${key}' already exists`,
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
 * Deletes a setting
 * 
 * @param key - Setting key
 * @returns Result indicating success or error details
 */
export async function deleteSetting(key: string): Promise<Result<void>> {
  try {
    const supabase = getSupabase();
    
    const { error } = await supabase
      .from('system_settings')
      .delete()
      .eq('key', key);

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
 * Upserts (creates or updates) a single setting
 * Handles both create and update in a single operation
 * 
 * @param key - Setting key
 * @param value - Setting value (will be stored as JSONB)
 * @param description - Optional description (used only on create)
 * @param category - Setting category (default: 'general', used only on create)
 * @param isPublic - Whether the setting is publicly readable (default: false, used only on create)
 * @returns Result containing the upserted setting or error details
 */
export async function upsertSetting(
  key: string,
  value: any,
  description?: string,
  category: string = 'general',
  isPublic: boolean = false
): Promise<Result<SettingRow>> {
  try {
    const supabase = getSupabase();
    
    // Use Supabase upsert with conflict resolution on key
    const { data, error } = await supabase
      .from('system_settings')
      .upsert(
        {
          key,
          value,
          description,
          category,
          is_public: isPublic,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'key',
          ignoreDuplicates: false,
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
 * Upserts home page configuration
 * Handles both create and update in a single operation for all home page settings
 * 
 * @param config - Home page configuration object
 * @returns Result containing the updated configuration or error details
 * 
 * @example
 * const result = await settingsService.upsertHomePageConfig({
 *   title: 'Welcome to Our Wedding',
 *   subtitle: 'Join us in Costa Rica',
 *   welcomeMessage: '<p>We are excited to celebrate with you!</p>',
 *   heroImageUrl: 'https://example.com/hero.jpg',
 * });
 */
export async function upsertHomePageConfig(
  config: HomePageConfig
): Promise<Result<HomePageConfig>> {
  try {
    // Validate input
    const validation = homePageConfigSchema.safeParse(config);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid home page configuration',
          details: validation.error.issues,
        },
      };
    }

    const validatedConfig = validation.data;
    const updates: Promise<Result<SettingRow>>[] = [];

    // Upsert each setting individually
    if (validatedConfig.title !== undefined) {
      updates.push(
        upsertSetting(
          'home_page_title',
          validatedConfig.title,
          'Home page title',
          'home_page',
          true
        )
      );
    }

    if (validatedConfig.subtitle !== undefined) {
      updates.push(
        upsertSetting(
          'home_page_subtitle',
          validatedConfig.subtitle,
          'Home page subtitle',
          'home_page',
          true
        )
      );
    }

    if (validatedConfig.welcomeMessage !== undefined) {
      updates.push(
        upsertSetting(
          'home_page_welcome_message',
          validatedConfig.welcomeMessage,
          'Home page welcome message',
          'home_page',
          true
        )
      );
    }

    if (validatedConfig.heroImageUrl !== undefined) {
      updates.push(
        upsertSetting(
          'home_page_hero_image_url',
          validatedConfig.heroImageUrl,
          'Home page hero image URL',
          'home_page',
          true
        )
      );
    }

    // Execute all upserts
    const results = await Promise.all(updates);

    // Check if any upserts failed
    const failures = results.filter((r) => !r.success);
    if (failures.length > 0) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update some home page settings',
          details: failures.map((f) => f.error),
        },
      };
    }

    // Return the validated config
    return { success: true, data: validatedConfig };
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
 * Gets the default authentication method for new guests
 * 
 * @returns Result containing the default auth method or error details
 * 
 * @example
 * const result = await settingsService.getDefaultAuthMethod();
 * if (result.success) {
 *   console.log('Default auth method:', result.data);
 * }
 */
export async function getDefaultAuthMethod(): Promise<Result<'email_matching' | 'magic_link'>> {
  try {
    const result = await getSetting('default_auth_method');
    
    if (!result.success) {
      // If setting doesn't exist, return default value
      if (result.error.code === 'NOT_FOUND') {
        return { success: true, data: 'email_matching' };
      }
      return result;
    }

    // Validate the value
    const value = result.data;
    if (value !== 'email_matching' && value !== 'magic_link') {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Invalid auth method value: ${value}`,
        },
      };
    }

    return { success: true, data: value };
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
 * Updates the default authentication method for new guests
 * Optionally updates all existing guests to use the new method
 * 
 * @param method - The authentication method to set as default
 * @param updateExistingGuests - Whether to update all existing guests (default: false)
 * @returns Result containing the number of updated guests or error details
 * 
 * @example
 * // Update default only
 * const result = await settingsService.updateDefaultAuthMethod('magic_link', false);
 * 
 * // Update default and all existing guests
 * const result = await settingsService.updateDefaultAuthMethod('magic_link', true);
 * if (result.success) {
 *   console.log(`Updated ${result.data.updatedGuestsCount} guests`);
 * }
 */
export async function updateDefaultAuthMethod(
  method: 'email_matching' | 'magic_link',
  updateExistingGuests: boolean = false
): Promise<Result<{ updatedGuestsCount: number }>> {
  try {
    const supabase = getSupabase();

    // Validate method
    if (method !== 'email_matching' && method !== 'magic_link') {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Invalid auth method: ${method}`,
        },
      };
    }

    // Update the default_auth_method setting
    const settingResult = await upsertSetting(
      'default_auth_method',
      method,
      'Default authentication method for new guests',
      'authentication',
      false
    );

    if (!settingResult.success) {
      return {
        success: false,
        error: settingResult.error,
      };
    }

    let updatedGuestsCount = 0;

    // If requested, update all existing guests
    if (updateExistingGuests) {
      const { data, error } = await supabase
        .from('guests')
        .update({ auth_method: method })
        .neq('auth_method', method) // Only update guests with different auth method
        .select('id');

      if (error) {
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update existing guests',
            details: error,
          },
        };
      }

      updatedGuestsCount = data?.length || 0;
    }

    return {
      success: true,
      data: { updatedGuestsCount },
    };
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
