import { sanitizeInput, sanitizeRichText } from "../utils/sanitization";
import {
  createSectionSchema,
  updateSectionSchema,
  type CreateSectionDTO,
  type UpdateSectionDTO,
  type Section,
  type Column,
  type Reference,
  type ValidationResult,
  type ContentVersion,
  type RichTextContent,
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
 * Sanitizes column content data based on content type
 */
function sanitizeColumnContent(contentType: string, contentData: any): any {
  if (contentType === 'rich_text') {
    return {
      html: sanitizeRichText(contentData.html || ''),
    };
  }
  return contentData;
}

/**
 * Creates a new section with columns
 * 
 * @param data - Section data including page type, page ID, display order, and columns
 * @returns Result containing the created section with columns or error details
 */
export async function createSection(data: CreateSectionDTO): Promise<Result<Section & { columns: Column[] }>> {
  try {
    const supabase = getSupabase();
    
    // 1. Validate
    const validation = createSectionSchema.safeParse(data);
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

    // 2. Sanitize column content
    const sanitizedColumns = validation.data.columns.map(col => ({
      ...col,
      content_data: sanitizeColumnContent(col.content_type, col.content_data),
    }));

    // 3. Create section
    const { data: section, error: sectionError } = await supabase
      .from('sections')
      .insert({
        page_type: validation.data.page_type,
        page_id: validation.data.page_id,
        display_order: validation.data.display_order,
      })
      .select()
      .single();

    if (sectionError) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: sectionError.message,
          details: sectionError,
        },
      };
    }

    // 4. Create columns
    const columnsToInsert = sanitizedColumns.map(col => ({
      section_id: section.id,
      column_number: col.column_number,
      content_type: col.content_type,
      content_data: col.content_data,
    }));

    const { data: columns, error: columnsError } = await supabase
      .from('columns')
      .insert(columnsToInsert)
      .select();

    if (columnsError) {
      // Rollback: delete the section
      await getSupabase().from('sections').delete().eq('id', section.id);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: columnsError.message,
          details: columnsError,
        },
      };
    }

    return {
      success: true,
      data: {
        ...section,
        columns: columns || [],
      },
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

/**
 * Gets a section by ID with its columns
 * 
 * @param id - Section ID
 * @returns Result containing the section with columns or error details
 */
export async function getSection(id: string): Promise<Result<Section & { columns: Column[] }>> {
  try {
    const supabase = getSupabase();
    
    const { data: section, error: sectionError } = await supabase
      .from('sections')
      .select('*')
      .eq('id', id)
      .single();

    if (sectionError) {
      return {
        success: false,
        error: {
          code: sectionError.code === 'PGRST116' ? 'NOT_FOUND' : 'DATABASE_ERROR',
          message: sectionError.message,
          details: sectionError,
        },
      };
    }

    const { data: columns, error: columnsError } = await supabase
      .from('columns')
      .select('*')
      .eq('section_id', id)
      .order('column_number', { ascending: true });

    if (columnsError) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: columnsError.message,
          details: columnsError,
        },
      };
    }

    return {
      success: true,
      data: {
        ...section,
        columns: columns || [],
      },
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

/**
 * Updates a section and optionally its columns
 * 
 * @param id - Section ID
 * @param data - Updated section data
 * @returns Result containing the updated section with columns or error details
 */
export async function updateSection(id: string, data: UpdateSectionDTO): Promise<Result<Section & { columns: Column[] }>> {
  try {
    const supabase = getSupabase();
    
    // 1. Validate
    const validation = updateSectionSchema.safeParse(data);
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

    // 2. Check for circular references if updating columns with references
    if (validation.data.columns) {
      // Get the section's page_id and page_type
      const { data: section, error: sectionError } = await supabase
        .from('sections')
        .select('page_id, page_type')
        .eq('id', id)
        .single();
      
      if (sectionError || !section) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Section not found',
            details: sectionError,
          },
        };
      }

      // Check each column for references
      for (const column of validation.data.columns) {
        if (column.content_type === 'references' && column.content_data?.references) {
          const circularCheck = await detectCircularReferences(
            section.page_id,
            column.content_data.references
          );
          
          if (!circularCheck.success) {
            return {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Failed to validate references',
                details: circularCheck.error,
              },
            };
          }
          
          if (circularCheck.data === true) {
            return {
              success: false,
              error: {
                code: 'CIRCULAR_REFERENCE',
                message: 'This would create a circular reference. A page cannot reference itself directly or indirectly.',
              },
            };
          }
        }
      }
    }

    // 3. Update section if there are section-level changes
    const sectionUpdates: any = {};
    if (validation.data.page_type) sectionUpdates.page_type = validation.data.page_type;
    if (validation.data.page_id) sectionUpdates.page_id = validation.data.page_id;
    if (validation.data.display_order !== undefined) sectionUpdates.display_order = validation.data.display_order;

    if (Object.keys(sectionUpdates).length > 0) {
      const { error: updateError } = await supabase
        .from('sections')
        .update(sectionUpdates)
        .eq('id', id);

      if (updateError) {
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: updateError.message,
            details: updateError,
          },
        };
      }
    }

    // 4. Update columns if provided
    if (validation.data.columns) {
      // Delete existing columns
      const { error: deleteError } = await supabase
        .from('columns')
        .delete()
        .eq('section_id', id);

      if (deleteError) {
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: deleteError.message,
            details: deleteError,
          },
        };
      }

      // Sanitize and insert new columns
      const sanitizedColumns = validation.data.columns.map(col => ({
        ...col,
        content_data: sanitizeColumnContent(col.content_type, col.content_data),
      }));

      const columnsToInsert = sanitizedColumns.map(col => ({
        section_id: id,
        column_number: col.column_number,
        content_type: col.content_type,
        content_data: col.content_data,
      }));

      const { error: insertError } = await supabase
        .from('columns')
        .insert(columnsToInsert);

      if (insertError) {
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: insertError.message,
            details: insertError,
          },
        };
      }
    }

    // 4. Return updated section with columns
    return getSection(id);
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
 * Deletes a section and its columns
 * 
 * @param id - Section ID
 * @returns Result indicating success or error details
 */
