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

  // Use inline styles for colors to ensure visibility
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: '#22c55e',
      color: '#ffffff',
    },
    secondary: {
      backgroundColor: '#e5e7eb',
      color: '#111827',
    },
    danger: {
      backgroundColor: '#ef4444',
      color: '#ffffff',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#374151',
    },
  };

  const hoverStyles: Record<string, string> = {
    primary: '#16a34a',
    secondary: '#d1d5db',
    danger: '#dc2626',
    ghost: '#f3f4f6',
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
      style={variantStyles[variant]}
      className={`${baseClasses} ${sizeClasses[size]} ${widthClass} ${className} ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      onMouseEnter={(e) => {
        if (!isDisabled && variant !== 'ghost') {
          e.currentTarget.style.backgroundColor = hoverStyles[variant];
        } else if (!isDisabled && variant === 'ghost') {
          e.currentTarget.style.backgroundColor = hoverStyles[variant];
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = variantStyles[variant].backgroundColor as string;
        }
      }}
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
