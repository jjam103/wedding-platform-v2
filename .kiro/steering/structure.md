# Project Structure & Organization

## Root Directory Structure

```
wedding-project/
├── src/                    # Source code
├── public/                 # Static assets
├── supabase/              # Database migrations and config
├── __tests__/             # Root-level tests
├── scripts/               # Build and utility scripts
├── .kiro/                 # Kiro configuration and specs
├── .github/               # GitHub workflows and templates
└── [config files]        # Next.js, TypeScript, Tailwind configs
```

## Source Code Organization (`src/`)

### Application Structure (`src/app/`)
Next.js App Router with file-based routing:

```
app/
├── (pages)/               # Guest-facing pages (route groups)
│   ├── accommodation/     # Accommodation details
│   ├── activities-overview/ # Day-by-day itinerary
│   ├── activity/          # Activity listings
│   ├── memories/          # Photo gallery
│   ├── our-story/         # Wedding story
│   └── transportation-info/ # Flight/shuttle info
├── admin/                 # Admin dashboard
├── api/                   # API endpoints (20+ routes)
│   ├── guests/            # Guest management APIs
│   ├── activities/        # Activity management APIs
│   ├── photos/            # Photo management APIs
│   ├── email/             # Email system APIs
│   └── auth/              # Authentication APIs
├── auth/                  # Authentication flows
├── [type]/[slug]/         # Dynamic content pages
├── layout.tsx             # Root layout
├── page.tsx               # Home page
└── globals.css            # Global styles
```

### Component Architecture (`src/components/`)

```
components/
├── admin/                 # Admin-specific components
│   ├── AdminDashboard.tsx
│   ├── GuestManager.tsx
│   ├── ActivityManager.tsx
│   ├── PhotoManager.tsx
│   ├── RSVPAnalytics.tsx
│   ├── EmailManager.tsx
│   └── BudgetTracker.tsx
├── sections/              # Page section renderers
│   ├── AccommodationSection.tsx
│   ├── ActivityRSVPSection.tsx
│   ├── FamilyContactSection.tsx
│   └── SectionRenderer.tsx
├── photos/                # Photo gallery components
│   ├── PhotoCarousel.tsx
│   ├── PhotoUpload.tsx
│   ├── PhotoGrid.tsx
│   └── PhotoList.tsx
├── editor/                # Rich text editors
│   ├── RichTextEditor.tsx
│   ├── BlockNoteEditor.tsx
│   └── SectionEditor.tsx
├── ui/                    # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── Form.tsx
│   └── Table.tsx
└── lazy/                  # Code-split components
```

### Business Logic Layer (`src/services/`)

17 service modules handling core business logic:

```
services/
├── guestService.ts        # Guest management
├── rsvpService.ts         # RSVP handling
├── activityService.ts     # Activity management
├── photoService.ts        # Photo operations
├── accommodationService.ts # Accommodation management
├── locationService.ts     # Location hierarchy
├── budgetService.ts       # Budget calculations
├── contentService.ts      # CMS operations
├── emailService.ts        # Email automation
├── b2Service.ts           # Backblaze B2 integration
├── accessControlService.ts # Authorization
├── rsvpAnalyticsService.ts # RSVP analytics
├── eventService.ts        # Event management
├── transportationService.ts # Transportation coordination
├── itineraryService.ts    # Itinerary generation
├── gallerySettingsService.ts # Photo gallery settings
└── sectionsService.ts     # Page section management
```

### Data Layer (`src/lib/`, `src/types/`, `src/schemas/`)

```
lib/
├── supabase.ts           # Supabase client configuration
├── auth.ts               # Authentication utilities
├── rateLimit.ts          # Rate limiting
└── validation.ts         # Input validation

types/
└── index.ts              # TypeScript type definitions

schemas/
└── index.ts              # Zod validation schemas
```

### Custom Hooks (`src/hooks/`)

```
hooks/
├── useGuests.ts          # Guest data management
├── useActivities.ts      # Activity data management
├── usePhotos.ts          # Photo data management
├── useBudget.ts          # Budget data management
├── useAuth.ts            # Authentication state
├── useEvents.ts          # Event data management
├── useSections.ts        # Section data management
└── useRSVP.ts            # RSVP data management
```

### Utilities (`src/utils/`)

```
utils/
├── errors.ts             # Error handling utilities
├── sanitization.ts       # Input sanitization
├── performance.ts        # Performance monitoring
├── slugs.ts              # URL slug generation and utilities
└── db.ts                 # Database performance tools
```

## Database Structure (`supabase/`)

```
supabase/
├── migrations/           # SQL migration files
├── config.toml          # Supabase configuration
└── seed.sql             # Initial data seeding
```

## Testing Organization

### Test Structure
```
__tests__/                # Root-level test directory
├── unit/                 # Unit tests
│   ├── services/         # Service layer tests
│   ├── utils/            # Utility function tests
│   └── hooks/            # Custom hook tests
├── integration/          # Integration tests
│   ├── api/              # API route tests
│   └── database/         # Database operation tests
├── components/           # Component tests
│   ├── admin/            # Admin component tests
│   └── sections/         # Section component tests
├── e2e/                  # End-to-end tests
│   └── *.spec.ts         # Playwright E2E specs
├── property/             # Property-based tests
│   └── *.property.test.ts
└── fixtures/             # Test data and factories
```

