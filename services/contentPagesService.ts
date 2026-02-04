import { sanitizeInput } from '../utils/sanitization';
import { generateSlug, isValidSlug, normalizeSlug } from '../utils/slugs';
import {
  createContentPageSchema,
  updateContentPageSchema,
  type CreateContentPageDTO,
  type UpdateContentPageDTO,
  type ContentPage,
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
 * Ensures slug is unique by appending a number if necessary
 * 
 * @param slug - Desired slug
 * @param excludeId - ID to exclude from uniqueness check (for updates)
 * @returns Unique slug
 */
async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
  const supabase = getSupabase();
  let uniqueSlug = slug;
  let counter = 2;

  while (true) {
    const query = supabase
      .from('content_pages')
      .select('id')
      .eq('slug', uniqueSlug);

    if (excludeId) {
      query.neq('id', excludeId);
    }

    const { data, error } = await query.single();

    if (error && error.code === 'PGRST116') {
      // No match found - slug is unique
      return uniqueSlug;
    }

    if (error) {
      // Other error - return original slug and let database handle it
      return uniqueSlug;
    }

    // Slug exists - try with counter
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
}

/**
 * Creates a new content page
 * 
 * @param data - Content page data including title, slug, and status
 * @returns Result containing the created content page or error details
 * 
 * @example
 * const result = await createContentPage({
 *   title: 'Our Story',
 *   slug: 'our-story',
 *   status: 'draft',
 * });
 */
export async function createContentPage(data: CreateContentPageDTO): Promise<Result<ContentPage>> {
  try {
    const supabase = getSupabase();

    // 1. Validate
    const validation = createContentPageSchema.safeParse(data);
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

    // 2. Sanitize
    const sanitized = {
      ...validation.data,
      title: sanitizeInput(validation.data.title),
      slug: validation.data.slug || generateSlug(validation.data.title),
    };

    // 2.1. Validate slug
    if (!isValidSlug(sanitized.slug)) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Title must contain at least one alphanumeric character to generate a valid slug',
          details: {
            field: validation.data.slug ? 'slug' : 'title',
            value: validation.data.slug || validation.data.title,
            reason: 'Generated slug is invalid or empty after normalization',
          },
        },
      };
    }

    // 3. Ensure unique slug
    sanitized.slug = await ensureUniqueSlug(sanitized.slug);

    // 4. Create content page
    const { data: contentPage, error } = await supabase
      .from('content_pages')
      .insert(sanitized)
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

    return { success: true, data: contentPage };
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
 * Gets a content page by ID
 * 
 * @param id - Content page ID
 * @returns Result containing the content page or error details
 */
export async function getContentPage(id: string): Promise<Result<ContentPage>> {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('content_pages')
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
      },
    };
  }
}

/**
 * Gets a content page by slug
 * 
 * @param slug - Content page slug
 * @returns Result containing the content page or error details
 */
export async function getContentPageBySlug(slug: string): Promise<Result<ContentPage>> {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('content_pages')
      .select('*')
      .eq('slug', slug)
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
      },
    };
  }
}

/**
 * Lists all content pages
 * 
 * @param filters - Optional filters for status
 * @returns Result containing array of content pages or error details
 */
export async function listContentPages(filters?: { status?: 'draft' | 'published' }): Promise<Result<ContentPage[]>> {
  try {
    const supabase = getSupabase();

    let query = supabase
      .from('content_pages')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

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
 * Updates a content page
 * 
 * @param id - Content page ID
 * @param data - Updated content page data
 * @returns Result containing the updated content page or error details
 */
export async function updateContentPage(id: string, data: UpdateContentPageDTO): Promise<Result<ContentPage>> {
  try {
    const supabase = getSupabase();

    // 1. Validate
    const validation = updateContentPageSchema.safeParse(data);
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

    // 2. Sanitize
    const sanitized: any = {};
    if (validation.data.title) {
      sanitized.title = sanitizeInput(validation.data.title);
    }
    if (validation.data.slug) {
      const normalizedSlug = normalizeSlug(validation.data.slug);
      
      // Validate slug
      if (!isValidSlug(normalizedSlug)) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Slug must contain at least one alphanumeric character',
            details: {
              field: 'slug',
              value: validation.data.slug,
              reason: 'Slug is invalid after normalization',
            },
          },
        };
      }
      
      sanitized.slug = await ensureUniqueSlug(normalizedSlug, id);
    }
    if (validation.data.status) {
      sanitized.status = validation.data.status;
    }

    // 3. Update content page
    const { data: contentPage, error } = await supabase
      .from('content_pages')
      .update(sanitized)
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

    return { success: true, data: contentPage };
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
 * Deletes a content page and all associated sections
 * 
 * @param id - Content page ID
 * @param options - Delete options (soft delete or permanent)
 * @returns Result indicating success or error details
 * 
 * @example
 * // Soft delete (default)
 * await deleteContentPage('page-id');
 * 
 * // Permanent delete
 * await deleteContentPage('page-id', { permanent: true });
 */
export async function deleteContentPage(
  id: string,
  options: { permanent?: boolean; deletedBy?: string } = {}
): Promise<Result<void>> {
  try {
    const supabase = getSupabase();
    const { permanent = false, deletedBy } = options;

    if (permanent) {
      // Permanent deletion - remove from database
      // Delete associated sections (cascade will delete columns)
      await supabase
        .from('sections')
        .delete()
        .eq('page_type', 'custom')
        .eq('page_id', id);

      // Delete content page
      const { error } = await supabase
        .from('content_pages')
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
    } else {
      // Soft delete - set deleted_at timestamp
      const now = new Date().toISOString();

      // Soft delete associated sections and columns
      const { data: sections } = await supabase
        .from('sections')
        .select('id')
        .eq('page_type', 'custom')
        .eq('page_id', id)
        .is('deleted_at', null);

      if (sections && sections.length > 0) {
        const sectionIds = sections.map((s: any) => s.id);

        // Soft delete columns
        await supabase
          .from('columns')
          .update({ deleted_at: now, deleted_by: deletedBy })
          .in('section_id', sectionIds)
          .is('deleted_at', null);

        // Soft delete sections
        await supabase
          .from('sections')
          .update({ deleted_at: now, deleted_by: deletedBy })
          .in('id', sectionIds)
          .is('deleted_at', null);
      }

      // Soft delete content page
      const { error } = await supabase
        .from('content_pages')
        .update({ deleted_at: now, deleted_by: deletedBy })
        .eq('id', id)
        .is('deleted_at', null);

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
 * Restores a soft-deleted content page and all associated sections
 * 
 * @param id - Content page ID
 * @returns Result indicating success or error details
 * 
 * @example
 * const result = await restoreContentPage('page-id');
 */
export async function restoreContentPage(id: string): Promise<Result<ContentPage>> {
  try {
    const supabase = getSupabase();

    // Restore associated sections and columns
    const { data: sections } = await supabase
      .from('sections')
      .select('id')
      .eq('page_type', 'custom')
      .eq('page_id', id)
      .not('deleted_at', 'is', null);

    if (sections && sections.length > 0) {
      const sectionIds = sections.map((s: any) => s.id);

      // Restore columns
      await supabase
        .from('columns')
        .update({ deleted_at: null, deleted_by: null })
        .in('section_id', sectionIds);

      // Restore sections
      await supabase
        .from('sections')
        .update({ deleted_at: null, deleted_by: null })
        .in('id', sectionIds);
    }

    // Restore content page
    const { data, error } = await supabase
      .from('content_pages')
      .update({ deleted_at: null, deleted_by: null })
      .eq('id', id)
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
