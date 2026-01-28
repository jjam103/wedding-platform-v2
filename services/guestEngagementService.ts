/**
 * Guest Engagement Service
 * 
 * Tracks guest engagement metrics including portal logins, photo uploads,
 * and email interactions.
 * 
 * Requirements: 15.4, 12.4
 */

import { createClient } from '@supabase/supabase-js';
import type { Result } from '@/types';
import { ERROR_CODES } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Portal login statistics.
 */
export interface PortalLoginStats {
  totalGuests: number;
  guestsWithLogins: number;
  loginRate: number; // Percentage (0-100)
  totalLogins: number;
  averageLoginsPerGuest: number;
  recentLogins: Array<{
    guestId: string;
    guestName: string;
    lastLogin: string;
    loginCount: number;
  }>;
}

/**
 * Photo upload statistics.
 */
export interface PhotoUploadStats {
  totalPhotos: number;
  photosByStatus: {
    pending: number;
    approved: number;
    rejected: number;
  };
  guestsWhoUploaded: number;
  uploadRate: number; // Percentage of guests who uploaded (0-100)
  topContributors: Array<{
    guestId: string;
    guestName: string;
    photoCount: number;
  }>;
  uploadsByDate: Array<{
    date: string;
    count: number;
  }>;
}

/**
 * Email engagement statistics.
 */
export interface EmailEngagementStats {
  totalEmailsSent: number;
  emailsDelivered: number;
  emailsFailed: number;
  deliveryRate: number; // Percentage (0-100)
  emailsByStatus: {
    queued: number;
    sent: number;
    delivered: number;
    failed: number;
    bounced: number;
  };
  recentEmails: Array<{
    recipientEmail: string;
    subject: string;
    deliveryStatus: string;
    sentAt: string;
  }>;
}

/**
 * Comprehensive guest engagement report.
 */
export interface GuestEngagementReport {
  portalLogins: PortalLoginStats;
  photoUploads: PhotoUploadStats;
  emailEngagement: EmailEngagementStats;
  summary: {
    overallEngagementRate: number; // Percentage (0-100)
    activeGuests: number; // Guests with any engagement activity
    inactiveGuests: number; // Guests with no engagement
  };
}

/**
 * Tracks portal login frequency for guests.
 * 
 * @param daysBack - Number of days to look back for login data (default: 30)
 * @returns Result containing portal login statistics or error details
 * 
 * Requirements: 15.4
 */
