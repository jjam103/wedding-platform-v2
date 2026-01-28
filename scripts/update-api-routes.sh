#!/bin/bash

# Script to update all API routes from @supabase/auth-helpers-nextjs to @supabase/ssr

echo "Updating API routes to use @supabase/ssr..."

# Find all route.ts files in app/api
find app/api -name "route.ts" -type f | while read file; do
  if grep -q "createRouteHandlerClient" "$file"; then
    echo "Updating: $file"
    
    # Replace the import
    sed -i '' "s/import { createRouteHandlerClient } from '@supabase\/auth-helpers-nextjs';/import { createApiClient, getAuthenticatedUser, getAuthorizedAdmin } from '@\/lib\/apiAuth';/g" "$file"
    
    # Remove cookies import if it's standalone
    sed -i '' "/^import { cookies } from 'next\/headers';$/d" "$file"
    
    echo "  ✓ Updated imports"
  fi
done

echo "Done! Please review the changes and test the endpoints."
