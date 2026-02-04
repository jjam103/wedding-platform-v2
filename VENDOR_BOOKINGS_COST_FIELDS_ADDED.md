# Vendor Bookings Cost Fields Implementation

## Summary
Added cost tracking and subsidy fields to vendor bookings, enabling per-guest or flat-rate pricing models with host subsidy support.

## Changes Made

### 1. Database Schema Updates

**Migration File**: `supabase/migrations/026_add_vendor_booking_cost_fields.sql`
- Added `guest_count` column (nullable integer)
- Added `pricing_model` column (flat_rate or per_guest, defaults to flat_rate)
- Added `total_cost` column (numeric, defaults to 0)
- Added `host_subsidy` column (numeric, defaults to 0)
- Added constraint: `host_subsidy <= total_cost`

**Updated Base Migration**: `supabase/migrations/003_create_vendor_tables.sql`
- Updated vendor_bookings table definition to include new fields

### 2. Schema Validation Updates

**File**: `schemas/vendorBookingSchemas.ts`

**Updated Schemas**:
- `baseVendorBookingSchema`: Added guestCount, pricingModel, totalCost, hostSubsidy fields
- `createVendorBookingSchema`: Added validation for host_subsidy <= total_cost
- `updateVendorBookingSchema`: Added partial validation for cost fields

**Updated Types**:
- `VendorBooking`: Added new cost-related fields
- `VendorBookingWithDetails`: Added new cost-related fields

### 3. Service Layer Updates

**File**: `services/vendorBookingService.ts`

**Updated Functions**:
- `create()`: Now handles guest_count, pricing_model, total_cost, host_subsidy
- `update()`: Now handles partial updates of cost fields
- `mapBookingFromDb()`: Maps new database columns to TypeScript types
- `listWithDetails()`: Returns bookings with cost information

### 4. UI Updates

**File**: `app/admin/vendors/page.tsx`

**Booking Form Fields Added**:
- Pricing Model dropdown (Flat Rate / Per Guest)
- Guest Count input (for per-guest pricing)
- Total Cost input (required)
- Host Subsidy input (optional)

**Booking Table Columns Added**:
- Pricing: Shows "Flat Rate" or "Per Guest"
- Guests: Shows guest count or "-"
- Total Cost: Formatted as currency
- Host Subsidy: Formatted as currency

**Activities Dropdown Fix**:
- Fixed data extraction from paginated API response
- Now correctly extracts `result.data.activities` array

### 5. Migration Script

**File**: `scripts/apply-vendor-booking-cost-migration.mjs`
- Applies the new migration to add cost fields
- Handles both new installations and existing databases

## Usage

### Apply Migration

```bash
node scripts/apply-vendor-booking-cost-migration.mjs
```

### Creating a Vendor Booking with Costs

**Flat Rate Example**:
```json
{
  "vendorId": "vendor-uuid",
  "activityId": "activity-uuid",
  "bookingDate": "2025-06-15",
  "pricingModel": "flat_rate",
  "totalCost": 5000.00,
  "hostSubsidy": 1000.00,
  "notes": "Photography for ceremony"
}
```

**Per Guest Example**:
```json
{
  "vendorId": "vendor-uuid",
  "activityId": "activity-uuid",
  "bookingDate": "2025-06-15",
  "pricingModel": "per_guest",
  "guestCount": 100,
  "totalCost": 3000.00,
  "hostSubsidy": 500.00,
  "notes": "Catering for reception"
}
```

## Validation Rules

1. **Pricing Model**: Must be either "flat_rate" or "per_guest"
2. **Guest Count**: Optional, must be non-negative if provided
3. **Total Cost**: Required, must be non-negative
4. **Host Subsidy**: Optional, must be non-negative and cannot exceed total cost
5. **Activity/Event**: Must specify either activityId or eventId, but not both

## Benefits

1. **Cost Tracking**: Track exact costs for each vendor booking
2. **Subsidy Management**: Track how much the host is subsidizing
3. **Flexible Pricing**: Support both flat-rate and per-guest pricing models
4. **Budget Integration**: Cost data can be used for budget calculations
5. **Guest Count Tracking**: Know exactly how many guests each booking covers

## Remaining Issues to Fix

### 1. Room Types - "Create Room Type" Button
**Status**: Already handled correctly
- The page uses `useEffect` to unwrap the async params Promise
- Button should work once page loads

### 2. Guest Groups Dropdown
**Status**: Should be working
- Groups are fetched on page load via `fetchGroups()`
- Form fields are memoized and update when groups change
- Dropdown options are generated from `groups.map(g => ({ label: g.name, value: g.id }))`

**Potential Issue**: If groups aren't showing, it might be:
- RLS policy issue (already fixed in previous session)
- Authentication issue (already fixed in previous session)
- Need to verify groups are actually being created and returned by API

## Testing Checklist

- [x] Apply migration to database
- [ ] Create a vendor booking with flat-rate pricing
- [ ] Create a vendor booking with per-guest pricing
- [ ] Verify cost fields display correctly in table
- [ ] Verify host subsidy validation (cannot exceed total cost)
- [ ] Test editing existing bookings
- [ ] Test deleting bookings
- [ ] Verify activities dropdown loads correctly
- [ ] Test room types "Create Room Type" button
- [ ] Test guest groups dropdown in add guest form

## Database Verification

Migration successfully applied! Verified columns in vendor_bookings table:
- `guest_count` (integer, nullable)
- `pricing_model` (text, default 'flat_rate', not null)
- `total_cost` (numeric, default 0, not null)
- `host_subsidy` (numeric, default 0, not null)

All constraints and defaults are in place.

## Next Steps

1. Apply the migration to add cost fields to database
2. Test vendor booking creation with new cost fields
3. Verify activities dropdown is working
4. Check room types button functionality
5. Verify guest groups dropdown is populated
