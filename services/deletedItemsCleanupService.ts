/**
 * Deleted Items Cleanup Service
 * 
 * Permanently deletes soft-deleted items older than 30 days.
 * Runs as a scheduled job daily at 2 AM.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Result<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: any } };

interface CleanupResult {
  contentPages: number;
  sections: number;
  columns: number;
  events: number;
  activities: number;
  photos: number;
  rsvps: number;
  total: number;
}

/**
 * Permanently deletes soft-deleted items older than 30 days
 * 
 * @returns Result containing cleanup statistics
 * 
 * @example
 * const result = await cleanupOldDeletedItems();
 * if (result.success) {
 *   console.log(`Cleaned up ${result.data.total} items`);
 * }
 */
export async function cleanupOldDeletedItems(): Promise<Result<CleanupResult>> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString();

    const result: CleanupResult = {
      contentPages: 0,
      sections: 0,
      columns: 0,
      events: 0,
      activities: 0,
      photos: 0,
      rsvps: 0,
      total: 0,
    };

    // Delete old content pages
    const { data: deletedPages, error: pagesError } = await supabase
      .from('content_pages')
      .delete()
      .not('deleted_at', 'is', null)
      .lt('deleted_at', cutoffDate)
      .select('id');

    if (pagesError) {
      console.error('Error deleting content pages:', pagesError);
    } else if (deletedPages) {
      result.contentPages = deletedPages.length;
      result.total += deletedPages.length;
    }

    // Delete old sections
    const { data: deletedSections, error: sectionsError } = await supabase
      .from('sections')
      .delete()
      .not('deleted_at', 'is', null)
      .lt('deleted_at', cutoffDate)
      .select('id');

    if (sectionsError) {
      console.error('Error deleting sections:', sectionsError);
    } else if (deletedSections) {
      result.sections = deletedSections.length;
      result.total += deletedSections.length;
    }

    // Delete old columns
    const { data: deletedColumns, error: columnsError } = await supabase
      .from('columns')
      .delete()
      .not('deleted_at', 'is', null)
      .lt('deleted_at', cutoffDate)
      .select('id');

    if (columnsError) {
      console.error('Error deleting columns:', columnsError);
    } else if (deletedColumns) {
      result.columns = deletedColumns.length;
      result.total += deletedColumns.length;
    }

    // Delete old events
    const { data: deletedEvents, error: eventsError } = await supabase
      .from('events')
      .delete()
      .not('deleted_at', 'is', null)
      .lt('deleted_at', cutoffDate)
      .select('id');

    if (eventsError) {
      console.error('Error deleting events:', eventsError);
    } else if (deletedEvents) {
      result.events = deletedEvents.length;
      result.total += deletedEvents.length;
    }

    // Delete old activities
    const { data: deletedActivities, error: activitiesError } = await supabase
      .from('activities')
      .delete()
      .not('deleted_at', 'is', null)
      .lt('deleted_at', cutoffDate)
      .select('id');

    if (activitiesError) {
      console.error('Error deleting activities:', activitiesError);
    } else if (deletedActivities) {
      result.activities = deletedActivities.length;
      result.total += deletedActivities.length;
    }

    // Delete old photos
    const { data: deletedPhotos, error: photosError } = await supabase
      .from('photos')
      .delete()
      .not('deleted_at', 'is', null)
      .lt('deleted_at', cutoffDate)
      .select('id');

    if (photosError) {
      console.error('Error deleting photos:', photosError);
    } else if (deletedPhotos) {
      result.photos = deletedPhotos.length;
      result.total += deletedPhotos.length;
    }

    // Delete old RSVPs
    const { data: deletedRsvps, error: rsvpsError } = await supabase
      .from('rsvps')
      .delete()
      .not('deleted_at', 'is', null)
      .lt('deleted_at', cutoffDate)
      .select('id');

    if (rsvpsError) {
      console.error('Error deleting RSVPs:', rsvpsError);
    } else if (deletedRsvps) {
      result.rsvps = deletedRsvps.length;
      result.total += deletedRsvps.length;
    }

    // Log cleanup results
    console.log('Deleted items cleanup completed:', {
      timestamp: new Date().toISOString(),
      cutoffDate,
      ...result,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error during cleanup:', error);
    return {
      success: false,
      error: {
        code: 'CLEANUP_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Schedules the cleanup job to run daily at 2 AM
 * 
 * Note: This should be called from a cron job or scheduled task runner.
 * For Vercel, use Vercel Cron Jobs.
 * For other platforms, use platform-specific scheduling.
 */
export async function scheduleCleanupJob() {
  // This function is called by the cron job endpoint
  return await cleanupOldDeletedItems();
}
