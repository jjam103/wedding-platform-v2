/**
 * Vendor Service
 * 
 * Handles vendor management including CRUD operations, pricing models,
 * and payment tracking for wedding service providers.
 * 
 * Requirements: 7.1, 7.3, 7.6, 8.1, 8.3
 */

import { createClient } from '@supabase/supabase-js';
import {
  createVendorSchema,
  updateVendorSchema,
  vendorFilterSchema,
  vendorSearchSchema,
  recordPaymentSchema,
  type CreateVendorDTO,
  type UpdateVendorDTO,
  type VendorFilterDTO,
  type VendorSearchDTO,
  type RecordPaymentDTO,
  type Vendor,
  type PaginatedVendors,
  type VendorPaymentInfo,
} from '../schemas/vendorSchemas';
import { sanitizeInput } from '../utils/sanitization';

// Result type for consistent error handling
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } };

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Creates a new vendor in the system.
 * 
 * @param data - Vendor data including name, category, pricing model, and contact info
 * @returns Result containing the created vendor or error details
 * 
 * @example
 * const result = await vendorService.create({
 *   name: 'Costa Rica Photography',
 *   category: 'photography',
 *   pricingModel: 'flat_rate',
 *   baseCost: 2500,
 *   email: 'contact@crphoto.com',
 * });
 */
