'use client';

import { Suspense } from 'react';
import { DataTable, type DataTableProps, type ColumnDef } from './DataTable';
import { TableSkeleton } from './SkeletonLoaders';

// Re-export types
export type { ColumnDef, DataTableProps };

/**
 * DataTable wrapped in Suspense boundary
 * 
 * This wrapper is required for Next.js 16 because DataTable uses useSearchParams()
 * which requires a Suspense boundary during static generation.
 */
export function DataTableWithSuspense<T extends Record<string, any>>(
  props: DataTableProps<T>
) {
  return (
    <Suspense fallback={<TableSkeleton rows={10} columns={props.columns.length} />}>
      <DataTable {...props} />
    </Suspense>
  );
}
