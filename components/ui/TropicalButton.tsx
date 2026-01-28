import type { ReactNode } from 'react';
import { TropicalIcon } from './TropicalIcon';

interface TropicalButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: 'palm' | 'wave' | 'sun' | 'flower' | 'bird' | 'volcano' | 'beach';
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

/**
 * Tropical Button Component
 * 
 * Costa Rica-themed button with tropical styling and optional icons.
 */
export function TropicalButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  fullWidth = false,
  type = 'button',
  className = '',
}: TropicalButtonProps) {
  const baseClasses = 'font-medium rounded-lg transition-all tap-target flex items-center justify-center space-x-2';

  const variantClasses = {
    primary: 'bg-jungle-500 text-white hover:bg-jungle-600 active:bg-jungle-700 disabled:bg-sage-300',
    secondary: 'bg-white text-sage-700 border-2 border-sage-300 hover:border-sage-400 active:bg-sage-50 disabled:bg-sage-100',
    success: 'bg-ocean-500 text-white hover:bg-ocean-600 active:bg-ocean-700 disabled:bg-sage-300',
    warning: 'bg-sunset-500 text-white hover:bg-sunset-600 active:bg-sunset-700 disabled:bg-sage-300',
    danger: 'bg-volcano-500 text-white hover:bg-volcano-600 active:bg-volcano-700 disabled:bg-sage-300',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className} ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <TropicalIcon name={icon} size={size === 'sm' ? 'sm' : 'md'} />
          )}
          <span>{children}</span>
          {icon && iconPosition === 'right' && (
            <TropicalIcon name={icon} size={size === 'sm' ? 'sm' : 'md'} />
          )}
        </>
      )}
    </button>
  );
}

/**
 * Tropical Icon Button Component
 * 
 * Icon-only button with Costa Rica theming.
 */
export function TropicalIconButton({
  icon,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  ariaLabel,
  className = '',
}: {
  icon: 'palm' | 'wave' | 'sun' | 'flower' | 'bird' | 'volcano' | 'beach';
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  ariaLabel: string;
  className?: string;
}) {
  const baseClasses = 'rounded-full transition-all tap-target flex items-center justify-center';

  const variantClasses = {
    primary: 'bg-jungle-500 text-white hover:bg-jungle-600 active:bg-jungle-700',
    secondary: 'bg-white text-sage-700 border-2 border-sage-300 hover:border-sage-400 active:bg-sage-50',
    success: 'bg-ocean-500 text-white hover:bg-ocean-600 active:bg-ocean-700',
    warning: 'bg-sunset-500 text-white hover:bg-sunset-600 active:bg-sunset-700',
    danger: 'bg-volcano-500 text-white hover:bg-volcano-600 active:bg-volcano-700',
  };

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  const iconSizes = {
    sm: 'sm' as const,
    md: 'md' as const,
    lg: 'lg' as const,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <TropicalIcon name={icon} size={iconSizes[size]} />
    </button>
  );
}
