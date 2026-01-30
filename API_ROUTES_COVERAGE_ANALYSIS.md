# API Routes Coverage Analysis

## Summary
- **Total API Routes**: 66
- **Routes with Integration Tests**: 8 (12.1%)
- **Routes without Tests**: 58 (87.9%)

## Tested API Routes (8 routes)

### Content Pages API (5 routes) ✅
- `POST /api/admin/content-pages` - Create content page
- `GET /api/admin/content-pages` - List content pages  
- `GET /api/admin/content-pages/[id]` - Get single content page
- `PUT /api/admin/content-pages/[id]` - Update content page
- `DELETE /api/admin/content-pages/[id]` - Delete content page

### Home Page API (2 routes) ✅
- `GET /api/admin/home-page` - Get home page config
- `PUT /api/admin/home-page` - Update home page config
- `GET /api/admin/home-page/sections` - Get home page sections

### API Helpers (1 route) ✅
- Generic API route testing via `apiRoutes.integration.test.ts`

## Untested API Routes by Priority (58 routes)

### 🚨 CRITICAL PRIORITY - Authentication & Core Features (8 routes)
**Impact**: High - Core functionality, security-critical

1. `POST /api/auth/create-user` - User registration
2. `POST /api/auth/logout` - User logout
3. `GET /api/admin/guests` - List guests
4. `POST /api/admin/guests` - Create guest
5. `GET /api/admin/guests/[id]` - Get guest details
6. `PUT /api/admin/guests/[id]` - Update guest
7. `DELETE /api/admin/guests/[id]` - Delete guest
8. `POST /api/guest/rsvp` - Submit RSVP

### 🔥 HIGH PRIORITY - Core Admin Features (12 routes)
**Impact**: High - Primary admin functionality

9. `GET /api/admin/activities` - List activities
10. `POST /api/admin/activities` - Create activity
11. `GET /api/admin/activities/[id]` - Get activity details
12. `PUT /api/admin/activities/[id]` - Update activity
13. `DELETE /api/admin/activities/[id]` - Delete activity
14. `GET /api/admin/activities/[id]/capacity` - Get activity capacity
15. `GET /api/admin/events` - List events
16. `POST /api/admin/events` - Create event
17. `GET /api/admin/events/[id]` - Get event details
18. `PUT /api/admin/events/[id]` - Update event
19. `DELETE /api/admin/events/[id]` - Delete event
20. `GET /api/admin/rsvps` - List RSVPs

### ⚠️ MEDIUM PRIORITY - Secondary Admin Features (18 routes)
**Impact**: Medium - Important but not core functionality

21. `GET /api/admin/accommodations` - List accommodations
22. `POST /api/admin/accommodations` - Create accommodation
23. `GET /api/admin/accommodations/[id]` - Get accommodation details
24. `PUT /api/admin/accommodations/[id]` - Update accommodation
25. `DELETE /api/admin/accommodations/[id]` - Delete accommodation
26. `GET /api/admin/accommodations/[id]/room-types` - List room types
27. `GET /api/admin/room-types` - List all room types
28. `POST /api/admin/room-types` - Create room type
29. `GET /api/admin/room-types/[id]` - Get room type details
30. `PUT /api/admin/room-types/[id]` - Update room type
31. `DELETE /api/admin/room-types/[id]` - Delete room type
32. `GET /api/admin/room-types/[id]/sections` - Get room type sections
33. `GET /api/admin/locations` - List locations
34. `POST /api/admin/locations` - Create location
35. `GET /api/admin/locations/[id]` - Get location details
36. `PUT /api/admin/locations/[id]` - Update location
37. `DELETE /api/admin/locations/[id]` - Delete location
38. `POST /api/admin/locations/[id]/validate-parent` - Validate parent location

### 📊 MEDIUM PRIORITY - Analytics & Reporting (5 routes)
**Impact**: Medium - Business intelligence features

39. `GET /api/admin/rsvp-analytics` - RSVP analytics data
40. `GET /api/admin/budget/breakdown` - Budget breakdown
41. `GET /api/admin/budget/subsidies` - Budget subsidies
42. `GET /api/admin/budget/payment-status` - Payment status
43. `GET /api/admin/metrics` - System metrics

### 📧 MEDIUM PRIORITY - Communication Features (4 routes)
**Impact**: Medium - Email and notification features

44. `GET /api/admin/emails` - List emails
45. `POST /api/admin/emails` - Create email
46. `GET /api/admin/emails/templates` - Email templates
47. `POST /api/admin/emails/send` - Send email

### 🖼️ LOW PRIORITY - Photo Management (5 routes)
**Impact**: Low - Photo features are secondary