export async function trackPortalLogins(daysBack: number = 30): Promise<Result<PortalLoginStats>> {
  try {
    // Get total guest count
    const { count: totalGuests, error: guestCountError } = await supabase
      .from('guests')
      .select('*', { count: 'exact', head: true });

    if (guestCountError) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: guestCountError.message,
          details: guestCountError,
        },
      };
    }

    // Get users (guests with accounts) and their login data
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, last_login')
      .eq('role', 'guest')
      .gte('last_login', cutoffDate.toISOString());

    if (userError) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: userError.message,
          details: userError,
        },
      };
    }

    const guestsWithLogins = users.length;
    const loginRate = totalGuests && totalGuests > 0 ? (guestsWithLogins / totalGuests) * 100 : 0;

    // For a more accurate login count, we would need an audit log or login history table
    // For now, we'll use the count of users with recent logins as a proxy
    const totalLogins = guestsWithLogins; // Simplified - would be sum of all login events
    const averageLoginsPerGuest = guestsWithLogins > 0 ? totalLogins / guestsWithLogins : 0;

    // Get guest details for recent logins
    const recentLogins = [];
    for (const user of users.slice(0, 10)) { // Top 10 most recent
      const { data: guest, error: guestError } = await supabase
        .from('guests')
        .select('id, first_name, last_name')
        .eq('email', user.email)
        .single();

      if (!guestError && guest) {
        recentLogins.push({
          guestId: guest.id,
          guestName: `${guest.first_name} ${guest.last_name}`,
          lastLogin: user.last_login || '',
          loginCount: 1, // Simplified - would come from audit log
        });
      }
    }

    return {
      success: true,
      data: {
        totalGuests: totalGuests || 0,
        guestsWithLogins,
        loginRate: Math.round(loginRate * 100) / 100,
        totalLogins,
        averageLoginsPerGuest: Math.round(averageLoginsPerGuest * 100) / 100,
        recentLogins,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Tracks photo upload statistics.
 * 
 * @param daysBack - Number of days to look back for photo data (default: 30)
 * @returns Result containing photo upload statistics or error details
 * 
 * Requirements: 15.4
 */
export async function trackPhotoUploads(daysBack: number = 30): Promise<Result<PhotoUploadStats>> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Get all photos within the time period
    const { data: photos, error: photoError } = await supabase
      .from('photos')
      .select('id, uploader_id, moderation_status, created_at')
      .gte('created_at', cutoffDate.toISOString());

    if (photoError) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: photoError.message,
          details: photoError,
        },
      };
    }

    const totalPhotos = photos.length;

    // Count by status
    const photosByStatus = {
      pending: photos.filter(p => p.moderation_status === 'pending').length,
      approved: photos.filter(p => p.moderation_status === 'approved').length,
      rejected: photos.filter(p => p.moderation_status === 'rejected').length,
    };

    // Get unique uploaders
    const uniqueUploaders = new Set(photos.map(p => p.uploader_id));
    const guestsWhoUploaded = uniqueUploaders.size;

    // Get total guest count for upload rate
    const { count: totalGuests, error: guestCountError } = await supabase
      .from('guests')
      .select('*', { count: 'exact', head: true });

    if (guestCountError) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: guestCountError.message,
          details: guestCountError,
        },
      };
    }

    const uploadRate = totalGuests && totalGuests > 0 ? (guestsWhoUploaded / totalGuests) * 100 : 0;

    // Calculate top contributors
    const uploaderCounts = new Map<string, number>();
    photos.forEach(photo => {
      uploaderCounts.set(photo.uploader_id, (uploaderCounts.get(photo.uploader_id) || 0) + 1);
    });

    const topContributorIds = Array.from(uploaderCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);

    // Get user details for top contributors
    const topContributors = [];
    for (const uploaderId of topContributorIds) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', uploaderId)
        .single();

      if (!userError && user) {
        const { data: guest, error: guestError } = await supabase
          .from('guests')
          .select('id, first_name, last_name')
          .eq('email', user.email)
          .single();

        if (!guestError && guest) {
          topContributors.push({
            guestId: guest.id,
            guestName: `${guest.first_name} ${guest.last_name}`,
            photoCount: uploaderCounts.get(uploaderId) || 0,
          });
        }
      }
    }

    // Group uploads by date
    const uploadsByDate = new Map<string, number>();
    photos.forEach(photo => {
      const date = photo.created_at.split('T')[0]; // Get date part only
      uploadsByDate.set(date, (uploadsByDate.get(date) || 0) + 1);
    });

    const uploadsByDateArray = Array.from(uploadsByDate.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      success: true,
      data: {
        totalPhotos,
        photosByStatus,
        guestsWhoUploaded,
        uploadRate: Math.round(uploadRate * 100) / 100,
        topContributors,
        uploadsByDate: uploadsByDateArray,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Tracks email open rates and engagement.
 * 
 * @param daysBack - Number of days to look back for email data (default: 30)
 * @returns Result containing email engagement statistics or error details
 * 
 * Requirements: 15.4, 12.4
 */
export async function trackEmailEngagement(daysBack: number = 30): Promise<Result<EmailEngagementStats>> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Get all emails within the time period
    const { data: emails, error: emailError } = await supabase
      .from('email_logs')
      .select('id, recipient_email, subject, delivery_status, sent_at')
      .gte('created_at', cutoffDate.toISOString());

    if (emailError) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: emailError.message,
          details: emailError,
        },
      };
    }

    const totalEmailsSent = emails.length;

    // Count by status
    const emailsByStatus = {
      queued: emails.filter(e => e.delivery_status === 'queued').length,
      sent: emails.filter(e => e.delivery_status === 'sent').length,
      delivered: emails.filter(e => e.delivery_status === 'delivered').length,
      failed: emails.filter(e => e.delivery_status === 'failed').length,
      bounced: emails.filter(e => e.delivery_status === 'bounced').length,
    };

    const emailsDelivered = emailsByStatus.delivered;
    const emailsFailed = emailsByStatus.failed + emailsByStatus.bounced;
    const deliveryRate = totalEmailsSent > 0 ? (emailsDelivered / totalEmailsSent) * 100 : 0;

    // Get recent emails
    const recentEmails = emails
      .filter(e => e.sent_at)
      .sort((a, b) => new Date(b.sent_at!).getTime() - new Date(a.sent_at!).getTime())
      .slice(0, 10)
      .map(e => ({
        recipientEmail: e.recipient_email,
        subject: e.subject,
        deliveryStatus: e.delivery_status,
        sentAt: e.sent_at || '',
      }));

    return {
      success: true,
      data: {
        totalEmailsSent,
        emailsDelivered,
        emailsFailed,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        emailsByStatus,
        recentEmails,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Generates comprehensive guest engagement report.
 * 
 * @param daysBack - Number of days to look back for engagement data (default: 30)
 * @returns Result containing complete engagement report or error details
 * 
 * Requirements: 15.4, 12.4
 */
export async function getGuestEngagementReport(daysBack: number = 30): Promise<Result<GuestEngagementReport>> {
  try {
    // Get all engagement metrics
    const [loginResult, photoResult, emailResult] = await Promise.all([
      trackPortalLogins(daysBack),
      trackPhotoUploads(daysBack),
      trackEmailEngagement(daysBack),
    ]);

    if (!loginResult.success) {
      return loginResult as Result<GuestEngagementReport>;
    }
    if (!photoResult.success) {
      return photoResult as Result<GuestEngagementReport>;
    }
    if (!emailResult.success) {
      return emailResult as Result<GuestEngagementReport>;
    }

    const portalLogins = loginResult.data;
    const photoUploads = photoResult.data;
    const emailEngagement = emailResult.data;

    // Calculate overall engagement
    const totalGuests = portalLogins.totalGuests;
    const guestsWithLogins = portalLogins.guestsWithLogins;
    const guestsWhoUploaded = photoUploads.guestsWhoUploaded;

    // Count unique active guests (logged in OR uploaded photos)
    const activeGuestsSet = new Set<string>();
    
    // Add guests who logged in
    portalLogins.recentLogins.forEach(login => activeGuestsSet.add(login.guestId));
    
    // Add guests who uploaded photos
    photoUploads.topContributors.forEach(contributor => activeGuestsSet.add(contributor.guestId));

    const activeGuests = activeGuestsSet.size;
    const inactiveGuests = totalGuests - activeGuests;

    // Calculate overall engagement rate
    const overallEngagementRate = totalGuests > 0 ? (activeGuests / totalGuests) * 100 : 0;

    return {
      success: true,
      data: {
        portalLogins,
        photoUploads,
        emailEngagement,
        summary: {
          overallEngagementRate: Math.round(overallEngagementRate * 100) / 100,
          activeGuests,
          inactiveGuests,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
