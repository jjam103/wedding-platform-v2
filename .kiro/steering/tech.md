# Technology Stack & Build System

## Core Technologies

### Frontend Stack
- **Next.js 16.1.1**: App Router with React Server Components
- **React 19.2.3**: Latest React with concurrent features
- **TypeScript 5**: Strict mode enabled for type safety
- **Tailwind CSS 4**: Utility-first styling with custom Costa Rica color palette

### Backend & Database
- **Next.js API Routes**: Server-side API endpoints
- **Supabase**: PostgreSQL database with real-time subscriptions
- **Supabase Auth**: Email-based authentication system
- **Row Level Security (RLS)**: Database-level access control

### External Integrations
- **Resend**: Email delivery with webhook tracking
- **Backblaze B2**: Photo storage with CDN optimization
- **Google Gemini**: AI content extraction from URLs
- **Supabase Storage**: File storage for documents and images

### Development Tools
- **SWC Compiler**: Fast Rust-based compilation
- **ESLint 9**: Code linting with Next.js config
- **Jest 29**: Unit and integration testing
- **React Testing Library**: Component testing utilities
- **fast-check**: Property-based testing for business rules

## Build Commands

### Development
```bash
npm run dev              # Start development server
npm run build           # Production build
npm run start           # Start production server
npm run lint            # Run ESLint
```

### Testing
```bash
npm test                # Run all tests
npm run test:watch      # Watch mode testing
npm run test:coverage   # Generate coverage report
npm run test:types      # TypeScript type checking
npm run test:all        # Full test suite (types + tests + build)
```

### Specialized Testing
```bash
npm run test:production         # Production-ready tests
npm run test:production-coverage # Production tests with coverage
npm run test:regression         # Regression test suite
npm run test:email             # Email system tests
npm run test:property          # Property-based tests
npm run test:security          # Security validation tests
npm run test:performance       # Performance benchmarks
npm run test:accessibility     # A11y compliance tests
```

## Project Configuration

### TypeScript Configuration
- **Strict Mode**: Enabled for maximum type safety
- **Path Mapping**: `@/*` maps to `./src/*`
- **Target**: ES2017 with modern browser support
- **JSX**: React JSX transform

### Tailwind CSS
- **Custom Color Palette**: Costa Rica-themed colors (jungle, sunset, ocean, volcano, sage, cloud)
- **Extended Spacing**: Additional spacing utilities for consistent layouts
- **Custom Animations**: Tropical-themed transitions and effects
- **Typography Scale**: Systematic font sizing with line heights

### Jest Configuration
- **Environment**: jsdom for DOM testing
- **Setup**: Custom test setup with React Testing Library
- **Module Mapping**: Supports TypeScript path aliases
- **Coverage**: Comprehensive coverage reporting

## Architecture Patterns

### Service Layer Pattern
- Business logic centralized in `src/services/`
- Consistent error handling across services
- Type-safe data contracts with Zod validation
- Supabase integration abstraction

### Component Organization
- **Pages**: App Router structure in `src/app/`
- **Components**: Reusable UI components in `src/components/`
- **Hooks**: Custom React hooks in `src/hooks/`
- **Utils**: Helper functions in `src/utils/`
- **Types**: TypeScript definitions in `src/types/`

### Error Handling
- Comprehensive error boundaries
- Structured error logging
- User-friendly error messages
- Graceful degradation strategies

## Performance Optimizations

### Build Optimizations
- **React Compiler**: Enabled for automatic optimizations
- **Code Splitting**: Dynamic imports for lazy loading
- **Image Optimization**: Next.js automatic image optimization
- **Bundle Analysis**: Built-in bundle analyzer

### Runtime Optimizations
- **Supabase Real-time**: Efficient data synchronization
- **CDN Integration**: Cloudflare CDN for B2 storage
- **Caching Strategies**: Strategic caching for static content
- **Database Optimization**: Optimized queries and indexing

## Development Guidelines

### Code Style
- **TypeScript Strict**: All code must pass strict type checking
- **ESLint Rules**: Follow Next.js recommended configuration
- **Component Patterns**: Functional components with hooks
- **Error Boundaries**: Wrap components prone to errors

### Testing Requirements
- **Unit Tests**: All services and utilities must have tests
- **Integration Tests**: API routes require integration tests
- **Property Tests**: Business rules validated with property-based testing
- **Coverage**: Maintain high test coverage for critical paths

### Security Practices
- **Input Sanitization**: All user inputs sanitized
- **RLS Policies**: Database access controlled at row level
- **Environment Variables**: Sensitive data in environment variables
- **CORS Configuration**: Proper CORS setup for external integrations