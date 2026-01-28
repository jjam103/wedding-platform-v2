/**
 * Budget Service
 * 
 * Handles budget calculations, subsidy tracking, payment status updates,
 * and budget report generation for the wedding.
 * 
 * Requirements: 7.2, 7.4, 7.5, 7.7, 7.8
 */

import { supabase } from '@/lib/supabase';
import {
  budgetCalculationSchema,
  type BudgetCalculationDTO,
  type BudgetBreakdown,
  type BudgetSummary,
  type PaymentStatusReport,
  type SubsidyTracking,
} from '../schemas/budgetSchemas';

// Result type for consistent error handling
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } };

/**
 * Calculates total wedding budget including vendors, activities, and accommodations.
 * 
 * @param options - Options to include/exclude different budget categories
 * @returns Result containing budget breakdown or error details
 * 
 * @example
 * const result = await budgetService.calculateTotal({
 *   includeVendors: true,
 *   includeActivities: true,
 *   includeAccommodations: true,
 * });
 */
export async function calculateTotal(options: BudgetCalculationDTO = {}): Promise<Result<BudgetBreakdown>> {
  try {
    // Validate options
    const validation = budgetCalculationSchema.safeParse(options);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid calculation options',
          details: validation.error.issues,
        },
      };
    }

    const {
      includeVendors = true,
      includeActivities = true,
      includeAccommodations = true,
      vendorCategories,
    } = validation.data;

    // Initialize breakdown structure
    const breakdown: BudgetBreakdown = {
      vendors: [],
      activities: {
        totalCost: 0,
        totalSubsidy: 0,
        netCost: 0,
        activities: [],
      },
      accommodations: {
        totalCost: 0,
        totalSubsidy: 0,
        netCost: 0,
        accommodations: [],
      },
      totals: {
        grossTotal: 0,
        totalSubsidies: 0,
        totalPaid: 0,
        netTotal: 0,
        balanceDue: 0,
      },
    };

    // Calculate vendor costs
    if (includeVendors) {
      let vendorQuery = supabase.from('vendors').select('*');
      
      if (vendorCategories && vendorCategories.length > 0) {
        vendorQuery = vendorQuery.in('category', vendorCategories);
      }

      const { data: vendors, error: vendorError } = await vendorQuery;

      if (vendorError) {
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: vendorError.message,
            details: vendorError,
          },
        };
      }

      // Group vendors by category
      const vendorsByCategory: Record<string, any[]> = {};
      vendors.forEach((vendor) => {
        if (!vendorsByCategory[vendor.category]) {
          vendorsByCategory[vendor.category] = [];
        }
        vendorsByCategory[vendor.category].push(vendor);
      });

      // Calculate totals per category
      breakdown.vendors = Object.entries(vendorsByCategory).map(([category, categoryVendors]) => {
        const categoryTotal = categoryVendors.reduce((sum, v) => sum + parseFloat(v.base_cost), 0);
        const categoryPaid = categoryVendors.reduce((sum, v) => sum + parseFloat(v.amount_paid), 0);
        const categoryBalance = categoryTotal - categoryPaid;

        return {
          category,
          totalCost: categoryTotal,
          amountPaid: categoryPaid,
          balanceDue: categoryBalance,
          vendors: categoryVendors.map((v) => ({
            id: v.id,
            name: v.name,
            cost: parseFloat(v.base_cost),
            paid: parseFloat(v.amount_paid),
            balance: parseFloat(v.base_cost) - parseFloat(v.amount_paid),
            paymentStatus: v.payment_status,
          })),
        };
      });

      // Update totals
      breakdown.totals.grossTotal += breakdown.vendors.reduce((sum, cat) => sum + cat.totalCost, 0);
      breakdown.totals.totalPaid += breakdown.vendors.reduce((sum, cat) => sum + cat.amountPaid, 0);
    }

    // Calculate activity costs
    if (includeActivities) {
      const { data: activities, error: activityError } = await supabase
        .from('activities')
        .select('id, name, cost_per_person, host_subsidy')
        .not('cost_per_person', 'is', null);

      if (activityError) {
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: activityError.message,
            details: activityError,
          },
        };
      }

      // Get RSVP counts for each activity
      for (const activity of activities) {
        const { count: attendeeCount, error: rsvpError } = await supabase
          .from('rsvps')
          .select('*', { count: 'exact', head: true })
          .eq('activity_id', activity.id)
          .eq('status', 'attending');

        if (rsvpError) {
          return {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: rsvpError.message,
              details: rsvpError,
            },
          };
        }

        const estimatedAttendees = attendeeCount || 0;
        const costPerPerson = parseFloat(activity.cost_per_person);
        const hostSubsidy = activity.host_subsidy ? parseFloat(activity.host_subsidy) : 0;
        const totalCost = costPerPerson * estimatedAttendees;
        const totalSubsidy = hostSubsidy * estimatedAttendees;
        const netCost = totalCost - totalSubsidy;

        breakdown.activities.activities.push({
          id: activity.id,
          name: activity.name,
          costPerPerson,
          hostSubsidy,
          estimatedAttendees,
          totalCost,
          netCost,
        });

        breakdown.activities.totalCost += totalCost;
        breakdown.activities.totalSubsidy += totalSubsidy;
        breakdown.activities.netCost += netCost;
      }

      breakdown.totals.grossTotal += breakdown.activities.totalCost;
      breakdown.totals.totalSubsidies += breakdown.activities.totalSubsidy;
    }

    // Calculate accommodation costs
    if (includeAccommodations) {
      // Note: This is a simplified calculation. In a real implementation,
      // you would need to query room_types and room_assignments tables
      // For now, we'll leave this as a placeholder
      breakdown.accommodations = {
        totalCost: 0,
        totalSubsidy: 0,
        netCost: 0,
        accommodations: [],
      };
    }

    // Calculate final totals
    breakdown.totals.netTotal = breakdown.totals.grossTotal - breakdown.totals.totalSubsidies;
    breakdown.totals.balanceDue = breakdown.totals.netTotal - breakdown.totals.totalPaid;

    return {
      success: true,
      data: breakdown,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Gets a summary of the wedding budget for dashboard display.
 * 
 * @returns Result containing budget summary or error details
 */
export async function getSummary(): Promise<Result<BudgetSummary>> {
  try {
    const breakdownResult = await calculateTotal();
    if (!breakdownResult.success) {
      return breakdownResult as Result<BudgetSummary>;
    }

    const breakdown = breakdownResult.data;

    // Count vendors
    const { count: totalVendors, error: countError } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: countError.message,
          details: countError,
        },
      };
    }

    const { count: unpaidVendors, error: unpaidError } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'unpaid');

    if (unpaidError) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: unpaidError.message,
          details: unpaidError,
        },
      };
    }

    const paymentProgress = breakdown.totals.netTotal > 0
      ? (breakdown.totals.totalPaid / breakdown.totals.netTotal) * 100
      : 0;

    return {
      success: true,
      data: {
        totalBudget: breakdown.totals.netTotal,
        totalPaid: breakdown.totals.totalPaid,
        totalSubsidies: breakdown.totals.totalSubsidies,
        balanceDue: breakdown.totals.balanceDue,
        vendorCount: totalVendors || 0,
        unpaidVendorCount: unpaidVendors || 0,
        paymentProgress: Math.round(paymentProgress * 100) / 100,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Generates a payment status report showing unpaid, partially paid, and paid vendors.
 * 
 * @returns Result containing payment status report or error details
 */
export async function getPaymentStatusReport(): Promise<Result<PaymentStatusReport>> {
  try {
    const { data: vendors, error } = await supabase
      .from('vendors')
      .select('*')
      .order('payment_status', { ascending: true })
      .order('name', { ascending: true });

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

    const report: PaymentStatusReport = {
      unpaidVendors: [],
      partiallyPaidVendors: [],
      paidVendors: [],
      totalUnpaid: 0,
      totalPartial: 0,
      totalPaid: 0,
    };

    vendors.forEach((vendor) => {
      const baseCost = parseFloat(vendor.base_cost);
      const amountPaid = parseFloat(vendor.amount_paid);
      const balanceDue = baseCost - amountPaid;

      if (vendor.payment_status === 'unpaid') {
        report.unpaidVendors.push({
          id: vendor.id,
          name: vendor.name,
          category: vendor.category,
          baseCost,
        });
        report.totalUnpaid += baseCost;
      } else if (vendor.payment_status === 'partial') {
        report.partiallyPaidVendors.push({
          id: vendor.id,
          name: vendor.name,
          category: vendor.category,
          baseCost,
          amountPaid,
          balanceDue,
        });
        report.totalPartial += balanceDue;
      } else if (vendor.payment_status === 'paid') {
        report.paidVendors.push({
          id: vendor.id,
          name: vendor.name,
          category: vendor.category,
          amountPaid,
        });
        report.totalPaid += amountPaid;
      }
    });

    return {
      success: true,
      data: report,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Tracks all subsidies across activities and accommodations.
 * 
 * @returns Result containing subsidy tracking information or error details
 */
export async function trackSubsidies(): Promise<Result<SubsidyTracking>> {
  try {
    const tracking: SubsidyTracking = {
      activitySubsidies: [],
      accommodationSubsidies: [],
      totalActivitySubsidies: 0,
      totalAccommodationSubsidies: 0,
      grandTotalSubsidies: 0,
    };

    // Get activity subsidies
    const { data: activities, error: activityError } = await supabase
      .from('activities')
      .select('id, name, host_subsidy')
      .not('host_subsidy', 'is', null);

    if (activityError) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: activityError.message,
          details: activityError,
        },
      };
    }

    // Calculate activity subsidies
    for (const activity of activities) {
      const { count: attendeeCount, error: rsvpError } = await supabase
        .from('rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('activity_id', activity.id)
        .eq('status', 'attending');

      if (rsvpError) {
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: rsvpError.message,
            details: rsvpError,
          },
        };
      }

      const estimatedAttendees = attendeeCount || 0;
      const subsidyPerPerson = parseFloat(activity.host_subsidy);
      const totalSubsidy = subsidyPerPerson * estimatedAttendees;

      tracking.activitySubsidies.push({
        activityId: activity.id,
        activityName: activity.name,
        subsidyPerPerson,
        estimatedAttendees,
        totalSubsidy,
      });

      tracking.totalActivitySubsidies += totalSubsidy;
    }

    // Note: Accommodation subsidies would be calculated here
    // This requires room_types and room_assignments tables
    tracking.accommodationSubsidies = [];
    tracking.totalAccommodationSubsidies = 0;

    tracking.grandTotalSubsidies = tracking.totalActivitySubsidies + tracking.totalAccommodationSubsidies;

    return {
      success: true,
      data: tracking,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Generates a comprehensive budget report with all details.
 * 
 * @returns Result containing complete budget breakdown or error details
 */
export async function generateReport(): Promise<Result<BudgetBreakdown>> {
  // This is essentially the same as calculateTotal with all options enabled
  return calculateTotal({
    includeVendors: true,
    includeActivities: true,
    includeAccommodations: true,
  });
}
