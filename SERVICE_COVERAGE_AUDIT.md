# Service Coverage Audit

## Services with < 90% Coverage (Missing Tests)

Based on the audit of service files vs test files, here are the services that need additional test coverage:

### Services with NO Unit Tests (CRITICAL - 0% coverage)
1. **accommodationService.ts** - No unit tests found
2. **activityService.ts** - No unit tests found  
3. **aiContentService.ts** - No unit tests found
4. **b2Service.ts** - No unit tests found
5. **budgetService.ts** - No unit tests found
6. **cleanupService.ts** - No unit tests found
7. **cronService.ts** - No unit tests found
8. **emailQueueService.ts** - No unit tests found
9. **emailService.ts** - No unit tests found
10. **eventService.ts** - No unit tests found
11. **gallerySettingsService.ts** - No unit tests found
12. **itineraryService.ts** - No unit tests found
13. **locationService.ts** - No unit tests found
14. **photoService.ts** - No unit tests found
15. **rsvpAnalyticsService.ts** - No unit tests found
16. **rsvpService.ts** - No unit tests found
17. **settingsService.ts** - No unit tests found
18. **smsService.ts** - No unit tests found
19. **transportationService.ts** - No unit tests found
20. **vendorService.ts** - No unit tests found
21. **webhookService.ts** - No unit tests found

### Services with Partial Unit Tests (Likely < 90% coverage)
1. **accessControlService.ts** - Has unit tests but may need more coverage
2. **auditLogService.ts** - Has unit tests but may need more coverage
3. **authService.ts** - Has unit tests but may need more coverage
4. **capacityReportService.ts** - Has unit tests but may need more coverage
5. **contentPagesService.ts** - Has unit tests but may need more coverage
6. **guestEngagementService.ts** - Has unit tests but may need more coverage
7. **guestService.ts** - Has unit tests but may need more coverage
8. **rsvpReminderService.ts** - Has unit tests but may need more coverage
9. **sectionsService.ts** - Has partial tests (versionHistory only)
10. **vendorBookingService.ts** - Has unit tests but may need more coverage

## Property-Based Tests Analysis

Many services have property-based tests but lack comprehensive unit tests:
- Property tests validate business rules but don't cover all service methods
- Unit tests are needed for CRUD operations, error handling, and edge cases

## Priority for Adding Tests

### CRITICAL Priority (No unit tests at all)
1. **accommodationService.ts** - Room type management, guest assignments
2. **activityService.ts** - Activity CRUD, capacity management, RSVP operations
3. **budgetService.ts** - Budget calculations, vendor tracking
4. **emailService.ts** - Email sending, template operations, delivery tracking
5. **photoService.ts** - Photo upload, moderation workflow
6. **locationService.ts** - Location hierarchy management
7. **eventService.ts** - Event management operations
8. **rsvpService.ts** - RSVP handling operations

### HIGH Priority (External integrations)
1. **b2Service.ts** - Backblaze B2 integration
2. **smsService.ts** - SMS service integration
3. **webhookService.ts** - Webhook handling
4. **emailQueueService.ts** - Email queue management

### MEDIUM Priority (Supporting services)
1. **transportationService.ts** - Transportation coordination
2. **itineraryService.ts** - Itinerary generation
3. **rsvpAnalyticsService.ts** - RSVP analytics
4. **gallerySettingsService.ts** - Photo gallery settings
5. **settingsService.ts** - Application settings
6. **aiContentService.ts** - AI content extraction
7. **cleanupService.ts** - Data cleanup operations
8. **cronService.ts** - Scheduled operations

## Detailed Untested Methods Analysis

### accommodationService.ts (CRITICAL - 0% coverage)
**Methods needing tests (18 methods)**:
- `createAccommodation()` - CRUD for accommodations
- `getAccommodation()` - Single accommodation retrieval
- `updateAccommodation()` - Accommodation updates
- `deleteAccommodation()` - Accommodation deletion
- `listAccommodations()` - Paginated listing with filters
- `searchAccommodations()` - Search by name/address/description
- `createRoomType()` - Room type creation
- `getRoomType()` - Single room type retrieval
- `updateRoomType()` - Room type updates
- `deleteRoomType()` - Room type deletion
- `listRoomTypes()` - Room types for accommodation
- `getAccommodationWithRoomTypes()` - Complex join operation
- `createRoomAssignment()` - Guest room assignments
- `getRoomAssignment()` - Single assignment retrieval
- `updateRoomAssignment()` - Assignment updates
- `deleteRoomAssignment()` - Assignment deletion
- `listGuestRoomAssignments()` - Assignments for guest
- `listRoomTypeAssignments()` - Assignments for room type
- `calculateRoomCost()` - Cost calculation with subsidies
- `getRoomTypeWithAvailability()` - Availability checking

### activityService.ts (CRITICAL - 0% coverage)
**Methods needing tests (8 methods)**:
- `create()` - Activity creation with validation/sanitization
- `get()` - Single activity retrieval
- `update()` - Activity updates with partial data
- `deleteActivity()` - Activity deletion
- `list()` - Paginated listing with complex filters
- `search()` - Search by name/description
- `getCapacityInfo()` - Capacity calculations and alerts
- `calculateNetCost()` - Cost after host subsidy

### budgetService.ts (CRITICAL - 0% coverage)
**Methods needing tests (6 methods)**:
- `calculateTotal()` - Complex budget calculations across vendors/activities/accommodations
- `getSummary()` - Dashboard budget summary
- `getPaymentStatusReport()` - Payment status across vendors
- `trackSubsidies()` - Subsidy tracking across activities/accommodations
- `generateReport()` - Comprehensive budget report

### Other Critical Services (Methods count)
- **emailService.ts** - ~8-12 methods (template management, sending, tracking)
- **photoService.ts** - ~6-10 methods (upload, moderation, gallery operations)
- **locationService.ts** - ~6-8 methods (hierarchy management, validation)
- **eventService.ts** - ~6-8 methods (event CRUD, scheduling)
- **rsvpService.ts** - ~8-10 methods (RSVP handling, status updates)

## Estimated Test Coverage Gaps

Based on the audit:
- **21 services** have NO unit tests (0% coverage)
- **10 services** have partial unit tests (estimated 30-60% coverage)
- **Target**: 90% coverage for all services
- **Current estimated overall service coverage**: ~30.5% (matches coverage report)

## Next Steps

1. Start with CRITICAL priority services (accommodationService, activityService, etc.)
2. Follow the 4-path testing pattern for each service method:
   - Success path
   - Validation error path  
   - Database error path
   - Security/sanitization path
3. Use the service method template from code conventions
4. Focus on core CRUD operations first, then business logic methods