export async function deleteSection(id: string): Promise<Result<void>> {
  try {
    const supabase = getSupabase();
    
    const { error } = await supabase
      .from('sections')
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
      },
    };
  }
}

/**
 * Lists all sections for a given page
 * 
 * @param pageType - Type of page (activity, event, accommodation, room_type, custom)
 * @param pageId - Page ID
 * @returns Result containing array of sections with columns or error details
 */
export async function listSections(pageType: string, pageId: string): Promise<Result<Array<Section & { columns: Column[] }>>> {
  try {
    const supabase = getSupabase();
    
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('*')
      .eq('page_type', pageType)
      .eq('page_id', pageId)
      .order('display_order', { ascending: true });

    if (sectionsError) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: sectionsError.message,
          details: sectionsError,
        },
      };
    }

    if (!sections || sections.length === 0) {
      return { success: true, data: [] };
    }

    // Fetch columns for all sections
    const sectionIds = sections.map((s: any) => s.id);
    const { data: columns, error: columnsError } = await supabase
      .from('columns')
      .select('*')
      .in('section_id', sectionIds)
      .order('column_number', { ascending: true });

    if (columnsError) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: columnsError.message,
          details: columnsError,
        },
      };
    }

    // Group columns by section
    const columnsBySection = (columns || []).reduce((acc: any, col: any) => {
      if (!acc[col.section_id]) acc[col.section_id] = [];
      acc[col.section_id].push(col);
      return acc;
    }, {} as Record<string, Column[]>);

    const sectionsWithColumns = sections.map((section: any) => ({
      ...section,
      columns: columnsBySection[section.id] || [],
    }));

    return { success: true, data: sectionsWithColumns };
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
 * Reorders sections for a page
 * 
 * @param pageId - Page ID
 * @param sectionIds - Array of section IDs in desired order
 * @returns Result indicating success or error details
 */