48. `GET /api/admin/photos` - List photos
49. `POST /api/admin/photos` - Upload photo
50. `GET /api/admin/photos/[id]` - Get photo details
51. `PUT /api/admin/photos/[id]` - Update photo
52. `DELETE /api/admin/photos/[id]` - Delete photo
53. `GET /api/admin/photos/pending-count` - Pending photos count
54. `POST /api/admin/photos/[id]/moderate` - Moderate photo
55. `POST /api/guest/photos/upload` - Guest photo upload

### 🔧 LOW PRIORITY - Utility & Support Features (6 routes)
**Impact**: Low - Supporting functionality

56. `GET /api/admin/vendors` - List vendors
57. `POST /api/admin/vendors` - Create vendor
58. `GET /api/admin/vendors/[id]` - Get vendor details
59. `PUT /api/admin/vendors/[id]` - Update vendor
60. `DELETE /api/admin/vendors/[id]` - Delete vendor
61. `GET /api/admin/settings` - Get settings
62. `PUT /api/admin/settings` - Update settings
63. `GET /api/admin/audit-logs` - List audit logs
64. `GET /api/admin/audit-logs/export` - Export audit logs
65. `GET /api/admin/alerts` - List alerts
66. `POST /api/webhooks/resend` - Resend webhook

## Coverage Gaps by Category

### Authentication Routes: 0/2 tested (0%)
- Missing core auth functionality tests
- Security-critical endpoints untested

### Guest Management: 0/3 tested (0%)
- Core guest CRUD operations untested
- RSVP functionality untested

### Activity Management: 0/6 tested (0%)
- Activity CRUD operations untested
- Capacity management untested

### Event Management: 0/5 tested (0%)
- Event CRUD operations untested
- Event scheduling untested

### Accommodation Management: 0/8 tested (0%)
- Accommodation and room type management untested
- Location hierarchy untested

### Analytics & Reporting: 0/5 tested (0%)
- Business intelligence features untested
- Budget tracking untested

### Communication: 0/4 tested (0%)
- Email system untested
- Notification features untested

### Photo Management: 0/8 tested (0%)
- Photo upload and moderation untested
- Gallery features untested

### Utility Features: 0/6 tested (0%)
- Vendor management untested
- System settings untested
- Audit logging untested

## Recommended Testing Priority Order

### Phase 1: Critical Security & Core Features (8 routes)
1. Authentication routes (create-user, logout)
2. Guest management CRUD
3. RSVP submission

### Phase 2: Primary Admin Features (12 routes)
1. Activity management CRUD + capacity
2. Event management CRUD
3. RSVP listing

### Phase 3: Secondary Admin Features (18 routes)
1. Accommodation and room type management
2. Location management and validation

### Phase 4: Analytics & Communication (9 routes)
1. RSVP analytics and budget reporting
2. Email system and templates

### Phase 5: Supporting Features (11 routes)
1. Photo management and moderation
2. Vendor management and settings
3. Audit logs and system utilities

## Test Implementation Strategy

### Pattern for Each Route
```typescript
describe('POST /api/admin/resource', () => {
  it('should return 401 when not authenticated', async () => {});
  it('should return 400 when validation fails', async () => {});
  it('should return 201 when successful', async () => {});
  it('should return 500 when database error', async () => {});
});
```

### Mock Pattern (Avoid Worker Crashes)
```typescript
// Mock the service layer
jest.mock('@/services/resourceService', () => ({
  create: jest.fn(),
  list: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}));

// Import route handler directly
import { POST } from '@/app/api/admin/resource/route';
```

### Coverage Target
- **Current**: 12.1% (8/66 routes)
- **Target**: 85% (56/66 routes)
- **Routes to Add**: 48 routes
- **Estimated Effort**: 24-36 hours (30-45 minutes per route)

## Files to Create

### Integration Test Files Needed
- `__tests__/integration/authApi.integration.test.ts` (2 routes)
- `__tests__/integration/guestsApi.integration.test.ts` (3 routes)
- `__tests__/integration/activitiesApi.integration.test.ts` (6 routes)
- `__tests__/integration/eventsApi.integration.test.ts` (5 routes)
- `__tests__/integration/accommodationsApi.integration.test.ts` (8 routes)
- `__tests__/integration/analyticsApi.integration.test.ts` (5 routes)
- `__tests__/integration/emailsApi.integration.test.ts` (4 routes)
- `__tests__/integration/photosApi.integration.test.ts` (8 routes)
- `__tests__/integration/vendorsApi.integration.test.ts` (5 routes)
- `__tests__/integration/systemApi.integration.test.ts` (6 routes)

Total: 10 new integration test files covering 52 additional routes.