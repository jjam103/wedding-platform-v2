# TypeScript Errors Fix Plan

## Error Summary
Total errors: ~400+ across test files

## Error Categories

### Category A: Mock Return Type Errors (~200 errors)
**Pattern**: `Argument of type '{ data: ...; error: null; }' is not assignable to parameter of type 'never'`

**Files affected**:
- services/eventService.test.ts
- services/rsvpService.test.ts
- services/locationService.test.ts
- services/photoService.test.ts
- services/itineraryService.test.ts
- services/transportationService.test.ts
- services/settingsService.test.ts
- services/guestService.test.ts

**Root cause**: Mock functions are typed as `jest.fn()` without proper return type, causing TypeScript to infer `never` type.

**Fix**: Add proper typing to mock functions:
```typescript
// Before
mockSupabase.from.mockReturnValue({ select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: ..., error: null }) }) });

// After
(mockSupabase.from as jest.Mock).mockReturnValue({ 
  select: jest.fn().mockReturnValue({ 
    single: jest.fn().mockResolvedValue({ data: ..., error: null }) 
  }) 
});
```

### Category B: Property Name Mismatches (~50 errors)
**Pattern**: Using snake_case database field names instead of camelCase TypeScript property names

**Files affected**:
- services/guestService.authMethodValidation.property.test.ts
- utils/referenceChecking.test.ts
- utils/referenceChecking.property.test.ts

**Examples**:
- `auth_method` → `authMethod`
- `event_id` → `eventId`
- `first_name` → `firstName`

**Fix**: Update test code to use camelCase property names matching TypeScript types.

### Category C: Missing Required Properties (~30 errors)
**Pattern**: Objects missing required properties when creating test data

**Files affected**:
- services/guestService.test.ts (missing `authMethod`)
- services/gallerySettingsService.test.ts (missing `show_captions`)
- services/vendorBookingService.test.ts (missing `hostSubsidy`, `pricingModel`, `baseCost`)
- utils/referenceChecking.test.ts (missing `columns`)

**Fix**: Add missing required properties to test objects.

### Category D: Type String vs Literal Union (~20 errors)
**Pattern**: `Type 'string' is not assignable to type '"adult" | "child" | "senior"'`

**Files affected**:
- services/guestService.authMethodValidation.property.test.ts
- services/sectionsService.circularReferenceDetection.property.test.ts
- services/sectionsService.referenceExistenceValidation.property.test.ts
- services/settingsService.authMethodInheritance.property.test.ts

**Fix**: Use type assertions or proper literal types:
```typescript
// Before
ageType: string

// After
ageType: 'adult' as const
// or
ageType: 'adult' as 'adult' | 'child' | 'senior'
```

### Category E: Property-Based Test Async Issues (~30 errors)
**Pattern**: `Type 'Promise<void>' is not assignable to type 'boolean | void'`

**Files affected**:
- services/guestService.authMethodValidation.property.test.ts
- services/settingsService.authMethodInheritance.property.test.ts
- services/guestDataRoundTrip.property.test.ts

**Fix**: Use `fc.asyncProperty` instead of `fc.property` for async tests:
```typescript
// Before
fc.assert(fc.property(arbitrary, async (data) => { ... }));

// After
fc.assert(fc.asyncProperty(arbitrary, async (data) => { ... }));
```

### Category F: Readonly Array Issues (~10 errors)
**Pattern**: `The type 'readonly [...]' is 'readonly' and cannot be assigned to the mutable type 'string[]'`

**Files affected**:
- utils/fileValidation.test.ts

**Fix**: Use `as const` assertion or type cast:
```typescript
// Before
const formats: string[] = ALLOWED_IMAGE_FORMATS;

// After
const formats = [...ALLOWED_IMAGE_FORMATS];
// or
const formats: readonly string[] = ALLOWED_IMAGE_FORMATS;
```

### Category G: Wrong Property Names (~20 errors)
**Pattern**: Using `date` instead of `startDate`, `event_id` instead of `eventId`

**Files affected**:
- services/softDelete.test.ts
- services/softDeleteFiltering.property.test.ts
- services/softDeleteRestoration.property.test.ts
- utils/referenceChecking.test.ts

**Fix**: Update property names to match schema:
```typescript
// Before
{ date: '2024-01-01', event_id: 'abc' }

// After
{ startDate: '2024-01-01', eventId: 'abc' }
```

### Category H: Method Name Errors (~10 errors)
**Pattern**: `Property 'updateSettings' does not exist. Did you mean 'updateSetting'?`

**Files affected**:
- services/settingsService.test.ts

**Fix**: Use correct method name `updateSetting` instead of `updateSettings`.

### Category I: Miscellaneous (~30 errors)
- Duplicate object properties (rsvpReminderService.test.ts)
- Property access on unknown types (transportationService.test.ts)
- Union type property access (settingsService.homePageUpsert.property.test.ts)
- Missing query parameter (vendorService.test.ts)
- Data property access on Result type (externalServiceGracefulDegradation.test.ts)

## Fix Order
1. Category A: Mock Return Type Errors (bulk fix with regex)
2. Category B: Property Name Mismatches (straightforward replacements)
3. Category C: Missing Required Properties (add missing fields)
4. Category D: Type String vs Literal Union (type assertions)
5. Category E: Property-Based Test Async Issues (fc.asyncProperty)
6. Category F: Readonly Array Issues (spread operator)
7. Category G: Wrong Property Names (rename properties)
8. Category H: Method Name Errors (rename method calls)
9. Category I: Miscellaneous (case-by-case fixes)

## Verification Steps
1. Run `npx tsc --noEmit` after each category
2. Track error count reduction
3. Run `npm test` to ensure tests still pass
4. Document all changes made
