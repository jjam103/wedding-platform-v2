import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/admin/locations/:id/validate-parent - Check circular refs
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Auth check
  const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      },
      { status: 401 }
    );
  }

  // 2. Parse request body
  const body = await request.json();
  const { parentLocationId } = body;

  if (!parentLocationId) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'parentLocationId is required' },
      },
      { status: 400 }
    );
  }

  // 3. Check for circular reference
  const resolvedParams = await params;

  const wouldCreateCycle = await checkCircularReference(resolvedParams.id, parentLocationId);

  if (wouldCreateCycle) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CIRCULAR_REFERENCE',
          message: 'This would create a circular reference in the location hierarchy',
        },
      },
      { status: 409 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: { valid: true },
    },
    { status: 200 }
  );
}

/**
 * Checks if setting a parent would create a circular reference.
 */
async function checkCircularReference(
  locationId: string,
  newParentId: string
): Promise<boolean> {
  // Prevent setting self as parent
  if (locationId === newParentId) {
    return true;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get all locations
  const { data, error } = await supabase
    .from('locations')
    .select('id, parent_location_id');

  if (error || !data) {
    return false; // If we can't check, allow the operation
  }

  // Build parent map
  const parentMap = new Map<string, string | null>();
  data.forEach((location) => {
    parentMap.set(location.id, location.parent_location_id);
  });

  // Walk up the tree from newParentId to see if we encounter locationId
  let currentId: string | null = newParentId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === locationId) {
      return true; // Circular reference detected
    }
    if (visited.has(currentId)) {
      return true; // Already visited, circular reference exists
    }
    visited.add(currentId);
    currentId = parentMap.get(currentId) || null;
  }

  return false; // No circular reference
}
