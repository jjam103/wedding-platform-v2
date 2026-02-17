# E2E Phase 2 Round 8 - Bug #1 Diagnosis: B2 Health Check

## Status: ROOT CAUSE IDENTIFIED

## Problem Summary
Photo upload tests failing with 500 error. B2 health check returns healthy, but actual upload fails because B2 client is not initialized, then falls back to Supabase Storage which also fails with "Bucket not found".

## Root Cause Analysis

### Issue 1: B2 Client Not Initialized in E2E Environment ✅ FIXED
**Problem**: `instrumentation.ts` initializes B2 on server startup, but uses real B2 service instead of mock
**Fix Applied**: Added `USE_MOCK_B2=true` to `.env.e2e` and updated `checkB2Health()` to return healthy when in mock mode

### Issue 2: PhotoService Not Using Mock B2 Service ⚠️ CURRENT ISSUE
**Problem**: `photoService.ts` has lazy loading logic to detect E2E mode and use mock service, but it's not working correctly

**Evidence from logs**:
```
[PhotoService] B2 health check: { success: true, data: true }
[PhotoService] Attempting B2 upload...
❌ B2 upload failed: Client not initialized
   Call initializeB2Client() with valid configuration first
[PhotoService] B2 upload result: {
  success: false,
  error: {
    code: 'CLIENT_NOT_INITIALIZED',
    message: 'B2 client not initialized. Call initializeB2Client first.'
  }
}
[PhotoService] B2 failed, falling back to Supabase
```

**Analysis**:
1. Health check returns `true` (because of `USE_MOCK_B2=true` fix)
2. But actual upload uses REAL b2Service, not mock
3. Real b2Service has no client initialized (because instrumentation.ts initialized it with mock config)
4. Falls back to Supabase Storage
5. Supabase Storage fails with "Bucket not found" (photos bucket doesn't exist in E2E database)

### Issue 3: Supabase Storage Bucket Missing
**Problem**: E2E test database doesn't have a "photos" storage bucket
**Impact**: When B2 fails, fallback to Supabase also fails

## Current Code Flow

### photoService.ts - getB2Service()
```typescript
async function getB2Service() {
  if (!b2ServiceModule) {
    const isE2E = process.env.E2E_TEST === 'true' || 
                  process.env.PLAYWRIGHT_TEST === 'true' ||
                  process.env.NODE_ENV === 'test';
    
    if (isE2E) {
      const { getB2Service: getB2 } = await import('../__tests__/mocks/serviceDetector');
      b2ServiceModule = await getB2();
    } else {
      b2ServiceModule = await import('./b2Service');
    }
  }
  return b2ServiceModule;
}
```

**Problem**: Environment variables might not be set correctly when Next.js server starts

## Solution Options

### Option A: Fix Environment Detection (RECOMMENDED)
Add explicit E2E_TEST environment variable to playwright config and ensure it's passed to the Next.js server

**Pros**:
- Fixes root cause
- Mock service will be used correctly
- No need for Supabase Storage bucket

**Cons**:
- Requires playwright config update

### Option B: Create Supabase Storage Bucket
Create "photos" bucket in E2E test database so fallback works

**Pros**:
- Quick fix
- Tests will pass

**Cons**:
- Doesn't fix the mock service issue
- Tests will use Supabase Storage instead of testing B2 flow

### Option C: Force Mock Service in photoService
Update photoService to check for `USE_MOCK_B2` environment variable directly

**Pros**:
- Simple fix
- Directly uses the environment variable we already set

**Cons**:
- Adds another environment variable check

## Recommended Fix: Option C + Option B

1. **Update photoService.ts** to check `USE_MOCK_B2` environment variable
2. **Create photos bucket** in Supabase Storage as fallback safety net

This ensures:
- Mock B2 service is used when `USE_MOCK_B2=true`
- If mock fails for any reason, Supabase fallback works
- Tests are resilient to configuration issues

## Next Steps

1. Update `photoService.ts` getB2Service() to check `USE_MOCK_B2`
2. Create photos storage bucket in E2E database
3. Run photo upload tests to verify fix
4. Move to Bug #2 (Form Authentication)
