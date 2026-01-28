# Regression Testing Suite

## Overview

This directory contains comprehensive regression tests to prevent regressions across all critical functional areas of the Destination Wedding Management Platform.

## Test Suites

### 1. Authentication Flows (`authentication.regression.test.ts`)

Tests authentication and authorization to prevent regressions in:
- Login with email/password
- Magic link authentication
- Session management
- Role-based access control
- Session expiration handling
- Session security

**Coverage**: Requirements 21.1, 21.2

**Key Tests**:
- Valid credential authentication
- Invalid credential rejection
- Magic link sending
- Session retrieval
- Role-based permissions (super_admin, host, guest)
- Concurrent session handling

### 2. Data Service Operations (`dataServices.regression.test.ts`)

Tests CRUD operations across all data services to prevent regressions in:
- Guest management
- Event management
- Activity management
- RSVP management
- Vendor management
- Accommodation management

**Coverage**: Requirements 21.1, 21.2

**Key Tests**:
- Create, read, update, delete operations
- List with pagination
- Search functionality
- Scheduling conflict detection
- Required field validation
- Data integrity
- Concurrent updates
- Error handling

### 3. Financial Calculations (`financialCalculations.regression.test.ts`)

Tests financial calculation accuracy to prevent regressions in:
- Budget total calculations
- Payment balance updates
- Vendor cost calculations
- Accommodation cost calculations
- Activity cost calculations
- Subsidy calculations

**Coverage**: Requirements 21.4

**Key Tests**:
- Budget totals with vendors, activities, accommodations
- Per-guest vendor pricing
- Payment status updates (unpaid → partial → paid)
- Room cost calculations with subsidies
- Activity cost calculations
- Decimal precision handling
- Rounding error prevention

### 4. RSVP Capacity Management (`rsvpCapacity.regression.test.ts`)

Tests RSVP capacity tracking and alerts to prevent regressions in:
- Capacity calculations
- Capacity limit enforcement
- Alert generation at thresholds
- Real-time capacity updates

**Coverage**: Requirements 21.4

**Key Tests**:
- Current capacity calculations
- Activities without capacity limits
- Alert generation at 90% and 100% capacity
- Over-capacity handling
- Capacity limit enforcement
- Real-time updates on RSVP changes
- Guest count changes
- Multiple activity tracking

### 5. Photo Storage Failover (`photoStorage.regression.test.ts`)

Tests photo storage failover mechanisms to prevent regressions in:
- B2 storage health checks
- Automatic failover to Supabase
- URL consistency
- Storage type tracking
- Fallback recovery

**Coverage**: Requirements 21.4

**Key Tests**:
- B2 health detection
- Automatic failover when B2 unavailable
- Retry logic for transient failures
- CDN URL usage for B2
- Supabase URL usage for fallback
- Storage type tracking in database
- Recovery to B2 when healthy
- Both storage systems failing

### 6. Email Delivery (`emailDelivery.regression.test.ts`)

Tests email delivery system to prevent regressions in:
- Email template validation
- Variable substitution
- Bulk email sending
- Delivery tracking
- SMS fallback
- Webhook processing

**Coverage**: Requirements 21.4

**Key Tests**:
- Template syntax validation
- Variable substitution
- HTML escaping in variables
- Single and bulk email sending
- Email service failure handling
- Partial failures in bulk send
- Rate limiting
- Delivery status logging
- Webhook processing
- SMS fallback on email failure
- Email scheduling

### 7. Dynamic Route Resolution (`dynamicRoutes.regression.test.ts`)

Tests dynamic route resolution to prevent regressions in:
- Content page routing
- Activity page routing
- Event page routing
- Accommodation page routing
- 404 handling
- Slug generation

**Coverage**: Requirements 21.7

**Key Tests**:
- Custom page resolution by slug
- Activity/event/accommodation resolution by ID
- 404 for non-existent resources
- Published-only filtering
- Visibility restrictions
- Slug generation from titles
- Special character handling
- Unique slug generation
- Route parameter validation
- Nested route resolution
- Cache handling

### 8. UI Components (`uiComponents.regression.test.tsx`)

