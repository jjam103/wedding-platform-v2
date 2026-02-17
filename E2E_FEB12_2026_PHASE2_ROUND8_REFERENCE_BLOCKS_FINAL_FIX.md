# E2E Reference Blocks Tests - Final Fix

## Current Status
- **3/8 tests passing** (37.5%)
- **5/8 tests failing** with timeout errors

## Root Cause Analysis

The tests are failing because they expect a UI flow that doesn't exist:

### Expected Flow (in tests):
1. Click "Manage Sections"
2. Select "References" from content type dropdown
3. Use SimpleReferenceSelector to add references

### Actual UI Flow:
1. Click "Manage Sections"  
2. SimpleReferenceSelector is already visible (no content type selector)
3. Select type and click items to add

## The Problem

The SectionEditor component doesn't have a "content type" selector. The SimpleReferenceSelector is rendered directly in the section editor without any wrapper or selector.

Looking at `components/admin/SectionEditor.tsx` lines 900+, the references are rendered inline without a content type selection step.

## Solution

The tests need to be completely rewritten to match the actual UI. The current approach of trying to find a content type selector will never work because it doesn't exist.

### Required Changes

1. **Remove content type selection logic** - This doesn't exist in the UI
2. **Wait for SimpleReferenceSelector directly** - It's always visible
3. **Update all 5 failing tests** with the correct flow

## Recommendation

Given the complexity and the fact that the UI doesn't match the test expectations at all, I recommend:

1. **Option A (Quick Fix)**: Skip these 5 tests temporarily and file a bug to rewrite them
2. **Option B (Proper Fix)**: Rewrite all 5 tests to match the actual UI flow (will take 1-2 hours)

The 3 passing tests work because they were already updated in the previous round. The 5 failing tests still have the old logic.

## Time Estimate
- Option A: 5 minutes (add `.skip` to failing tests)
- Option B: 1-2 hours (rewrite all 5 tests)

## Next Steps

Which option would you like to proceed with?
