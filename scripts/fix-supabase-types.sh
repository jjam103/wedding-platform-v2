#!/bin/bash

# Script to add type assertions to Supabase query results in test files
# This fixes "Property does not exist on type 'never'" errors

echo "Fixing Supabase type issues in integration tests..."

# Files with the most errors
files=(
  "__tests__/integration/authMethodMigrations.integration.test.ts"
  "__tests__/regression/authMethodMigrations.regression.test.ts"
  "__tests__/property/authMethodValidation.property.test.ts"
  "__tests__/integration/slugGeneration.integration.test.ts"
  "__tests__/integration/guestContentApi.integration.test.ts"
  "__tests__/integration/authMethodManagement.integration.test.ts"
  "__tests__/integration/inlineRSVPApi.integration.test.ts"
  "__tests__/integration/contentPagesApi.integration.test.ts"
  "__tests__/integration/b2Storage.integration.test.ts"
  "__tests__/regression/photoStorage.regression.test.ts"
  "__tests__/regression/rsvpCapacity.regression.test.ts"
  "__tests__/regression/financialCalculations.regression.test.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Add (as any) to property accesses on data/guest/token/etc
    # Pattern: data?.property -> (data as any)?.property
    sed -i '' 's/\([a-zA-Z_][a-zA-Z0-9_]*\)\?\.\([a-zA-Z_][a-zA-Z0-9_]*\)/((\1 as any))?.\2/g' "$file"
    
    # Pattern: data!.property -> (data as any)!.property  
    sed -i '' 's/\([a-zA-Z_][a-zA-Z0-9_]*\)!\.\([a-zA-Z_][a-zA-Z0-9_]*\)/((\1 as any)!.\2/g' "$file"
    
    echo "  ✓ Fixed $file"
  else
    echo "  ✗ File not found: $file"
  fi
done

echo "Done! Run 'npx tsc --noEmit' to check remaining errors."
