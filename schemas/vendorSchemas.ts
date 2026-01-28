import { z } from 'zod';

/**
 * Schema for creating a new vendor.
 * All required fields must be provided.
 */
export const createVendorSchema = z.object({
  name: z.string().trim().min(1, 'Vendor name is required').max(100, 'Vendor name must be 100 characters or less').refine(
    (val) => val.length > 0 && val.trim().length > 0,
    { message: 'Vendor name cannot be only whitespace' }
  ),
  category: z.enum(['photography', 'flowers', 'catering', 'music', 'transportation', 'decoration', 'other'], {
    errorMap: () => ({ message: 'Category must be one of: photography, flowers, catering, music, transportation, decoration, other' }),
  }),
  contactName: z.string().max(100, 'Contact name must be 100 characters or less').nullable().optional(),
  email: z.string().email('Invalid email format').nullable().optional(),
  phone: z.string().max(20, 'Phone number must be 20 characters or less').nullable().optional(),
  pricingModel: z.enum(['flat_rate', 'per_guest', 'tiered'], {
    errorMap: () => ({ message: 'Pricing model must be flat_rate, per_guest, or tiered' }),
  }),
  baseCost: z.number().nonnegative('Base cost must be non-negative'),
  paymentStatus: z.enum(['unpaid', 'partial', 'paid']).optional(),
  amountPaid: z.number().nonnegative('Amount paid must be non-negative').optional(),
  notes: z.string().max(2000, 'Notes must be 2000 characters or less').nullable().optional(),
});

/**
 * Schema for updating an existing vendor.
 * All fields are optional for partial updates.
 */
export const updateVendorSchema = createVendorSchema.partial();

/**
 * Schema for vendor list filters.
 */
export const vendorFilterSchema = z.object({
  category: z.enum(['photography', 'flowers', 'catering', 'music', 'transportation', 'decoration', 'other']).optional(),
  pricingModel: z.enum(['flat_rate', 'per_guest', 'tiered']).optional(),
  paymentStatus: z.enum(['unpaid', 'partial', 'paid']).optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
});

/**
 * Schema for vendor search.
 */
export const vendorSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
});

/**
 * Schema for recording a payment.
 */
export const recordPaymentSchema = z.object({
  vendorId: z.string().uuid('Invalid vendor ID format'),
  amount: z.number().positive('Payment amount must be positive'),
  notes: z.string().max(500, 'Payment notes must be 500 characters or less').nullable().optional(),
});

/**
 * Type definitions derived from schemas.
 */
export type CreateVendorDTO = z.infer<typeof createVendorSchema>;
export type UpdateVendorDTO = z.infer<typeof updateVendorSchema>;
export type VendorFilterDTO = z.infer<typeof vendorFilterSchema>;
export type VendorSearchDTO = z.infer<typeof vendorSearchSchema>;
export type RecordPaymentDTO = z.infer<typeof recordPaymentSchema>;

/**
 * Vendor entity type matching database structure.
 */
export interface Vendor {
  id: string;
  name: string;
  category: 'photography' | 'flowers' | 'catering' | 'music' | 'transportation' | 'decoration' | 'other';
  contactName: string | null;
  email: string | null;
  phone: string | null;
  pricingModel: 'flat_rate' | 'per_guest' | 'tiered';
  baseCost: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  amountPaid: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Paginated vendor list response.
 */
export interface PaginatedVendors {
  vendors: Vendor[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Vendor payment information.
 */
export interface VendorPaymentInfo {
  vendorId: string;
  vendorName: string;
  baseCost: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
}
