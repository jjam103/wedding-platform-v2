/**
 * Capacity Report Service
 * 
 * Handles capacity utilization reporting for activities and accommodations.
 * 
 * Requirements: 15.3
 */

import { createClient } from '@supabase/supabase-js';
import type { Result } from '@/types';
import { ERROR_CODES } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Activity capacity utilization data.
 */
export interface ActivityCapacityReport {
  activityId: string;
  activityName: string;
  capacity: number | null;
  currentAttendees: number;
  utilizationRate: number; // Percentage (0-100)
  availableSpots: number | null;
  status: 'available' | 'near_capacity' | 'at_capacity' | 'over_capacity' | 'unlimited';
}

/**
 * Accommodation occupancy data.
 */
export interface AccommodationOccupancyReport {
  accommodationId: string;
  accommodationName: string;
  roomTypes: Array<{
    roomTypeId: string;
    roomTypeName: string;
    totalRooms: number;
    assignedRooms: number;
    occupancyRate: number; // Percentage (0-100)
    availableRooms: number;
  }>;
  totalRooms: number;
  totalAssigned: number;
  overallOccupancyRate: number;
}

/**
 * Comprehensive capacity utilization report.
 */
export interface CapacityUtilizationReport {
  activities: ActivityCapacityReport[];
  accommodations: AccommodationOccupancyReport[];
  summary: {
    totalActivities: number;
    activitiesNearCapacity: number;
    activitiesAtCapacity: number;
    totalAccommodations: number;
    averageOccupancyRate: number;
  };
}

/**
 * Generates activity capacity utilization report.
 * 
 * @param activityId - Optional activity ID to get report for specific activity
 * @returns Result containing activity capacity reports or error details
 * 
 * Requirements: 15.3
 */
