import { TropicalIcon } from './TropicalIcon';

interface TropicalLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

/**
 * Tropical Loading Component
 * 
 * Costa Rica-themed loading indicator with tropical animations.
 * Includes screen reader announcements for accessibility.
 */
export function TropicalLoading({
  message = 'Loading...',
  size = 'md',
  fullScreen = false,
}: TropicalLoadingProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const iconSizes = {
    sm: 'md' as const,
    md: 'lg' as const,
    lg: 'xl' as const,
  };

  const content = (
    <div 
      className="flex flex-col items-center justify-center space-y-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center space-x-2">
        <TropicalIcon name="palm" size={iconSizes[size]} animate className="text-jungle-500" />
        <TropicalIcon name="sun" size={iconSizes[size]} animate className="text-sunset-500" />
        <TropicalIcon name="wave" size={iconSizes[size]} animate className="text-ocean-500" />
      </div>
      <p className={`${sizeClasses[size]} text-sage-600 animate-pulse-gentle`}>{message}</p>
      <span className="sr-only">{message}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-cloud-100 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return <div className="py-8">{content}</div>;
}

/**
 * Tropical Spinner Component
 * 
 * Simple spinner with Costa Rica colors.
 */
export function TropicalSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-3',
    lg: 'h-16 w-16 border-4',
  };

  return (
    <div
      className={`${sizeClasses[size]} border-jungle-200 border-t-jungle-600 rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );
}

/**
 * Tropical Skeleton Component
 * 
 * Skeleton loader with Costa Rica theming.
 */
export function TropicalSkeleton({
  className = '',
  variant = 'text',
}: {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}) {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={`bg-gradient-to-r from-sage-100 via-sage-200 to-sage-100 animate-pulse-gentle ${variantClasses[variant]} ${className}`}
      role="status"
      aria-label="Loading content"
    />
  );
}
