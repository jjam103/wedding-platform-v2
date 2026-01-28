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
