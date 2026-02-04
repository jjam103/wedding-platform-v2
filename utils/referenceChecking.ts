/**
 * Reference Checking Utilities
 * 
 * Provides functions to check for references before deletion and
 * identify dependent records that would be affected by cascade deletion.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface DependentRecord {
  type: 'section' | 'column' | 'activity' | 'rsvp' | 'reference';
  id: string;
  name?: string;
  count?: number;
}

export interface ReferenceCheckResult {
  hasReferences: boolean;
  dependentRecords: DependentRecord[];
  totalCount: number;
}

/**
 * Checks for references to a content page before deletion
 * 
 * @param pageId - Content page ID
 * @returns Reference check result with list of dependent records
 */
export async function checkContentPageReferences(pageId: string): Promise<ReferenceCheckResult> {
  const dependentRecords: DependentRecord[] = [];

  // Check for sections
  const { data: sections } = await supabase
    .from('sections')
    .select('id, title')
    .eq('page_type', 'custom')
    .eq('page_id', pageId)
    .is('deleted_at', null);

  if (sections && sections.length > 0) {
    dependentRecords.push({
      type: 'section',
      id: 'sections',
      name: 'Sections',
      count: sections.length,
    });

    // Check for columns in those sections
    const sectionIds = sections.map((s) => s.id);
    const { data: columns } = await supabase
      .from('columns')
      .select('id')
      .in('section_id', sectionIds)
      .is('deleted_at', null);

    if (columns && columns.length > 0) {
      dependentRecords.push({
        type: 'column',
        id: 'columns',
        name: 'Columns',
        count: columns.length,
      });
    }
  }

  // Check for references in other sections
  const { data: referencingSections } = await supabase
    .from('sections')
    .select('id, title, page_type, page_id')
    .contains('content', { references: [{ type: 'content_page', id: pageId }] })
    .is('deleted_at', null);

  if (referencingSections && referencingSections.length > 0) {
    dependentRecords.push({
      type: 'reference',
      id: 'references',
      name: 'References in other pages',
      count: referencingSections.length,
    });
  }

  const totalCount = dependentRecords.reduce((sum, record) => sum + (record.count || 0), 0);

  return {
    hasReferences: dependentRecords.length > 0,
    dependentRecords,
    totalCount,
  };
}

/**
 * Checks for references to an event before deletion
 * 
 * @param eventId - Event ID
 * @returns Reference check result with list of dependent records
 */
export async function checkEventReferences(eventId: string): Promise<ReferenceCheckResult> {
  const dependentRecords: DependentRecord[] = [];

  // Check for activities
  const { data: activities } = await supabase
    .from('activities')
    .select('id, name')
    .eq('event_id', eventId)
    .is('deleted_at', null);

  if (activities && activities.length > 0) {
    dependentRecords.push({
      type: 'activity',
      id: 'activities',
      name: 'Activities',
      count: activities.length,
    });

    // Check for RSVPs in those activities
    const activityIds = activities.map((a) => a.id);
    const { data: rsvps } = await supabase
      .from('rsvps')
      .select('id')
      .in('activity_id', activityIds)
      .is('deleted_at', null);

    if (rsvps && rsvps.length > 0) {
      dependentRecords.push({
        type: 'rsvp',
        id: 'rsvps',
        name: 'RSVPs',
        count: rsvps.length,
      });
    }
  }

  // Check for references in sections
  const { data: referencingSections } = await supabase
    .from('sections')
    .select('id, title, page_type, page_id')
    .contains('content', { references: [{ type: 'event', id: eventId }] })
    .is('deleted_at', null);

  if (referencingSections && referencingSections.length > 0) {
    dependentRecords.push({
      type: 'reference',
      id: 'references',
      name: 'References in pages',
      count: referencingSections.length,
    });
  }

  const totalCount = dependentRecords.reduce((sum, record) => sum + (record.count || 0), 0);

  return {
    hasReferences: dependentRecords.length > 0,
    dependentRecords,
    totalCount,
  };
}

/**
 * Checks for references to an activity before deletion
 * 
 * @param activityId - Activity ID
 * @returns Reference check result with list of dependent records
 */
export async function checkActivityReferences(activityId: string): Promise<ReferenceCheckResult> {
  const dependentRecords: DependentRecord[] = [];

  // Check for RSVPs
  const { data: rsvps } = await supabase
    .from('rsvps')
    .select('id')
    .eq('activity_id', activityId)
    .is('deleted_at', null);

  if (rsvps && rsvps.length > 0) {
    dependentRecords.push({
      type: 'rsvp',
      id: 'rsvps',
      name: 'RSVPs',
      count: rsvps.length,
    });
  }

  // Check for references in sections
  const { data: referencingSections } = await supabase
    .from('sections')
    .select('id, title, page_type, page_id')
    .contains('content', { references: [{ type: 'activity', id: activityId }] })
    .is('deleted_at', null);

  if (referencingSections && referencingSections.length > 0) {
    dependentRecords.push({
      type: 'reference',
      id: 'references',
      name: 'References in pages',
      count: referencingSections.length,
    });
  }

  const totalCount = dependentRecords.reduce((sum, record) => sum + (record.count || 0), 0);

  return {
    hasReferences: dependentRecords.length > 0,
    dependentRecords,
    totalCount,
  };
}