export async function getActivityCapacityReport(
  activityId?: string
): Promise<Result<ActivityCapacityReport[]>> {
  try {
    // Build query
    let query = supabase
      .from('activities')
      .select('id, name, capacity')
      .eq('status', 'published');

    if (activityId) {
      query = query.eq('id', activityId);
    }

    const { data: activities, error: activityError } = await query;

    if (activityError) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: activityError.message,
          details: activityError,
        },
      };
    }

    const reports: ActivityCapacityReport[] = [];

    // Calculate utilization for each activity
    for (const activity of activities) {
      // Get current attendee count
      const { count: attendeeCount, error: rsvpError } = await supabase
        .from('rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('activity_id', activity.id)
        .eq('status', 'attending');

      if (rsvpError) {
        return {
          success: false,
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: rsvpError.message,
            details: rsvpError,
          },
        };
      }

      const currentAttendees = attendeeCount || 0;
      const capacity = activity.capacity;

      let utilizationRate = 0;
      let availableSpots: number | null = null;
      let status: ActivityCapacityReport['status'] = 'unlimited';

      if (capacity !== null && capacity > 0) {
        utilizationRate = (currentAttendees / capacity) * 100;
        availableSpots = capacity - currentAttendees;

        if (utilizationRate >= 100) {
          status = 'at_capacity';
        } else if (utilizationRate > 100) {
          status = 'over_capacity';
        } else if (utilizationRate >= 90) {
          status = 'near_capacity';
        } else {
          status = 'available';
        }
      }

      reports.push({
        activityId: activity.id,
        activityName: activity.name,
        capacity,
        currentAttendees,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        availableSpots,
        status,
      });
    }

    return {
      success: true,
      data: reports,
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
 * Generates accommodation occupancy report.
 * 
 * @param accommodationId - Optional accommodation ID to get report for specific accommodation
 * @returns Result containing accommodation occupancy reports or error details
 * 
 * Requirements: 15.3
 */
export async function getAccommodationOccupancyReport(
  accommodationId?: string
): Promise<Result<AccommodationOccupancyReport[]>> {
  try {
    // Build query
    let query = supabase
      .from('accommodations')
      .select('id, name')
      .eq('status', 'published');

    if (accommodationId) {
      query = query.eq('id', accommodationId);
    }

    const { data: accommodations, error: accommodationError } = await query;

    if (accommodationError) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: accommodationError.message,
          details: accommodationError,
        },
      };
    }

    const reports: AccommodationOccupancyReport[] = [];

    // Calculate occupancy for each accommodation
    for (const accommodation of accommodations) {
      // Get room types for this accommodation
      const { data: roomTypes, error: roomTypeError } = await supabase
        .from('room_types')
        .select('id, name, total_rooms')
        .eq('accommodation_id', accommodation.id)
        .eq('status', 'published');

      if (roomTypeError) {
        return {
          success: false,
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: roomTypeError.message,
            details: roomTypeError,
          },
        };
      }

      const roomTypeReports = [];
      let totalRooms = 0;
      let totalAssigned = 0;

      for (const roomType of roomTypes) {
        // Count assigned rooms for this room type
        const { count: assignedCount, error: assignmentError } = await supabase
          .from('room_assignments')
          .select('room_type_id', { count: 'exact', head: true })
          .eq('room_type_id', roomType.id);

        if (assignmentError) {
          return {
            success: false,
            error: {
              code: ERROR_CODES.DATABASE_ERROR,
              message: assignmentError.message,
              details: assignmentError,
            },
          };
        }

        const assignedRooms = assignedCount || 0;
        const occupancyRate = roomType.total_rooms > 0
          ? (assignedRooms / roomType.total_rooms) * 100
          : 0;
        const availableRooms = roomType.total_rooms - assignedRooms;

        roomTypeReports.push({
          roomTypeId: roomType.id,
          roomTypeName: roomType.name,
          totalRooms: roomType.total_rooms,
          assignedRooms,
          occupancyRate: Math.round(occupancyRate * 100) / 100,
          availableRooms,
        });

        totalRooms += roomType.total_rooms;
        totalAssigned += assignedRooms;
      }

      const overallOccupancyRate = totalRooms > 0
        ? (totalAssigned / totalRooms) * 100
        : 0;

      reports.push({
        accommodationId: accommodation.id,
        accommodationName: accommodation.name,
        roomTypes: roomTypeReports,
        totalRooms,
        totalAssigned,
        overallOccupancyRate: Math.round(overallOccupancyRate * 100) / 100,
      });
    }

    return {
      success: true,
      data: reports,
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
 * Generates comprehensive capacity utilization report.
 * 
 * @returns Result containing complete capacity utilization report or error details
 * 
 * Requirements: 15.3
 */
export async function getCapacityUtilizationReport(): Promise<Result<CapacityUtilizationReport>> {
  try {
    // Get activity capacity reports
    const activityResult = await getActivityCapacityReport();
    if (!activityResult.success) {
      return activityResult as Result<CapacityUtilizationReport>;
    }

    // Get accommodation occupancy reports
    const accommodationResult = await getAccommodationOccupancyReport();
    if (!accommodationResult.success) {
      return accommodationResult as Result<CapacityUtilizationReport>;
    }

    const activities = activityResult.data;
    const accommodations = accommodationResult.data;

    // Calculate summary statistics
    const activitiesNearCapacity = activities.filter(a => a.status === 'near_capacity').length;
    const activitiesAtCapacity = activities.filter(a => a.status === 'at_capacity' || a.status === 'over_capacity').length;

    const averageOccupancyRate = accommodations.length > 0
      ? accommodations.reduce((sum, a) => sum + a.overallOccupancyRate, 0) / accommodations.length
      : 0;

    return {
      success: true,
      data: {
        activities,
        accommodations,
        summary: {
          totalActivities: activities.length,
          activitiesNearCapacity,
          activitiesAtCapacity,
          totalAccommodations: accommodations.length,
          averageOccupancyRate: Math.round(averageOccupancyRate * 100) / 100,
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
