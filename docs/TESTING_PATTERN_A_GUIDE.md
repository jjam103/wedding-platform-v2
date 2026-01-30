# Pattern A: External Client Creation Mocking - Complete Guide

## Overview

Pattern A is used for testing services that create their own Supabase clients using `createClient()` at module load time. This pattern ensures both the service and tests use the same mocked client instance.

## ⚠️ CRITICAL: Use require() Not import

**The most important rule for Pattern A**: You MUST use `require()` to import the service, NOT ES6 `import`.

**Why?** ES6 `import` statements are hoisted and processed BEFORE jest.mock(), which means the service module loads with the REAL Supabase client before the mock is set up. Using `require()` ensures the service loads AFTER the mock is configured.

```typescript
// ❌ WRONG - ES6 import is hoisted, loads before mock
jest.mock('@supabase/supabase-js', () => ({ ... }));
import * as serviceModule from './service';

// ✅ CORRECT - require() executes in order, loads after mock
jest.mock('@supabase/supabase-js', () => ({ ... }));
const serviceModule = require('./service');
```

## When to Use Pattern A

Use Pattern A when the service has this structure:

```typescript
// Service creates its own client at module load time
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

**Services that need Pattern A:**
- `emailQueueService.ts` ✅ (FIXED)
- `smsService.ts` ✅ (WORKING)
- `cleanupService.test.ts` ✅ (WORKING)
- `vendorService.ts` (needs fix)
- Any service with module-level `createClient()` calls

## Complete Pattern A Template

### 1. Mock Setup (Critical - Order Matters!)

```typescript
// Set up environment variables FIRST (before any imports)
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Mock other dependencies
jest.mock('./emailService', () => ({
  sendEmail: jest.fn(),
}));

// Mock Supabase client creation - CRITICAL PATTERN
jest.mock('@supabase/supabase-js', () => {
  const mockFrom = jest.fn();
  const mockSupabaseClient = {
    from: mockFrom,
  };
  
  return {
    createClient: jest.fn(() => mockSupabaseClient),
    // Export mockFrom so we can access it in tests
    __mockFrom: mockFrom,
  };
});

// ⚠️ CRITICAL: Use require() NOT import
const serviceModule = require('./serviceUnderTest');
const { serviceFunction1, serviceFunction2 } = serviceModule;

// Get the mocked from function
const { __mockFrom: mockFrom } = require('@supabase/supabase-js');
```

### 2. Test Setup

```typescript
describe('serviceName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    
    // Reset to default successful state
    mockFrom.mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    });
  });
});
```

### 3. Individual Test Configuration

```typescript
it('should handle specific scenario', async () => {
  // Configure mock for this specific test
  const mockSelect = jest.fn().mockResolvedValue({
    data: [{ id: '1', status: 'pending' }],
    error: null,
  });
  
  mockFrom.mockReturnValue({
    select: mockSelect,
  });

  const result = await serviceFunction();
  
  expect(result.success).toBe(true);
  expect(mockSelect).toHaveBeenCalledWith('status');
});
```

## Critical Success Factors

### 1. Shared Mock Instance ⚠️ CRITICAL

**Problem**: Service and tests get different mock instances
**Solution**: Create mock instance inside jest.mock callback

```typescript
// ❌ WRONG - Different instances
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(), // New instance each time
  })),
}));

// ✅ CORRECT - Same instance
jest.mock('@supabase/supabase-js', () => {
  const mockFrom = jest.fn();
  const mockSupabaseClient = { from: mockFrom };
  
  return {
    createClient: jest.fn(() => mockSupabaseClient), // Same instance
    __mockFrom: mockFrom,
  };
});
```

### 2. Mock Export Pattern ⚠️ CRITICAL

**Problem**: Cannot access mockFrom outside jest.mock callback
**Solution**: Export as `__mockFrom` from mock

```typescript
// ❌ WRONG - Scoping error
const mockFrom = jest.fn();
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ from: mockFrom })), // ReferenceError
}));

// ✅ CORRECT - Export from mock
jest.mock('@supabase/supabase-js', () => {
  const mockFrom = jest.fn();
  return {
    createClient: jest.fn(() => ({ from: mockFrom })),
    __mockFrom: mockFrom, // Export for test access
  };
});

const { __mockFrom: mockFrom } = require('@supabase/supabase-js');
```

### 3. Import Order ⚠️ CRITICAL

**Problem**: Service imports before mocks are set up
**Solution**: Import service AFTER jest.mock calls

```typescript
// ❌ WRONG - Import before mock
import { serviceFunction } from './service';
jest.mock('@supabase/supabase-js', () => ({ ... }));

