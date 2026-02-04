# Developer Documentation - Costa Rica Wedding Management System

**Version**: 1.0
**Last Updated**: February 2, 2026
**Audience**: Developers, DevOps Engineers

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [API Endpoints](#api-endpoints)
5. [Database Schema](#database-schema)
6. [Testing Strategy](#testing-strategy)
7. [Deployment Process](#deployment-process)
8. [Development Workflow](#development-workflow)
9. [Security Considerations](#security-considerations)
10. [Performance Optimization](#performance-optimization)

---

## Architecture Overview

### System Architecture

The Costa Rica Wedding Management System is a full-stack Next.js application with the following architecture:

**Frontend**:
- Next.js 16 App Router with React Server Components
- React 19 with concurrent features
- Tailwind CSS 4 for styling
- TypeScript 5 for type safety

**Backend**:
- Next.js API Routes for server-side endpoints
- Supabase for PostgreSQL database and authentication
- Row Level Security (RLS) for data access control

**External Services**:
- Resend for email delivery
- Backblaze B2 for photo storage
- Google Gemini for AI content extraction
- Supabase Storage for file storage

### Design Patterns

**Service Layer Pattern**:
- Business logic centralized in `services/`
- Consistent error handling with `Result<T>` pattern
- Type-safe data contracts with Zod validation

**Component Organization**:
- Server Components by default
- Client Components only when needed (hooks, events, browser APIs)
- Reusable UI components in `components/ui/`
- Feature-specific components in `components/admin/` and `components/guest/`

**Error Handling**:
- Comprehensive error boundaries
- Structured error logging
- User-friendly error messages
- Graceful degradation

---

## Technology Stack

### Core Technologies

**Frontend**:
- Next.js 16.1.1 - App Router with RSC
- React 19.2.3 - Latest React features
- TypeScript 5 - Strict mode enabled
- Tailwind CSS 4 - Utility-first styling

**Backend**:
- Next.js API Routes - Server-side endpoints
- Supabase - PostgreSQL + Auth + Storage
- Node.js 18+ - Runtime environment

**Development Tools**:
- SWC Compiler - Fast Rust-based compilation
- ESLint 9 - Code linting
- Jest 29 - Unit and integration testing
- Playwright - E2E testing
- fast-check - Property-based testing

### Dependencies

See `package.json` for complete dependency list.

**Key Dependencies**:
- `@supabase/supabase-js` - Supabase client
- `zod` - Schema validation
- `isomorphic-dompurify` - XSS prevention
- `@lexical/react` - Rich text editor
- `react-hook-form` - Form management
- `date-fns` - Date manipulation

---

## Project Structure

```
wedding-project/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin pages
│   ├── guest/             # Guest pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── [type]/[slug]/     # Dynamic content pages
├── components/            # React components
│   ├── admin/             # Admin components
│   ├── guest/             # Guest components
│   ├── ui/                # Reusable UI components
│   └── providers/         # Context providers
├── services/              # Business logic (17 services)
├── lib/                   # Configuration and utilities
├── hooks/                 # Custom React hooks
├── utils/                 # Helper functions
├── types/                 # TypeScript definitions
├── schemas/               # Zod validation schemas
├── __tests__/             # Test files
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   ├── e2e/               # E2E tests
│   ├── property/          # Property-based tests
│   ├── regression/        # Regression tests
│   └── helpers/           # Test utilities
├── supabase/              # Database migrations
├── public/                # Static assets
└── docs/                  # Documentation
```

### Key Directories

**`app/`**: Next.js App Router structure
- File-based routing
- Server Components by default
- API routes in `app/api/`

**`services/`**: Business logic layer
- 17 service modules
- Consistent `Result<T>` pattern
- Zod validation
- DOMPurify sanitization

**`components/`**: React components
- Admin-specific in `components/admin/`
- Guest-specific in `components/guest/`
- Reusable UI in `components/ui/`

**`__tests__/`**: Comprehensive test suite
- 1000+ test cases
- 80%+ code coverage
- Multiple test types


---

## API Endpoints

### Authentication Endpoints

**Guest Authentication**:
- `POST /api/auth/guest/email-match` - Email matching authentication
- `POST /api/auth/guest/magic-link` - Request magic link
- `GET /api/auth/guest/magic-link/verify` - Verify magic link token

**Admin Authentication**:
- Handled by Supabase Auth
- Standard email/password authentication

### Admin API Endpoints

**Guests**:
- `GET /api/admin/guests` - List guests
- `POST /api/admin/guests` - Create guest
- `GET /api/admin/guests/[id]` - Get guest
- `PUT /api/admin/guests/[id]` - Update guest
- `DELETE /api/admin/guests/[id]` - Delete guest
- `POST /api/admin/guests/bulk-auth-method` - Bulk update auth method

**Guest Groups**:
- `GET /api/admin/guest-groups` - List groups
- `POST /api/admin/guest-groups` - Create group
- `PUT /api/admin/guest-groups/[id]` - Update group
- `DELETE /api/admin/guest-groups/[id]` - Delete group

**Events**:
- `GET /api/admin/events` - List events
- `POST /api/admin/events` - Create event
- `GET /api/admin/events/[id]` - Get event
- `PUT /api/admin/events/[id]` - Update event
- `DELETE /api/admin/events/[id]` - Delete event

**Activities**:
- `GET /api/admin/activities` - List activities
- `POST /api/admin/activities` - Create activity
- `GET /api/admin/activities/[id]` - Get activity
- `PUT /api/admin/activities/[id]` - Update activity
- `DELETE /api/admin/activities/[id]` - Delete activity
- `GET /api/admin/activities/[id]/capacity` - Get capacity info

**RSVPs**:
- `GET /api/admin/guests/[id]/rsvps` - Get guest RSVPs
- `PUT /api/admin/guests/[id]/rsvps/[rsvpId]` - Update RSVP

**Content Pages**:
- `GET /api/admin/content-pages` - List pages
- `POST /api/admin/content-pages` - Create page
- `GET /api/admin/content-pages/[id]` - Get page
- `PUT /api/admin/content-pages/[id]` - Update page
- `DELETE /api/admin/content-pages/[id]` - Delete page

**Sections**:
- `GET /api/admin/sections` - List sections
- `POST /api/admin/sections` - Create section
- `PUT /api/admin/sections/[id]` - Update section
- `DELETE /api/admin/sections/[id]` - Delete section

**Photos**:
- `GET /api/admin/photos` - List photos
- `POST /api/admin/photos` - Upload photo
- `PUT /api/admin/photos/[id]` - Update photo
- `DELETE /api/admin/photos/[id]` - Delete photo
- `PUT /api/admin/photos/[id]/moderate` - Moderate photo

**Admin Users**:
- `GET /api/admin/admin-users` - List admin users
- `POST /api/admin/admin-users` - Create admin user
- `PUT /api/admin/admin-users/[id]` - Update admin user
- `DELETE /api/admin/admin-users/[id]` - Delete admin user
- `POST /api/admin/admin-users/[id]/deactivate` - Deactivate user

**Email**:
- `GET /api/admin/emails` - List email history
- `POST /api/admin/emails` - Send email
- `GET /api/admin/emails/templates` - List templates
- `POST /api/admin/emails/templates` - Create template
- `PUT /api/admin/emails/templates/[id]` - Update template

**Analytics**:
- `GET /api/admin/rsvp-analytics` - Get RSVP analytics
- `GET /api/admin/audit-logs` - Get audit logs

### Guest API Endpoints

**Profile**:
- `GET /api/guest/profile` - Get guest profile
- `PUT /api/guest/profile` - Update profile

**Family**:
- `GET /api/guest/family` - Get family members
- `PUT /api/guest/family/[id]` - Update family member

**Events**:
- `GET /api/guest/events` - List events
- `GET /api/guest/events/[slug]` - Get event by slug

**Activities**:
- `GET /api/guest/activities` - List activities
- `GET /api/guest/activities/[slug]` - Get activity by slug

**RSVPs**:
- `GET /api/guest/rsvps` - Get guest RSVPs
- `POST /api/guest/rsvps` - Submit RSVP
- `PUT /api/guest/rsvps/[id]` - Update RSVP

**Itinerary**:
- `GET /api/guest/itinerary` - Get personalized itinerary
- `GET /api/guest/itinerary/pdf` - Export itinerary as PDF

**Content**:
- `GET /api/guest/content-pages` - List published pages
- `GET /api/guest/content-pages/[slug]` - Get page by slug

### API Response Format

All API endpoints return consistent response format:

**Success Response**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

### Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict (duplicate, capacity exceeded)
- `DATABASE_ERROR` - Database operation failed
- `EXTERNAL_SERVICE_ERROR` - External service unavailable
- `UNKNOWN_ERROR` - Unexpected error

### HTTP Status Codes

- `200` - Success (GET, PUT)
- `201` - Created (POST)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error
- `502/503` - External Service Error

---

## Database Schema

### Core Tables

**guests**:
- `id` (UUID, PK)
- `first_name` (TEXT)
- `last_name` (TEXT)
- `email` (TEXT, nullable)
- `group_id` (UUID, FK → guest_groups)
- `age_type` (ENUM: adult, child, senior)
- `guest_type` (ENUM: wedding_party, wedding_guest, etc.)
- `auth_method` (ENUM: email_matching, magic_link)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**guest_groups**:
- `id` (UUID, PK)
- `name` (TEXT)
- `owner_id` (UUID, FK → guests, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**events**:
- `id` (UUID, PK)
- `name` (TEXT)
- `slug` (TEXT, UNIQUE)
- `date` (DATE)
- `time` (TIME)
- `location_id` (UUID, FK → locations)
- `description` (TEXT)
- `capacity` (INTEGER, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**activities**:
- `id` (UUID, PK)
- `name` (TEXT)
- `slug` (TEXT, UNIQUE)
- `event_id` (UUID, FK → events)
- `date` (DATE)
- `time` (TIME)
- `location_id` (UUID, FK → locations)
- `capacity` (INTEGER)
- `cost_per_person` (DECIMAL)
- `host_subsidy` (DECIMAL)
- `adults_only` (BOOLEAN)
- `plus_ones_allowed` (BOOLEAN)
- `activity_type` (TEXT)
- `description` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**rsvps**:
- `id` (UUID, PK)
- `guest_id` (UUID, FK → guests)
- `entity_type` (ENUM: event, activity, accommodation)
- `entity_id` (UUID)
- `status` (ENUM: pending, attending, maybe, declined)
- `guest_count` (INTEGER)
- `dietary_restrictions` (TEXT)
- `special_requirements` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**content_pages**:
- `id` (UUID, PK)
- `title` (TEXT)
- `slug` (TEXT, UNIQUE)
- `page_type` (ENUM: info, activity, accommodation, transportation)
- `status` (ENUM: draft, published)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**sections**:
- `id` (UUID, PK)
- `page_id` (UUID, FK → content_pages)
- `section_type` (TEXT)
- `column_layout` (ENUM: single, two_column)
- `content_left` (JSONB)
- `content_right` (JSONB, nullable)
- `order_index` (INTEGER)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**photos**:
- `id` (UUID, PK)
- `photo_url` (TEXT)
- `storage_type` (ENUM: b2, supabase)
- `caption` (TEXT)
- `alt_text` (TEXT)
- `attribution` (TEXT)
- `uploader_id` (UUID, FK → guests or admin_users)
- `moderation_status` (ENUM: pending, approved, rejected)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**admin_users**:
- `id` (UUID, PK)
- `email` (TEXT, UNIQUE)
- `role` (ENUM: admin, owner)
- `status` (ENUM: active, inactive)
- `invited_by` (UUID, FK → admin_users)
- `invited_at` (TIMESTAMP)
- `last_login_at` (TIMESTAMP)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**magic_link_tokens**:
- `id` (UUID, PK)
- `token` (TEXT, UNIQUE)
- `guest_id` (UUID, FK → guests)
- `expires_at` (TIMESTAMP)
- `used` (BOOLEAN)
- `used_at` (TIMESTAMP, nullable)
- `created_at` (TIMESTAMP)

### Row Level Security (RLS)

**RLS Policies**:
- Guests can only access their own data and group data
- Admins have elevated permissions
- Service role bypasses RLS for admin operations

**Example Policy** (guests table):
```sql
CREATE POLICY "Guests can view their own data"
ON guests FOR SELECT
USING (auth.uid() = id OR auth.uid() IN (
  SELECT id FROM guests WHERE group_id = guests.group_id
));
```

### Indexes

Performance-critical indexes:
- `guests(email)` - Email lookups
- `guests(group_id)` - Group queries
- `events(slug)` - Slug-based routing
- `activities(slug)` - Slug-based routing
- `activities(event_id)` - Event-activity relationships
- `rsvps(guest_id, entity_type, entity_id)` - RSVP lookups
- `content_pages(slug)` - Page routing
- `magic_link_tokens(token)` - Token verification

### Migrations

Database migrations located in `supabase/migrations/`:
- Numbered sequentially (001, 002, etc.)
- Applied in order
- Reversible when possible
- Tested before deployment

---

## Testing Strategy

### Test Types

**Unit Tests** (60%):
- Service methods
- Utility functions
- Custom hooks
- Pure functions
- Target: 90%+ coverage for services

**Integration Tests** (30%):
- API routes
- Database operations
- RLS policies
- Component data loading
- Target: 85%+ coverage for API routes

**E2E Tests** (10%):
- Complete user workflows
- Navigation flows
- Form submissions
- State updates
- Critical user journeys

**Property-Based Tests**:
- Business rule validation
- Input validation
- Round-trip operations
- Minimum 100 iterations per property

**Regression Tests**:
- All bug fixes
- Critical path validation
- Known issue prevention

### Test Commands

```bash
npm test                  # Run all tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests
npm run test:e2e          # E2E tests
npm run test:property     # Property-based tests
npm run test:regression   # Regression tests
npm run test:coverage     # Generate coverage report
npm run test:watch        # Watch mode
```

### Test Patterns

**Service Test Pattern**:
```typescript
describe('serviceName.methodName', () => {
  it('should return success with data when valid input', async () => {
    // Test success path
  });
  
  it('should return VALIDATION_ERROR when invalid input', async () => {
    // Test validation error
  });
  
  it('should return DATABASE_ERROR when database fails', async () => {
    // Test database error
  });
  
  it('should sanitize input to prevent XSS', async () => {
    // Test security
  });
});
```

**API Route Test Pattern**:
```typescript
describe('POST /api/admin/resource', () => {
  it('should create resource when authenticated with valid data', async () => {
    // Test success
  });
  
  it('should return 400 when data is invalid', async () => {
    // Test validation
  });
  
  it('should return 401 when not authenticated', async () => {
    // Test auth
  });
});
```

### Test Coverage Requirements

- Overall: 80%+
- Services: 90%+
- API Routes: 85%+
- Components: 70%+
- Utilities: 95%+
- Critical Paths: 100%


---

## Deployment Process

### Prerequisites

**Required**:
- Node.js 18+
- npm 9+
- Supabase project
- Environment variables configured

**Optional**:
- Backblaze B2 account (for photo storage)
- Resend account (for email)
- Google Gemini API key (for AI features)

### Environment Variables

**Required Variables**:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

**Optional Variables**:
```bash
# Backblaze B2
B2_APPLICATION_KEY_ID=your_key_id
B2_APPLICATION_KEY=your_key
B2_BUCKET_ID=your_bucket_id
B2_BUCKET_NAME=your_bucket_name

# Resend
RESEND_API_KEY=your_resend_key

# Google Gemini
GEMINI_API_KEY=your_gemini_key
```

### Build Process

**Development Build**:
```bash
npm install
npm run dev
```

**Production Build**:
```bash
npm install --production
npm run build
npm start
```

**Build Verification**:
```bash
npm run build
npm run test:all
```

### Database Migrations

**Running Migrations**:
```bash
# Using Supabase CLI
supabase db push

# Or manually via SQL
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/001_migration.sql
```

**Migration Checklist**:
1. Test migrations on staging database
2. Backup production database
3. Run migrations during maintenance window
4. Verify data integrity
5. Monitor for errors

### Deployment Steps

**1. Pre-Deployment**:
- [ ] All tests passing
- [ ] Code review completed
- [ ] Database migrations tested
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Accessibility audit passed
- [ ] Environment variables configured
- [ ] Backup created

**2. Staging Deployment**:
```bash
# Deploy to staging
git push staging main

# Run smoke tests
npm run test:smoke

# Manual testing
# - Test critical workflows
# - Verify all features working
# - Check performance metrics
```

**3. Production Deployment**:
```bash
# Create database backup
pg_dump -h your-db-host -U postgres -d postgres > backup.sql

# Deploy to production
git push production main

# Run database migrations
supabase db push --db-url your-production-db

# Verify deployment
curl https://your-domain.com/api/health
```

**4. Post-Deployment**:
- [ ] Monitor error rates (24 hours)
- [ ] Monitor performance metrics
- [ ] Check application logs
- [ ] Verify critical features
- [ ] Collect user feedback
- [ ] Address issues immediately

### Rollback Plan

**If deployment fails**:

1. **Immediate Rollback**:
```bash
# Revert to previous version
git revert HEAD
git push production main
```

2. **Database Rollback**:
```bash
# Restore from backup
psql -h your-db-host -U postgres -d postgres < backup.sql
```

3. **Verify Rollback**:
- Test critical features
- Check error rates
- Monitor performance
- Notify users if needed

### Monitoring

**Application Monitoring**:
- Error tracking (Sentry, LogRocket, etc.)
- Performance monitoring (New Relic, Datadog, etc.)
- Uptime monitoring (Pingdom, UptimeRobot, etc.)

**Database Monitoring**:
- Query performance
- Connection pool usage
- Disk space
- Replication lag

**Alerts**:
- Error rate > 1%
- Response time > 2s
- Database CPU > 80%
- Disk space < 20%

---

## Development Workflow

### Getting Started

**1. Clone Repository**:
```bash
git clone https://github.com/your-org/wedding-platform.git
cd wedding-platform
```

**2. Install Dependencies**:
```bash
npm install
```

**3. Configure Environment**:
```bash
cp .env.local.example .env.local
# Edit .env.local with your values
```

**4. Run Development Server**:
```bash
npm run dev
```

**5. Open Browser**:
```
http://localhost:3000
```

### Git Workflow

**Branch Strategy**:
- `main` - Production-ready code
- `staging` - Staging environment
- `develop` - Development branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Production hotfixes

**Commit Messages**:
```
type(scope): subject

body (optional)

footer (optional)
```

**Types**:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Code refactoring
- `test` - Tests
- `chore` - Maintenance

**Example**:
```
feat(rsvp): add inline RSVP management

- Add InlineRSVPEditor component
- Implement optimistic UI updates
- Add capacity validation

Closes #123
```

### Code Review Process

**Before Submitting PR**:
1. Run tests: `npm test`
2. Run linter: `npm run lint`
3. Run type check: `npm run type-check`
4. Build succeeds: `npm run build`
5. Write clear PR description
6. Link related issues

**PR Template**:
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass locally
```

**Review Checklist**:
- [ ] Code quality and readability
- [ ] Test coverage adequate
- [ ] No security vulnerabilities
- [ ] Performance considerations
- [ ] Accessibility compliance
- [ ] Documentation updated

### Coding Standards

**TypeScript**:
- Strict mode enabled
- Explicit return types on exported functions
- Explicit types on function parameters
- Use `unknown` instead of `any`

**React**:
- Named function exports (not arrow functions)
- Server Components by default
- Client Components only when needed
- Proper dependency arrays in hooks

**Services**:
- Return `Result<T>` pattern
- Validate with Zod `safeParse()`
- Sanitize user input with DOMPurify
- Use Supabase query builder (no raw SQL)

**API Routes**:
- Check authentication
- Validate request body
- Return consistent response format
- Use proper HTTP status codes

---

## Security Considerations

### Authentication

**Guest Authentication**:
- Email matching or magic link
- HTTP-only cookies
- Secure flag (HTTPS only)
- SameSite=Lax (CSRF protection)
- 24-hour session expiry

**Admin Authentication**:
- Supabase Auth (email/password)
- Strong password requirements
- Session management
- Role-based access control

### Authorization

**Row Level Security (RLS)**:
- Enforced at database level
- Guests can only access own data
- Admins have elevated permissions
- Service role for admin operations

**Role-Based Access Control (RBAC)**:
- Admin role - Content and guest management
- Owner role - Full system access
- Last owner protection

### Input Validation

**Zod Schema Validation**:
- All inputs validated
- Type-safe validation
- Detailed error messages
- Consistent validation patterns

**XSS Prevention**:
- DOMPurify sanitization
- Plain text sanitization
- Rich text sanitization
- Applied in service layer

**SQL Injection Prevention**:
- Supabase query builder (parameterized)
- No raw SQL with user input
- Input validation

### Rate Limiting

**Implemented Limits**:
- Login attempts: 5 per 5 minutes
- Magic links: 3 per 10 minutes
- API requests: 100 per minute
- Email sending: 50 per hour

### File Upload Security

**Photo Uploads**:
- File type validation (MIME + extension)
- File size limits (10MB max)
- Secure external storage (B2/Supabase)
- Photo moderation system

### Security Audits

**Regular Audits**:
- Quarterly security reviews
- Dependency vulnerability scans
- Penetration testing (annual)
- Code security analysis

**Security Rating**: 95/100 (Excellent)
- Zero critical vulnerabilities
- Zero high vulnerabilities
- Zero medium vulnerabilities
- 4 low-priority recommendations

---

## Performance Optimization

### Frontend Optimization

**Code Splitting**:
- Dynamic imports for heavy components
- Route-based code splitting
- Lazy loading for images

**Caching**:
- Static asset caching
- API response caching (5 minutes)
- Browser caching headers

**Image Optimization**:
- Next.js automatic image optimization
- WebP format support
- Responsive images
- Lazy loading

### Backend Optimization

**Database Optimization**:
- Indexes on frequently queried fields
- Query optimization
- Connection pooling
- Pagination (50 items/page)

**API Optimization**:
- Response compression
- Efficient data fetching
- Minimal data transfer
- Caching strategies

### Performance Targets

**Page Load**:
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Largest Contentful Paint: < 2.5s

**API Response**:
- Average response time: < 200ms
- 95th percentile: < 500ms
- 99th percentile: < 1s

**Database Queries**:
- Simple queries: < 50ms
- Complex queries: < 200ms
- Aggregations: < 500ms

### Performance Monitoring

**Metrics Tracked**:
- Page load times
- API response times
- Database query times
- Error rates
- User engagement

**Tools**:
- Lighthouse CI
- Web Vitals
- Performance API
- Database query analyzer

---

## Troubleshooting

### Common Issues

**Build Failures**:
- Check Node.js version (18+)
- Clear `.next` directory
- Delete `node_modules` and reinstall
- Check for TypeScript errors

**Test Failures**:
- Check environment variables
- Verify database connection
- Clear test cache
- Run tests individually

**Database Connection Issues**:
- Verify Supabase credentials
- Check network connectivity
- Verify RLS policies
- Check connection pool limits

**Performance Issues**:
- Check database indexes
- Review slow queries
- Optimize component rendering
- Check for memory leaks

### Debug Mode

**Enable Debug Logging**:
```bash
DEBUG=* npm run dev
```

**Database Query Logging**:
```typescript
// In lib/supabase.ts
const supabase = createClient(url, key, {
  db: { schema: 'public' },
  auth: { persistSession: true },
  global: { headers: { 'x-debug': 'true' } }
});
```

### Getting Help

**Resources**:
- Documentation: `/docs`
- GitHub Issues: [URL]
- Slack Channel: [URL]
- Email: dev@example.com

---

## Additional Resources

### Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Internal Documentation

- Admin User Guide: `docs/ADMIN_USER_GUIDE.md`
- Guest User Guide: `docs/GUEST_USER_GUIDE.md`
- Testing Guide: `docs/TESTING_QUICK_REFERENCE.md`
- Performance Guide: `docs/PERFORMANCE_OPTIMIZATION.md`
- Accessibility Guide: `ACCESSIBILITY_AUDIT_SUMMARY.md`
- Security Audit: `TASK_63_SECURITY_AUDIT_REPORT.md`

### Code Examples

See `examples/` directory for:
- Service implementation examples
- Component patterns
- API route examples
- Test examples
- Hook examples

---

**End of Developer Documentation**

For questions or clarifications, contact the development team or refer to the additional resources listed above.
