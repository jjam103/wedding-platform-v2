import { z } from 'zod';

/**
 * Schema for budget calculation filters.
 */
export const budgetCalculationSchema = z.object({
  includeVendors: z.boolean().optional(),
  includeActivities: z.boolean().optional(),
  includeAccommodations: z.boolean().optional(),
  vendorCategories: z.array(z.enum(['photography', 'flowers', 'catering', 'music', 'transportation', 'decoration', 'other'])).optional(),
});

/**
 * Type definitions derived from schemas.
 */
export type BudgetCalculationDTO = z.infer<typeof budgetCalculationSchema>;

/**
 * Budget breakdown by category.
 */
export interface BudgetBreakdown {
  vendors: {
    category: string;
    totalCost: number;
    amountPaid: number;
    balanceDue: number;
    vendors: Array<{
      id: string;
      name: string;
      cost: number;
      paid: number;
      balance: number;
      paymentStatus: 'unpaid' | 'partial' | 'paid';
    }>;
  }[];
  activities: {
    totalCost: number;
    totalSubsidy: number;
    netCost: number;
    activities: Array<{
      id: string;
      name: string;
      costPerPerson: number;
      hostSubsidy: number;
      estimatedAttendees: number;
      totalCost: number;
      netCost: number;
    }>;
  };
  accommodations: {
    totalCost: number;
    totalSubsidy: number;
    netCost: number;
    accommodations: Array<{
      id: string;
      name: string;
      roomType: string;
      nights: number;
      pricePerNight: number;
      subsidyPerNight: number;
      totalCost: number;
      netCost: number;
    }>;
  };
  totals: {
    grossTotal: number;
    totalSubsidies: number;
    totalPaid: number;
    netTotal: number;
    balanceDue: number;
  };
}

/**
 * Budget summary for dashboard display.
 */
export interface BudgetSummary {
  totalBudget: number;
  totalPaid: number;
  totalSubsidies: number;
  balanceDue: number;
  vendorCount: number;
  unpaidVendorCount: number;
  paymentProgress: number; // percentage
}

/**
 * Payment status report.
 */
export interface PaymentStatusReport {
  unpaidVendors: Array<{
    id: string;
    name: string;
    category: string;
    baseCost: number;
    dueDate?: string;
  }>;
  partiallyPaidVendors: Array<{
    id: string;
    name: string;
    category: string;
    baseCost: number;
    amountPaid: number;
    balanceDue: number;
  }>;
  paidVendors: Array<{
    id: string;
    name: string;
    category: string;
    amountPaid: number;
    paidDate?: string;
  }>;
  totalUnpaid: number;
  totalPartial: number;
  totalPaid: number;
}

/**
 * Subsidy tracking information.
 */
export interface SubsidyTracking {
  activitySubsidies: {
    activityId: string;
    activityName: string;
    subsidyPerPerson: number;
    estimatedAttendees: number;
    totalSubsidy: number;
  }[];
  accommodationSubsidies: {
    accommodationId: string;
    accommodationName: string;
    roomType: string;
    subsidyPerNight: number;
    nights: number;
    totalSubsidy: number;
  }[];
  totalActivitySubsidies: number;
  totalAccommodationSubsidies: number;
  grandTotalSubsidies: number;
}
