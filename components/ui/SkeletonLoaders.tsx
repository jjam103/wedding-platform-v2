import { TropicalSkeleton } from './TropicalLoading';

/**
 * Table Skeleton Loader
 * 
 * Displays a skeleton loader matching the shape of a data table.
 */
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden" role="status" aria-label="Loading table">
      {/* Header */}
      <div className="bg-sage-50 border-b border-sage-200 p-4">
        <div className="flex gap-4">
          {[...Array(columns)].map((_, i) => (
            <TropicalSkeleton key={i} className="h-6 flex-1" variant="rectangular" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="border-b border-sage-100 p-4">
          <div className="flex gap-4">
            {[...Array(columns)].map((_, colIndex) => (
              <TropicalSkeleton key={colIndex} className="h-4 flex-1" variant="rectangular" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Card Skeleton Loader
 * 
 * Displays a skeleton loader matching the shape of a card component.
 */
interface CardSkeletonProps {
  hasImage?: boolean;
  lines?: number;
}

export function CardSkeleton({ hasImage = false, lines = 3 }: CardSkeletonProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6" role="status" aria-label="Loading card">
      {/* Image placeholder */}
      {hasImage && (
        <TropicalSkeleton className="h-48 w-full mb-4" variant="rectangular" />
      )}
      
      {/* Title */}
      <TropicalSkeleton className="h-6 w-3/4 mb-4" variant="rectangular" />
      
      {/* Content lines */}
      <div className="space-y-2">
        {[...Array(lines)].map((_, i) => (
          <TropicalSkeleton 
            key={i} 
            className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} 
            variant="text" 
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Grid Skeleton Loader
 * 
 * Displays a skeleton loader matching the shape of a photo grid.
 */
interface GridSkeletonProps {
  items?: number;
  columns?: number;
}

export function GridSkeleton({ items = 12, columns = 4 }: GridSkeletonProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  }[columns] || 'grid-cols-4';

  return (
    <div 
      className={`grid ${gridCols} gap-4`} 
      role="status" 
      aria-label="Loading grid"
    >
      {[...Array(items)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Image placeholder */}
          <TropicalSkeleton className="h-48 w-full" variant="rectangular" />
          
          {/* Caption area */}
          <div className="p-3 space-y-2">
            <TropicalSkeleton className="h-4 w-3/4" variant="text" />
            <TropicalSkeleton className="h-3 w-1/2" variant="text" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Form Skeleton Loader
 * 
 * Displays a skeleton loader matching the shape of a form.
 */
interface FormSkeletonProps {
  fields?: number;
}

export function FormSkeleton({ fields = 5 }: FormSkeletonProps) {
  return (
    <div className="space-y-6" role="status" aria-label="Loading form">
      {[...Array(fields)].map((_, i) => (
        <div key={i}>
          {/* Label */}
          <TropicalSkeleton className="h-4 w-1/4 mb-2" variant="text" />
          
          {/* Input */}
          <TropicalSkeleton className="h-10 w-full" variant="rectangular" />
        </div>
      ))}
      
      {/* Submit button */}
      <div className="flex justify-end">
        <TropicalSkeleton className="h-10 w-32" variant="rectangular" />
      </div>
    </div>
  );
}

/**
 * Dashboard Skeleton Loader
 * 
 * Displays a skeleton loader for dashboard metrics and cards.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading dashboard">
      {/* Metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6">
            <TropicalSkeleton className="h-4 w-1/2 mb-3" variant="text" />
            <TropicalSkeleton className="h-8 w-3/4" variant="rectangular" />
          </div>
        ))}
      </div>
      
      {/* Main content cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton lines={5} />
        <CardSkeleton lines={5} />
      </div>
    </div>
  );
}

/**
 * Page Header Skeleton
 * 
 * Displays a skeleton loader for page headers with title and actions.
 */
export function PageHeaderSkeleton() {
  return (
    <div className="flex justify-between items-center mb-6" role="status" aria-label="Loading page header">
      <TropicalSkeleton className="h-8 w-1/3" variant="rectangular" />
      <TropicalSkeleton className="h-10 w-32" variant="rectangular" />
    </div>
  );
}

/**
 * List Skeleton Loader
 * 
 * Displays a skeleton loader for list items.
 */
interface ListSkeletonProps {
  items?: number;
}

export function ListSkeleton({ items = 5 }: ListSkeletonProps) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading list">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
          <TropicalSkeleton className="h-12 w-12" variant="circular" />
          <div className="flex-1 space-y-2">
            <TropicalSkeleton className="h-4 w-3/4" variant="text" />
            <TropicalSkeleton className="h-3 w-1/2" variant="text" />
          </div>
        </div>
      ))}
    </div>
  );
}