Tests UI component rendering to prevent regressions in:
- TropicalIcon rendering
- Pura Vida thematic elements
- Costa Rica branding
- Responsive design
- Accessibility

**Coverage**: Requirements 21.6

**Key Tests**:
- All tropical icon variants (palm, wave, sun, flower, bird, volcano, beach, pura-vida)
- Icon size classes (sm, md, lg, xl)
- Animation support
- PuraVidaBanner variants (header, footer, inline)
- CostaRicaHeader rendering
- CostaRicaFooter rendering
- Costa Rica theme consistency
- Responsive text classes
- ARIA labels for accessibility
- Semantic HTML structure

### 9. Performance Monitoring (`performance.regression.test.ts`)

Tests performance benchmarks to prevent regressions in:
- Guest Portal page load times
- Admin Dashboard (Logistics) performance
- Database query performance
- API response times
- Bulk operation performance

**Coverage**: Requirements 21.8

**Key Tests**:
- Guest dashboard load < 200ms
- Itinerary load < 150ms
- RSVP submission < 100ms
- Logistics dashboard load < 300ms
- Capacity metrics calculation < 100ms
- Transportation manifest generation < 200ms
- Simple SELECT < 50ms
- Paginated query < 100ms
- Filtered query < 75ms
- GET request < 200ms
- POST request < 150ms
- PUT request < 150ms
- DELETE request < 100ms
- Bulk creation < 500ms
- Bulk update < 400ms
- CSV export < 300ms
- Memory leak prevention
- Performance consistency under load

## Running Regression Tests

### Run all regression tests:
```bash
npm run test:regression
```

### Run specific regression test suite:
```bash
npm test -- __tests__/regression/authentication.regression.test.ts
npm test -- __tests__/regression/dataServices.regression.test.ts
npm test -- __tests__/regression/financialCalculations.regression.test.ts
npm test -- __tests__/regression/rsvpCapacity.regression.test.ts
npm test -- __tests__/regression/photoStorage.regression.test.ts
npm test -- __tests__/regression/emailDelivery.regression.test.ts
npm test -- __tests__/regression/dynamicRoutes.regression.test.ts
npm test -- __tests__/regression/uiComponents.regression.test.tsx
npm test -- __tests__/regression/performance.regression.test.ts
```

### Run with coverage:
```bash
npm run test:regression -- --coverage
```

## CI/CD Integration

Regression tests run automatically on:
- Every pull request
- Before deployment to staging
- Before deployment to production
- Nightly builds

## Performance Benchmarks

The performance regression tests enforce these benchmarks:

| Operation | Target | Critical |
|-----------|--------|----------|
| Guest Dashboard Load | < 200ms | < 300ms |
| Itinerary Load | < 150ms | < 250ms |
| RSVP Submission | < 100ms | < 200ms |
| Logistics Dashboard | < 300ms | < 500ms |
| Simple DB Query | < 50ms | < 100ms |
| API GET Request | < 200ms | < 400ms |
| API POST Request | < 150ms | < 300ms |
| Bulk Operations (50 items) | < 500ms | < 1000ms |
| CSV Export (100 items) | < 300ms | < 600ms |

## Failure Handling

When regression tests fail:

1. **Identify the regression**: Check which test failed and what changed
2. **Assess impact**: Determine if it's a breaking change or acceptable degradation
3. **Fix or update**: Either fix the regression or update the test if requirements changed
4. **Document**: Update CHANGELOG.md with any intentional changes

## Maintenance

### Adding New Regression Tests

When adding new features:
1. Add regression tests to the appropriate suite
2. Follow existing test patterns
3. Use descriptive test names
4. Include requirements references
5. Update this README

### Updating Benchmarks

Performance benchmarks should be reviewed quarterly:
1. Run performance tests on production-like environment
2. Analyze trends over time
3. Adjust benchmarks if infrastructure changes
4. Document changes in CHANGELOG.md

## Related Documentation

- [Testing Standards](../../.kiro/steering/testing-standards.md)
- [Code Conventions](../../.kiro/steering/code-conventions.md)
- [Requirements](../../.kiro/specs/destination-wedding-platform/requirements.md)
- [Design](../../.kiro/specs/destination-wedding-platform/design.md)