export async function create(data: CreateVendorDTO): Promise<Result<Vendor>> {
  try {
    // 1. Validate
    const validation = createVendorSchema.safeParse(data);
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

    // 2. Sanitize user input
    const sanitized = {
      ...validation.data,
      name: sanitizeInput(validation.data.name),
      contactName: validation.data.contactName ? sanitizeInput(validation.data.contactName) : null,
      notes: validation.data.notes ? sanitizeInput(validation.data.notes) : null,
    };

    // 3. Database operation
    const { data: vendor, error } = await supabase
      .from('vendors')
      .insert({
        name: sanitized.name,
        category: sanitized.category,
        contact_name: sanitized.contactName,
        email: sanitized.email,
        phone: sanitized.phone,
        pricing_model: sanitized.pricingModel,
        base_cost: sanitized.baseCost,
        payment_status: sanitized.paymentStatus || 'unpaid',
        amount_paid: sanitized.amountPaid || 0,
        notes: sanitized.notes,
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

    return {
      success: true,
      data: mapVendorFromDb(vendor),
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
 * Retrieves a vendor by ID.
 * 
 * @param id - Vendor UUID
 * @returns Result containing the vendor or error details
 */
export async function get(id: string): Promise<Result<Vendor>> {
  try {
    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Vendor not found',
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

    return {
      success: true,
      data: mapVendorFromDb(vendor),
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
 * Updates an existing vendor.
 * 
 * @param id - Vendor UUID
 * @param data - Partial vendor data to update
 * @returns Result containing the updated vendor or error details
 */
export async function update(id: string, data: UpdateVendorDTO): Promise<Result<Vendor>> {
  try {
    // 1. Validate
    const validation = updateVendorSchema.safeParse(data);
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

    // 2. Sanitize user input
    const sanitized: Record<string, unknown> = {};
    if (validation.data.name !== undefined) {
      sanitized.name = sanitizeInput(validation.data.name);
    }
    if (validation.data.contactName !== undefined) {
      sanitized.contact_name = validation.data.contactName ? sanitizeInput(validation.data.contactName) : null;
    }
    if (validation.data.notes !== undefined) {
      sanitized.notes = validation.data.notes ? sanitizeInput(validation.data.notes) : null;
    }
    if (validation.data.category !== undefined) {
      sanitized.category = validation.data.category;
    }
    if (validation.data.email !== undefined) {
      sanitized.email = validation.data.email;
    }
    if (validation.data.phone !== undefined) {
      sanitized.phone = validation.data.phone;
    }
    if (validation.data.pricingModel !== undefined) {
      sanitized.pricing_model = validation.data.pricingModel;
    }
    if (validation.data.baseCost !== undefined) {
      sanitized.base_cost = validation.data.baseCost;
    }
    if (validation.data.paymentStatus !== undefined) {
      sanitized.payment_status = validation.data.paymentStatus;
    }
    if (validation.data.amountPaid !== undefined) {
      sanitized.amount_paid = validation.data.amountPaid;
    }

    // 3. Database operation
    const { data: vendor, error } = await supabase
      .from('vendors')
      .update(sanitized)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Vendor not found',
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

    return {
      success: true,
      data: mapVendorFromDb(vendor),
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
 * Deletes a vendor from the system.
 * 
 * @param id - Vendor UUID
 * @returns Result indicating success or error details
 */
export async function deleteVendor(id: string): Promise<Result<void>> {
  try {
    const { error } = await supabase
      .from('vendors')
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
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Lists vendors with optional filtering and pagination.
 * 
 * @param filters - Optional filters for category, pricing model, payment status, and pagination
 * @returns Result containing paginated vendor list or error details
 */
export async function list(filters: VendorFilterDTO = {}): Promise<Result<PaginatedVendors>> {
  try {
    // Validate filters
    const validation = vendorFilterSchema.safeParse(filters);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid filters',
          details: validation.error.issues,
        },
      };
    }

    const { category, pricingModel, paymentStatus, page = 1, pageSize = 50 } = validation.data;

    // Build query
    let query = supabase.from('vendors').select('*', { count: 'exact' });

    if (category) {
      query = query.eq('category', category);
    }
    if (pricingModel) {
      query = query.eq('pricing_model', pricingModel);
    }
    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to).order('name', { ascending: true });

    const { data: vendors, error, count } = await query;

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

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      success: true,
      data: {
        vendors: vendors.map(mapVendorFromDb),
        total,
        page,
        pageSize,
        totalPages,
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
 * Searches vendors by name or contact name.
 * 
 * @param searchParams - Search query and pagination parameters
 * @returns Result containing paginated search results or error details
 */
export async function search(searchParams: VendorSearchDTO): Promise<Result<PaginatedVendors>> {
  try {
    // Validate search parameters
    const validation = vendorSearchSchema.safeParse(searchParams);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid search parameters',
          details: validation.error.issues,
        },
      };
    }

    const { query, page = 1, pageSize = 50 } = validation.data;

    // Search in name and contact_name fields
    const { data: vendors, error, count } = await supabase
      .from('vendors')
      .select('*', { count: 'exact' })
      .or(`name.ilike.%${query}%,contact_name.ilike.%${query}%`)
      .range((page - 1) * pageSize, page * pageSize - 1)
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

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      success: true,
      data: {
        vendors: vendors.map(mapVendorFromDb),
        total,
        page,
        pageSize,
        totalPages,
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
 * Records a payment for a vendor and updates payment status.
 * 
 * @param paymentData - Vendor ID, payment amount, and optional notes
 * @returns Result containing updated vendor payment info or error details
 */
export async function recordPayment(paymentData: RecordPaymentDTO): Promise<Result<VendorPaymentInfo>> {
  try {
    // 1. Validate
    const validation = recordPaymentSchema.safeParse(paymentData);
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

    const { vendorId, amount } = validation.data;

    // 2. Get current vendor
    const vendorResult = await get(vendorId);
    if (!vendorResult.success) {
      return vendorResult as Result<VendorPaymentInfo>;
    }

    const vendor = vendorResult.data;
    const newAmountPaid = vendor.amountPaid + amount;

    // Check if payment exceeds base cost (with floating point tolerance)
    if (newAmountPaid - vendor.baseCost > 0.01) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Payment amount exceeds vendor base cost',
          details: {
            baseCost: vendor.baseCost,
            currentPaid: vendor.amountPaid,
            attemptedPayment: amount,
            wouldTotal: newAmountPaid,
          },
        },
      };
    }

    // 3. Calculate new payment status
    let newPaymentStatus: 'unpaid' | 'partial' | 'paid';
    if (newAmountPaid === 0) {
      newPaymentStatus = 'unpaid';
    } else if (newAmountPaid >= vendor.baseCost) {
      newPaymentStatus = 'paid';
    } else {
      newPaymentStatus = 'partial';
    }

    // 4. Update vendor
    const updateResult = await update(vendorId, {
      amountPaid: newAmountPaid,
      paymentStatus: newPaymentStatus,
    });

    if (!updateResult.success) {
      return updateResult as Result<VendorPaymentInfo>;
    }

    const updatedVendor = updateResult.data;

    return {
      success: true,
      data: {
        vendorId: updatedVendor.id,
        vendorName: updatedVendor.name,
        baseCost: updatedVendor.baseCost,
        amountPaid: updatedVendor.amountPaid,
        balanceDue: updatedVendor.baseCost - updatedVendor.amountPaid,
        paymentStatus: updatedVendor.paymentStatus,
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
 * Gets payment information for a vendor.
 * 
 * @param vendorId - Vendor UUID
 * @returns Result containing vendor payment info or error details
 */
export async function getPaymentInfo(vendorId: string): Promise<Result<VendorPaymentInfo>> {
  try {
    const vendorResult = await get(vendorId);
    if (!vendorResult.success) {
      return vendorResult as Result<VendorPaymentInfo>;
    }

    const vendor = vendorResult.data;

    return {
      success: true,
      data: {
        vendorId: vendor.id,
        vendorName: vendor.name,
        baseCost: vendor.baseCost,
        amountPaid: vendor.amountPaid,
        balanceDue: vendor.baseCost - vendor.amountPaid,
        paymentStatus: vendor.paymentStatus,
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
 * Maps database vendor record to Vendor type.
 */
function mapVendorFromDb(dbVendor: any): Vendor {
  return {
    id: dbVendor.id,
    name: dbVendor.name,
    category: dbVendor.category,
    contactName: dbVendor.contact_name,
    email: dbVendor.email,
    phone: dbVendor.phone,
    pricingModel: dbVendor.pricing_model,
    baseCost: parseFloat(dbVendor.base_cost),
    paymentStatus: dbVendor.payment_status,
    amountPaid: parseFloat(dbVendor.amount_paid),
    notes: dbVendor.notes,
    createdAt: dbVendor.created_at,
    updatedAt: dbVendor.updated_at,
  };
}
