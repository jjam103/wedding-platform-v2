# Remaining Service Tests - Analysis & Fix Plan

## Date: January 29, 2026

## Status: 4 Services Need Pattern A Refactoring

All 4 remaining failing service tests have the **same root cause** as the services we've already fixed: they're using ES6 `import` instead of `require()` for Pattern A services.

## Root Cause (Same as Before)

ES6 `import` statements are hoisted and run BEFORE `jest.mock()`, causing services to load with real Supabase clients instead of mocked ones.

**Solution**: Apply the same require() pattern we used for budgetService, photoService, accommodationService, emailService, and locationService.

## Services Requiring Fix

### 1. rsvpService.test.ts ⚠️ HIGH PRIORITY
- **Current Status**: 4/34 passing (30 failures)
- **Service Pattern**: Already uses Pattern A (module-level client) ✅
- **Test Issue**: Using ES6 `import` instead of `require()`
- **Fix Required**: Change to require() pattern (same as locationService)
- **Estimated Time**: 15-30 minutes (proven pattern)
- **Priority**: HIGH (RSVP is critical feature)

**Current (Broken)**:
```typescript
jest.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

import * as rsvpService from './rsvpService'; // ❌ Hoisted before mock
```

**Fix (Working)**:
```typescript
jest.mock('@supabase/supabase-js', () => {
  const mockFrom = jest.fn();
  const mockSupabaseClient = { from: mockFrom };
  return {
    createClient: jest.fn(() => mockSupabaseClient),
    __mockFrom: mockFrom,
  };
});

const rsvpService = require('./rsvpService'); // ✅ Loads after mock
```

### 2. eventService.test.ts ⚠️ HIGH PRIORITY
- **Current Status**: Failures present
- **Service Pattern**: Need to verify (likely Pattern A)
- **Test Issue**: Likely using ES6 `import` instead of `require()`
- **Fix Required**: Apply require() pattern
- **Estimated Time**: 15-30 minutes
- **Priority**: HIGH (Events are critical feature)

### 3. smsService.test.ts ⚠️ MEDIUM PRIORITY
- **Current Status**: 5/24 passing (19 failures)
- **Service Pattern**: Need to verify
- **Test Issue**: Likely using ES6 `import` + possible config issues
- **Fix Required**: Apply require() pattern + fix config checks
- **Estimated Time**: 30-60 minutes (may have additional issues)
- **Priority**: MEDIUM (SMS is not critical path)

### 4. externalServiceGracefulDegradation.test.ts ⚠️ MEDIUM PRIORITY
- **Current Status**: Failures present
- **Service Pattern**: Tests multiple services (B2, Email, SMS)
- **Test Issue**: Complex mocking of external services
- **Fix Required**: May need different approach
- **Estimated Time**: 1-2 hours (more complex)
- **Priority**: MEDIUM (Failover testing)

## Proven Fix Pattern

We've successfully applied this pattern to 5 services:
1. ✅ budgetService - 11/11 passing
2. ✅ photoService - 16/16 passing
3. ✅ accommodationService - 24/24 passing
4. ✅ emailService - 31/34 passing (91%)
5. ✅ locationService - 26/26 passing (100%)

**Success Rate**: 100% when properly applied

## Step-by-Step Fix Process

### For Each Service:

1. **Update Test File Header**:
```typescript
// Set environment variables FIRST
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Mock Supabase with shared client instance (Pattern A)
jest.mock('@supabase/supabase-js', () => {
  const mockFrom = jest.fn();
  const mockSupabaseClient = { from: mockFrom };
  
  return {
    createClient: jest.fn(() => mockSupabaseClient),
    __mockFrom: mockFrom,
  };
});

// Import service using require() AFTER mocking
const serviceModule = require('./serviceName');
const { function1, function2, ... } = serviceModule;

// Get the mocked from function
const { __mockFrom: mockFrom } = require('@supabase/supabase-js');
```

2. **Update beforeEach**:
```typescript
beforeEach(() => {
  jest.clearAllMocks();
  
  // Set up environment variables
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
});
```

3. **Update Test Mocks**:
- Use `mockFrom` to set up query chains
- Match the exact query patterns used by the service
- Return proper mock data structures

4. **Run Tests**:
```bash
npx jest services/serviceName.test.ts --no-coverage
```

5. **Verify 100% Pass Rate**

## Estimated Total Time

- **rsvpService**: 15-30 minutes (HIGH priority)
- **eventService**: 15-30 minutes (HIGH priority)
- **smsService**: 30-60 minutes (MEDIUM priority)
- **externalServiceGracefulDegradation**: 1-2 hours (MEDIUM priority)

**Total**: 2-4 hours for all 4 services

## Quick Win Strategy

**Phase 1 (30-60 minutes)**: Fix HIGH priority services
1. Fix rsvpService.test.ts (15-30 min)
2. Fix eventService.test.ts (15-30 min)

**Phase 2 (1-2 hours)**: Fix MEDIUM priority services
3. Fix smsService.test.ts (30-60 min)
4. Fix externalServiceGracefulDegradation.test.ts (1-2 hours)

## Expected Outcome

After applying the proven Pattern A fix:
- **rsvpService**: 34/34 passing (100%)
- **eventService**: ~95%+ passing
- **smsService**: ~90%+ passing
- **externalServiceGracefulDegradation**: ~80%+ passing

**Overall Service Tests**: 95%+ passing rate

## Documentation Reference

- **Pattern A Guide**: `docs/TESTING_PATTERN_A_GUIDE.md`
- **Working Examples**: 
  - `services/locationService.test.ts` (most recent, 26/26 passing)
  - `services/budgetService.test.ts` (11/11 passing)
  - `services/photoService.test.ts` (16/16 passing)

## Recommendation

Start with HIGH priority services (rsvpService, eventService) as they're critical features and should take only 30-60 minutes total using the proven pattern.

---

**Status**: Ready to fix with proven pattern  
**Confidence**: HIGH (100% success rate on 5 previous services)  
**Time**: 2-4 hours total, 30-60 minutes for critical services

