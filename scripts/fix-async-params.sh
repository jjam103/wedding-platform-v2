#!/bin/bash

# Fix all route files to use async params for Next.js 16

files=(
  "app/api/admin/vendors/[id]/route.ts"
  "app/api/admin/activities/[id]/route.ts"
  "app/api/admin/events/[id]/route.ts"
  "app/api/admin/photos/[id]/moderate/route.ts"
  "app/api/admin/photos/[id]/route.ts"
  "app/api/admin/guests/[id]/route.ts"
  "app/api/guest/family/[id]/route.ts"
)

for file in "${files[@]}"; do
  echo "Fixing $file..."
  # Replace params type and add await for params.id
  sed -i '' 's/{ params }: { params: { id: string } }/{ params }: { params: Promise<{ id: string }> }/g' "$file"
  sed -i '' 's/params\.id/resolvedParams.id/g' "$file"
  # Add const { id } = await params; after auth check
  sed -i '' '/const { user, supabase } = auth;/a\
\
    \/\/ 2. Await params\
    const resolvedParams = await params;
' "$file"
done

echo "Done!"
