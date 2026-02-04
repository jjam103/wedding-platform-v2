# Destination Wedding Management Platform

A comprehensive destination wedding management platform built with Next.js 16, React 19, and TypeScript, designed for multi-owner wedding coordination in Costa Rica.

## Features

- **Guest Portal**: Email-based login, RSVP management, accommodation details, itinerary access
- **Admin Dashboard**: Complete wedding coordination including guest management, activity planning, vendor tracking, and budget oversight
- **Multi-Owner Support**: Family-based guest grouping with shared access and management capabilities
- **Costa Rica Theming**: Tropical color palette and "Pura Vida" branding throughout

## Tech Stack

- **Frontend**: Next.js 16.1.1 (App Router), React 19.2.3, TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 4 with Costa Rica-themed color palette
- **Backend**: Next.js API Routes with server-side rendering
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth (email-based with magic links)
- **Testing**: Jest 29 + React Testing Library + fast-check (property-based testing)

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy the environment variables template:

```bash
cp .env.local.example .env.local
```

4. Update `.env.local` with your Supabase credentials and other API keys

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run property-based tests
npm run test:property

# Run type checking
npm run test:types

# Run full test suite
npm run test:all
```

### E2E Testing Environment Setup

End-to-end (E2E) tests require a separate environment configuration to ensure tests don't affect production data or trigger real external API calls.

#### Quick Setup

1. **Copy the E2E environment template**:

```bash
cp .env.e2e.example .env.e2e
```

2. **Configure test database credentials**:
   - Create a dedicated Supabase test project (separate from development/production)
   - Update `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in `.env.e2e`
   - Find these values in your Supabase project settings → API

3. **Use mock credentials for external services** (recommended):
   - The `.env.e2e.example` file includes mock credentials with `test-` prefix
   - Mock credentials prevent actual API calls to Resend, Twilio, Backblaze B2, and Google Gemini
   - Tests will either mock these services or handle authentication failures gracefully

4. **Run database migrations**:

```bash
npm run migrate:test
```

5. **Verify setup**:

```bash
npm run test:e2e
```

#### What's in `.env.e2e`?

The E2E environment file contains:

- **Test Database Credentials**: Dedicated Supabase project for testing
- **Mock External Service Credentials**: Safe placeholder values that prevent real API calls
  - Backblaze B2 (photo storage)
  - Resend (email delivery)
  - Twilio (SMS notifications)
  - Google Gemini (AI content extraction)
- **E2E Test Configuration**: Headless mode, parallel workers, timeouts, video recording

#### Mock Credentials Pattern

All mock credentials follow the format: `test-{service}-{credential-type}`

Example:
```bash
RESEND_API_KEY=test-resend-api-key
B2_ACCESS_KEY_ID=test-b2-access-key-id
TWILIO_ACCOUNT_SID=test-twilio-account-sid
```

This ensures:
- ✅ Immediate recognition of test credentials
- ✅ No risk of accidentally using production credentials
- ✅ Tests won't trigger real external API calls

#### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests in UI mode (for debugging)
npm run test:e2e:ui

# Run specific E2E test suite
npm run test:e2e -- admin/navigation.spec.ts

# Run E2E tests with visible browser (non-headless)
E2E_HEADLESS=false npm run test:e2e
```

#### E2E Test Configuration Options

Configure E2E test behavior in `.env.e2e`:

- `E2E_BASE_URL`: Test server URL (default: `http://localhost:3000`)
- `E2E_HEADLESS`: Run browsers without UI (`true` for CI, `false` for debugging)
- `E2E_WORKERS`: Number of parallel test workers (1-4 recommended)
- `E2E_TIMEOUT`: Test timeout in milliseconds (default: 30000)
- `E2E_SCREENSHOT_ON_FAILURE`: Capture screenshots when tests fail
- `E2E_VIDEO`: Video recording mode (`retain-on-failure` recommended)
- `E2E_TRACE`: Trace recording for detailed debugging

#### Important Notes

⚠️ **Security**:
- Never commit `.env.e2e` with real credentials to version control
- Use a separate test Supabase project, not your production database
- Mock credentials are safe to commit (they're in `.env.e2e.example`)

📚 **Detailed Documentation**:
- [E2E Mock Credentials Guide](./docs/E2E_MOCK_CREDENTIALS_GUIDE.md) - Complete guide to mock credentials and service mocking
- [E2E Suite Consolidation Process](./docs/E2E_SUITE_CONSOLIDATION_PROCESS.md) - E2E test organization and best practices
- [Testing Standards](./.kiro/steering/testing-standards.md) - Comprehensive testing guidelines

### Building for Production

```bash
npm run build
npm start
```

## Troubleshooting

### CSS Styling Issues

If you encounter issues where pages load but appear unstyled (no Tailwind CSS applied):

#### Quick Diagnosis

Run the automated diagnostic script:

```bash
npm run diagnose:css
```

This will check:
- CSS file existence and readability
- PostCSS configuration validity
- Tailwind configuration and content paths
- CSS import in root layout
- Package dependencies

#### Common Fixes

**1. Browser Cache Issue** (Most Common)
```bash
# Hard refresh in browser
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# Or clear browser cache completely
```

**2. Next.js Cache Issue**
```bash
# Clear .next directory and restart
rm -rf .next
npm run dev
```

**3. Turbopack CSS Processing**
```bash
# Try running without Turbopack
next dev --no-turbopack
```

**4. PostCSS Configuration**

Ensure `postcss.config.mjs` uses the correct Tailwind v4 plugin:

```javascript
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
export default config;
```

**5. Tailwind Content Paths**

Verify `tailwind.config.ts` includes all component directories:

```typescript
content: [
  './app/**/*.{js,ts,jsx,tsx,mdx}',
  './components/**/*.{js,ts,jsx,tsx,mdx}',
],
```

**6. CSS Import in Layout**

Ensure `app/layout.tsx` imports the global CSS:

```typescript
import './globals.css';
```

#### Browser DevTools Verification

1. Open DevTools (F12) → Network tab
2. Refresh page and filter by CSS
3. Verify CSS file loads with 200 status
4. Click CSS file to inspect contents
5. Check Elements tab → Computed styles for applied CSS

#### Running CSS Tests

```bash
# Run CSS delivery E2E test
npm run test:e2e:css

# Run all admin styling tests
npm run test:e2e:admin
```

For more details, see the [CSS Fix Summary](./CSS_FIX_SUMMARY.md).

## Project Structure

```
├── app/                    # Next.js App Router pages
├── components/             # React components
├── services/              # Business logic layer
├── lib/                   # Configuration and utilities
├── types/                 # TypeScript type definitions
├── utils/                 # Helper functions
├── __tests__/             # Test files
└── public/                # Static assets
```

## Core Patterns

### Result Type Pattern

All service methods return a `Result<T>` type for consistent error handling:

```typescript
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: ErrorDetails };
```

### Service Layer Pattern

Business logic is centralized in service modules with:
1. Zod validation
2. Input sanitization
3. Database operations
4. Consistent error handling

## Environment Variables

See `.env.local.example` for required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- Additional API keys for Resend, Backblaze B2, Twilio, and Google Gemini

## License

Private - All rights reserved