### Test Categories
- **Unit Tests**: Individual component and service testing
- **Integration Tests**: API endpoint and database testing
- **Regression Tests**: Preventing known issues
- **Property Tests**: Business rule validation with fast-check
- **E2E Tests**: Full user workflow testing
- **Performance Tests**: Load and response time testing
- **Security Tests**: Authentication and authorization testing
- **Accessibility Tests**: WCAG 2.1 AA compliance testing

## Configuration Files

### Build Configuration
- `next.config.ts` - Next.js configuration with React Compiler
- `tailwind.config.ts` - Tailwind CSS with Costa Rica theme
- `tsconfig.json` - TypeScript strict mode configuration
- `jest.config.js` - Jest testing configuration
- `eslint.config.mjs` - ESLint rules and Next.js integration

### Environment Configuration
- `.env.local` - Local development environment variables
- `.env.test` - Test environment configuration
- `.env.b2.example` - Backblaze B2 configuration template

## Naming Conventions

### File Naming
- **Components**: PascalCase (e.g., `GuestManager.tsx`, `PhotoGrid.tsx`)
- **Services**: camelCase with Service suffix (e.g., `guestService.ts`, `emailService.ts`)
- **Utilities**: camelCase (e.g., `sanitization.ts`, `slugs.ts`)
- **Types**: camelCase (e.g., `index.ts` in types folder)
- **Hooks**: camelCase with use prefix (e.g., `useGuests.ts`, `useAuth.ts`)
- **Pages**: lowercase with hyphens (e.g., `activities-overview/`, `our-story/`)
- **Tests**: Match source file with `.test.ts` suffix (e.g., `guestService.test.ts`)

### Component Organization
- **Manager Components**: Suffix with "Manager" for CRUD operations (e.g., `GuestManager`, `ActivityManager`)
- **Section Components**: Suffix with "Section" for page sections (e.g., `AccommodationSection`, `ActivityRSVPSection`)
- **Form Components**: Suffix with "Form" for form handling (e.g., `GuestForm`, `RSVPForm`)
- **UI Components**: Descriptive names without suffixes (e.g., `Button`, `Card`, `Modal`)

### Service Organization
- **Core Services**: Domain-specific (e.g., `guestService`, `activityService`, `photoService`)
- **Integration Services**: External service integration (e.g., `b2Service`, `emailService`)
- **Utility Services**: Cross-cutting concerns (e.g., `accessControlService`, `contentService`)
- **Analytics Services**: Reporting and analytics (e.g., `rsvpAnalyticsService`)

### Hook Naming
- **Data Hooks**: `use` + plural noun (e.g., `useGuests`, `useActivities`, `usePhotos`)
- **State Hooks**: `use` + singular noun (e.g., `useAuth`, `useBudget`, `useRSVP`)
- **Action Hooks**: `use` + verb (e.g., `useUpload`, `useSubmit`)

## Import Patterns

### Path Aliases
- `@/components/*` - Component imports
- `@/services/*` - Service layer imports
- `@/lib/*` - Library and configuration imports
- `@/types/*` - Type definition imports
- `@/hooks/*` - Custom hook imports
- `@/utils/*` - Utility function imports
- `@/schemas/*` - Zod validation schema imports

### Import Organization
1. External library imports
2. Internal component imports
3. Service and utility imports
4. Type imports
5. Relative imports

## Code Organization Principles

### Separation of Concerns
- **Pages**: Route handling and layout
- **Components**: UI rendering and user interaction
- **Services**: Business logic and data operations
- **Hooks**: State management and side effects
- **Utils**: Pure functions and helpers
- **Lib**: Configuration and third-party integrations

### Dependency Direction
- Pages depend on components and services
- Components depend on hooks and utilities
- Services depend on lib and types
- Hooks depend on services and utilities
- No circular dependencies allowed

### Error Handling Strategy
- **Component Level**: Error boundaries for UI errors
- **Service Level**: Structured error responses with Result<T> pattern
- **API Level**: Consistent error formatting with HTTP status codes
- **Global Level**: Unhandled error logging and monitoring

## Anti-Patterns to Avoid

### Legacy Naming Patterns (DO NOT USE)
- ❌ **"Refactored" suffix**: Never use `ComponentRefactored.tsx` - name it properly from the start
- ❌ **"Data" suffix on hooks**: Use `useGuests` not `useGuestData`
- ❌ **Duplicate services**: Don't create both `emailService.ts` in `/services` and `/lib`
- ❌ **Inconsistent utility names**: Use `slugs.ts` not both `generateSlugUrl.ts` and `slugUtils.ts`
- ❌ **Generic file names**: Use `index.ts` in types folder, not `dataContracts.ts`
- ❌ **Service suffix in lib**: Use `rateLimit.ts` not `rateLimitService.ts` in lib folder

### Organizational Anti-Patterns
- ❌ **Multiple test directories**: Use single `__tests__/` at root, not scattered across project
- ❌ **Vague component folders**: Use specific folders like `ui/` not `[shared components]`
- ❌ **Mixed concerns**: Don't put business logic in lib folder - use services
- ❌ **Inconsistent hook naming**: Stick to `use` + noun pattern consistently

### Code Quality Anti-Patterns
- ❌ **Temporary naming**: No "temp", "old", "new", "v2" in production code
- ❌ **Commented code**: Remove commented code before committing
- ❌ **TODO comments**: Convert TODOs to issues, don't leave in code
- ❌ **Console logs**: Remove debug console.log statements before production