// ✅ CORRECT - Mock before import
jest.mock('@supabase/supabase-js', () => ({ ... }));
import { serviceFunction } from './service';
```

### 4. Mock Chain Configuration

Match the exact Supabase query patterns used by your service:

```typescript
// Service calls: supabase.from('table').select('*').eq('status', 'pending')
mockFrom.mockReturnValue({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue({ data: [], error: null }),
  }),
});

// Service calls: supabase.from('table').update({}).eq('id', '123')
mockFrom.mockReturnValue({
  update: jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue({ error: null }),
  }),
});
```

## Common Patterns by Query Type

### Simple Select
```typescript
// Service: supabase.from('table').select('column')
mockFrom.mockReturnValue({
  select: jest.fn().mockResolvedValue({ data: [], error: null }),
});
```

### Complex Select Chain
```typescript
// Service: supabase.from('table').select('*').eq('status', 'pending').lte('date', now).order('date').limit(100)
mockFrom.mockReturnValue({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      lte: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
  }),
});
```

### Update Chain
```typescript
// Service: supabase.from('table').update({}).eq('id', '123').eq('status', 'pending')
mockFrom.mockReturnValue({
  update: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    }),
  }),
});
```

### Multiple Operations (processScheduledEmails pattern)
```typescript
// Service calls both select and update operations
let callCount = 0;
mockFrom.mockImplementation((table: string) => {
  if (table === 'scheduled_emails') {
    callCount++;
    if (callCount === 1) {
      // First call - select emails
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: mockEmails, error: null }),
              }),
            }),
          }),
        }),
      };
    } else {
      // Subsequent calls - updates
      return {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      };
    }
  }
  return {};
});
```

## Debugging Tips

### 1. Verify Mock is Being Called
```typescript
it('debug test', async () => {
  console.log('mockFrom calls before:', mockFrom.mock.calls.length);
  await serviceFunction();
  console.log('mockFrom calls after:', mockFrom.mock.calls.length);
  
  // Should show: calls before: 0, calls after: 1+
});
```

### 2. Check Mock Chain Calls
```typescript
it('debug mock chain', async () => {
  const mockSelect = jest.fn().mockResolvedValue({ data: [], error: null });
  mockFrom.mockReturnValue({ select: mockSelect });
  
  await serviceFunction();
  
  console.log('mockSelect calls:', mockSelect.mock.calls.length);
  console.log('mockSelect called with:', mockSelect.mock.calls);
});
```

### 3. Common Error Messages

**"Cannot read properties of undefined (reading 'select')"**
- Service is not using the mocked client
- Check mock instance sharing and import order

**"Cannot access 'mockFrom' before initialization"**
- Variable scoping issue in jest.mock
- Use the export pattern: `__mockFrom`

**"mockFrom calls: 0"**
- Service is creating a different client instance
- Ensure `createClient` always returns the same mock instance

## Anti-Patterns to Avoid

### ❌ Don't Create New Mock Instances
```typescript
// WRONG - Creates new instance each time
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(), // Different instance each call
  })),
}));
```

### ❌ Don't Use Variables Outside jest.mock
```typescript
// WRONG - Scoping error
const mockFrom = jest.fn();
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ from: mockFrom })), // ReferenceError
}));
```

### ❌ Don't Import Before Mocking
```typescript
// WRONG - Service loads before mock is set up
import { serviceFunction } from './service';
jest.mock('@supabase/supabase-js', () => ({ ... }));
```

### ❌ Don't Forget Environment Variables
```typescript
// WRONG - Service will fail without env vars
beforeEach(() => {
  jest.clearAllMocks();
  // Missing: process.env.NEXT_PUBLIC_SUPABASE_URL = '...';
});
```

## Success Metrics

When Pattern A is working correctly:
- ✅ All tests pass (100% success rate)
- ✅ No worker crashes (SIGTERM/SIGABRT eliminated)
- ✅ No "Cannot read properties of undefined" errors
- ✅ Mock functions are called (mockFrom.mock.calls.length > 0)
- ✅ Service functions return expected results

## Proven Working Examples

1. **emailQueueService.test.ts** - 17/17 tests passing ✅
2. **smsService.test.ts** - 24/24 tests passing ✅  
3. **cleanupService.test.ts** - Working with Pattern A ✅

## Next Services to Fix

Apply this exact pattern to:
1. **vendorService.test.ts** (25/29 tests failing)
2. Any other service with module-level `createClient()` calls

## Template Checklist

When implementing Pattern A:
- [ ] Mock dependencies before Supabase mock
- [ ] Create shared mock instance inside jest.mock callback
- [ ] Export mockFrom as `__mockFrom`
- [ ] Import service AFTER jest.mock calls
- [ ] Get mockFrom from require('@supabase/supabase-js')
- [ ] Set up environment variables in beforeEach
- [ ] Configure individual test mocks to match service query patterns
- [ ] Verify mock calls with debug logging if needed

This pattern is now proven and ready for systematic application to remaining failing services.