export async function reorderSections(pageId: string, sectionIds: string[]): Promise<Result<void>> {
  try {
    const supabase = getSupabase();
    
    // Update display_order for each section
    const updates = sectionIds.map((sectionId, index) =>
      supabase
        .from('sections')
        .update({ display_order: index })
        .eq('id', sectionId)
        .eq('page_id', pageId)
    );

    const results = await Promise.all(updates);
    const errors = results.filter(r => r.error);

    if (errors.length > 0) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to reorder sections',
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
 * Validates references in section content
 * 
 * @param references - Array of references to validate
 * @returns Result containing validation result with broken references
 */
export async function validateReferences(references: Reference[]): Promise<Result<ValidationResult>> {
  try {
    const supabase = getSupabase();
    const brokenReferences: Reference[] = [];

    for (const ref of references) {
      let exists = false;

      switch (ref.type) {
        case 'activity': {
          const { data } = await supabase
            .from('activities')
            .select('id')
            .eq('id', ref.id)
            .is('deleted_at', null)
            .single();
          exists = !!data;
          break;
        }
        case 'event': {
          const { data } = await supabase
            .from('events')
            .select('id')
            .eq('id', ref.id)
            .is('deleted_at', null)
            .single();
          exists = !!data;
          break;
        }
        case 'accommodation': {
          const { data } = await supabase
            .from('accommodations')
            .select('id')
            .eq('id', ref.id)
            .is('deleted_at', null)
            .single();
          exists = !!data;
          break;
        }
        case 'content_page': {
          const { data } = await supabase
            .from('content_pages')
            .select('id')
            .eq('id', ref.id)
            .is('deleted_at', null)
            .single();
          exists = !!data;
          break;
        }
        case 'location': {
          const { data } = await supabase
            .from('locations')
            .select('id')
            .eq('id', ref.id)
            .single();
          exists = !!data;
          break;
        }
      }

      if (!exists) {
        brokenReferences.push(ref);
      }
    }

    return {
      success: true,
      data: {
        valid: brokenReferences.length === 0,
        brokenReferences,
        circularReferences: [],
      },
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

/**
 * Detects circular references in page content
 * 
 * @param pageId - Page ID to check
 * @param references - New references to add
 * @returns Result indicating if circular references exist
 */
export async function detectCircularReferences(pageId: string, references: Reference[]): Promise<Result<boolean>> {
  try {
    const supabase = getSupabase();
    
    // Map reference types to section page_types
    // content_page references use page_type='custom' in sections table
    function getPageTypeForSections(refType: string): string {
      if (refType === 'content_page') {
        return 'custom';
      }
      return refType;
    }
    
    // Build a graph of references
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const startingPageId = pageId;

    async function hasCircle(currentPageId: string, currentRefType: string): Promise<boolean> {
      const nodeKey = `${currentRefType}:${currentPageId}`;
      
      if (recursionStack.has(nodeKey)) {
        return true; // Circular reference detected
      }

      if (visited.has(nodeKey)) {
        return false; // Already checked this node
      }

      visited.add(nodeKey);
      recursionStack.add(nodeKey);
      
      // Check if we've returned to the starting page (circular reference)
      if (currentPageId === startingPageId && recursionStack.size > 1) {
        return true;
      }

      // Map reference type to section page_type
      const sectionPageType = getPageTypeForSections(currentRefType);
      
      // Get all sections for this page
      const { data: sections } = await supabase
        .from('sections')
        .select('id')
        .eq('page_type', sectionPageType)
        .eq('page_id', currentPageId);

      if (sections && sections.length > 0) {
        const sectionIds = sections.map((s: any) => s.id);
        
        // Get all columns with references
        const { data: columns } = await supabase
          .from('columns')
          .select('content_data')
          .in('section_id', sectionIds)
          .eq('content_type', 'references');

        if (columns) {
          for (const column of columns) {
            const refs = (column.content_data as any).references || [];
            
            for (const ref of refs) {
              if (await hasCircle(ref.id, ref.type)) {
                return true;
              }
            }
          }
        }
      }

      recursionStack.delete(nodeKey);
      return false;
    }

    // Check each new reference
    for (const ref of references) {
      // Direct self-reference check
      if (ref.id === pageId) {
        return { success: true, data: true };
      }
      
      if (await hasCircle(ref.id, ref.type)) {
        return { success: true, data: true };
      }
    }

    return { success: true, data: false };
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
 * Gets version history for a page
 * 
 * @param pageId - Page ID
 * @returns Result containing array of content versions or error details
 */
export async function getVersionHistory(pageId: string): Promise<Result<ContentVersion[]>> {
  try {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('content_versions')
      .select('*')
      .eq('page_id', pageId)
      .order('created_at', { ascending: false });

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
 * Creates a version snapshot of current page content
 * 
 * @param pageType - Type of page
 * @param pageId - Page ID
 * @param userId - User creating the version
 * @returns Result indicating success or error details
 */
export async function createVersionSnapshot(
  pageType: string,
  pageId: string,
  userId: string | null
): Promise<Result<ContentVersion>> {
  try {
    const supabase = getSupabase();
    
    // Get current sections and columns
    const sectionsResult = await listSections(pageType, pageId);
    if (!sectionsResult.success) {
      return sectionsResult as any;
    }

    // Create version snapshot
    const { data, error } = await supabase
      .from('content_versions')
      .insert({
        page_type: pageType,
        page_id: pageId,
        created_by: userId,
        sections_snapshot: sectionsResult.data,
      })
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
 * Reverts page content to a specific version
 * 
 * @param pageId - Page ID
 * @param versionId - Version ID to revert to
 * @returns Result containing restored sections or error details
 */
export async function revertToVersion(
  pageId: string,
  versionId: string
): Promise<Result<Array<Section & { columns: Column[] }>>> {
  try {
    const supabase = getSupabase();
    
    // Get the version
    const { data: version, error: versionError } = await supabase
      .from('content_versions')
      .select('*')
      .eq('id', versionId)
      .eq('page_id', pageId)
      .single();

    if (versionError) {
      return {
        success: false,
        error: {
          code: versionError.code === 'PGRST116' ? 'NOT_FOUND' : 'DATABASE_ERROR',
          message: versionError.message,
          details: versionError,
        },
      };
    }

    // Delete current sections
    const { error: deleteError } = await supabase
      .from('sections')
      .delete()
      .eq('page_type', version.page_type)
      .eq('page_id', pageId);

    if (deleteError) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: deleteError.message,
          details: deleteError,
        },
      };
    }

    // Restore sections from snapshot
    const snapshot = version.sections_snapshot as Array<Section & { columns: Column[] }>;
    const restoredSections: Array<Section & { columns: Column[] }> = [];

    for (const sectionData of snapshot) {
      const createResult = await createSection({
        page_type: version.page_type as any,
        page_id: pageId,
        display_order: sectionData.display_order,
        columns: sectionData.columns.map(col => ({
          column_number: col.column_number,
          content_type: col.content_type,
          content_data: col.content_data,
        })) as any,
      });

      if (!createResult.success) {
        return createResult as any;
      }

      restoredSections.push(createResult.data);
    }

    return { success: true, data: restoredSections };
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
