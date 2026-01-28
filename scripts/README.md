# TypeScript Contract Validation

## Overview

This directory contains scripts for validating TypeScript contracts across the codebase to ensure type safety and consistency.

## validate-contracts.ts

Validates that all service methods follow the established type contracts:

### What it checks:

1. **Result<T> Return Type**: All exported service methods must return `Result<T>`
2. **No 'any' Types**: Service methods cannot use `any` type in parameters or return values
3. **Explicit Types**: All parameters and return types must have explicit type annotations
4. **Type Safety**: Ensures all service methods maintain strict type safety

### Usage:

```bash
# Run validation manually
npm run validate:contracts

# Validation runs automatically on build
npm run build
```

### Exit Codes:

- `0`: All contracts validated successfully
- `1`: Contract violations found (build will fail)

### Example Output:

**Success:**
```
✅ All TypeScript contracts validated successfully

Validated 17 service file(s)
```

**Failure:**
```
❌ TypeScript Contract Validation Failed

services/guestService.ts:
  ✗ Line 45:1 - Exported function 'create' should return Result<T>
  ✗ Line 52:3 - Parameter 'data' uses 'any' type

services/eventService.ts:
  ✗ Line 78:1 - Exported function 'update' missing explicit return type

3 contract violation(s) found
```

## Integration with CI/CD

The contract validation is integrated into the build process:

1. **Pre-build**: Runs automatically before `next build`
2. **Fails Fast**: Build fails if any contract violations are found
3. **Clear Errors**: Provides specific file, line, and column information

## Requirements

- TypeScript 5+
- ts-node 10.9+
- All service files must be in `services/` directory
- Service files must end with `Service.ts`

## Contract Rules

### Service Method Pattern

```typescript
// ✅ CORRECT
export async function create(data: CreateDTO): Promise<Result<Entity>> {
  // Implementation
}

// ❌ WRONG - Missing Result<T>
export async function create(data: CreateDTO): Promise<Entity> {
  // Implementation
}

// ❌ WRONG - Using 'any'
export async function create(data: any): Promise<Result<Entity>> {
  // Implementation
}

// ❌ WRONG - Missing explicit type
export async function create(data) {
  // Implementation
}
```

### Error Handling Pattern

```typescript
// ✅ CORRECT - Return Result<T>
export async function get(id: string): Promise<Result<Entity>> {
  try {
    const { data, error } = await supabase
      .from('table')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message },
      };
    }
    
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: { code: 'UNKNOWN_ERROR', message: 'Unexpected error' },
    };
  }
}

// ❌ WRONG - Throwing errors
export async function get(id: string): Promise<Entity> {
  const { data, error } = await supabase
    .from('table')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    throw new Error(error.message); // Don't throw!
  }
  
  return data;
}
```

## Troubleshooting

### "Services directory not found"

Ensure you're running the script from the project root directory.

### "No service files found"

Check that your service files:
- Are in the `services/` directory
- End with `Service.ts` (e.g., `guestService.ts`)

### TypeScript compilation errors

Ensure all dependencies are installed:
```bash
npm install
```

## Related Documentation

- [Code Conventions](../.kiro/steering/code-conventions.md)
- [Testing Standards](../.kiro/steering/testing-standards.md)
- [Type Definitions](../types/index.ts)
