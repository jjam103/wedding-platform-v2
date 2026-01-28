import { memo } from 'react';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

/**
 * Base Button Component
 * 
 * Modern button component with Costa Rica color palette variants.
 * Designed for admin interface with consistent styling.
 * Memoized to prevent unnecessary re-renders.
 */
export const Button = memo(function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:shadow-md active:scale-95';

  const variantClasses = {
    primary: 'bg-jungle-500 hover:bg-jungle-600 text-white focus:ring-jungle-500 disabled:bg-sage-300 disabled:hover:shadow-none',
    secondary: 'bg-sage-200 hover:bg-sage-300 text-sage-900 focus:ring-sage-400 disabled:bg-sage-100 disabled:hover:shadow-none',
    danger: 'bg-volcano-500 hover:bg-volcano-600 text-white focus:ring-volcano-500 disabled:bg-sage-300 disabled:hover:shadow-none',
    ghost: 'bg-transparent hover:bg-sage-100 text-sage-700 focus:ring-sage-400 disabled:bg-transparent disabled:text-sage-400 hover:shadow-none',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-[44px] md:min-h-0',
    md: 'px-4 py-2 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[44px]',
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className} ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      aria-busy={loading}
      aria-disabled={isDisabled}
      {...props}
    >
      {loading && (
        <div 
          className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"
          role="status"
          aria-label="Loading"
        />
      )}
      {children}
    </button>
  );
});
