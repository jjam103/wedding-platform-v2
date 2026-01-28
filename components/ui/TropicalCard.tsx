import type { ReactNode } from 'react';
import { TropicalIcon } from './TropicalIcon';

interface TropicalCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  icon?: 'palm' | 'wave' | 'sun' | 'flower' | 'bird' | 'volcano' | 'beach';
  variant?: 'default' | 'jungle' | 'ocean' | 'sunset' | 'volcano';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Tropical Card Component
 * 
 * Costa Rica-themed card with optional header, icon, and color variants.
 */
export function TropicalCard({
  children,
  title,
  subtitle,
  icon,
  variant = 'default',
  hover = false,
  className = '',
  onClick,
}: TropicalCardProps) {
  const baseClasses = 'bg-white rounded-lg shadow-sm border p-4 sm:p-6 transition-all';

  const variantClasses = {
    default: 'border-sage-200',
    jungle: 'border-jungle-200 hover:border-jungle-400',
    ocean: 'border-ocean-200 hover:border-ocean-400',
    sunset: 'border-sunset-200 hover:border-sunset-400',
    volcano: 'border-volcano-200 hover:border-volcano-400',
  };

  const hoverClass = hover ? 'hover:shadow-md cursor-pointer' : '';
  const clickableClass = onClick ? 'cursor-pointer' : '';

  const iconColors = {
    default: 'text-sage-500',
    jungle: 'text-jungle-500',
    ocean: 'text-ocean-500',
    sunset: 'text-sunset-500',
    volcano: 'text-volcano-500',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${hoverClass} ${clickableClass} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {(title || subtitle || icon) && (
        <div className="flex items-start space-x-3 mb-4">
          {icon && (
            <div className={iconColors[variant]}>
              <TropicalIcon name={icon} size="lg" />
            </div>
          )}
          <div className="flex-1">
            {title && <h3 className="text-lg font-semibold text-sage-900">{title}</h3>}
            {subtitle && <p className="text-sm text-sage-600 mt-1">{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * Tropical Info Card Component
 * 
 * Card with icon and colored accent for displaying information.
 */
export function TropicalInfoCard({
  title,
  value,
  icon,
  variant = 'jungle',
  trend,
  className = '',
}: {
  title: string;
  value: string | number;
  icon: 'palm' | 'wave' | 'sun' | 'flower' | 'bird' | 'volcano' | 'beach';
  variant?: 'jungle' | 'ocean' | 'sunset' | 'volcano';
  trend?: { value: number; label: string };
  className?: string;
}) {
  const variantClasses = {
    jungle: 'bg-jungle-50 border-jungle-200 text-jungle-600',
    ocean: 'bg-ocean-50 border-ocean-200 text-ocean-600',
    sunset: 'bg-sunset-50 border-sunset-200 text-sunset-600',
    volcano: 'bg-volcano-50 border-volcano-200 text-volcano-600',
  };

  const iconColors = {
    jungle: 'text-jungle-500',
    ocean: 'text-ocean-500',
    sunset: 'text-sunset-500',
    volcano: 'text-volcano-500',
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-sage-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`p-3 rounded-lg ${variantClasses[variant]}`}>
          <TropicalIcon name={icon} size="lg" className={iconColors[variant]} />
        </div>
        {trend && (
          <div className="text-right">
            <div
              className={`text-sm font-medium ${
                trend.value >= 0 ? 'text-jungle-600' : 'text-volcano-600'
              }`}
            >
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
            </div>
            <div className="text-xs text-sage-500">{trend.label}</div>
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-sage-900 mb-1">{value}</div>
      <div className="text-sm text-sage-600">{title}</div>
    </div>
  );
}

/**
 * Tropical Feature Card Component
 * 
 * Card for displaying features with icon and description.
 */
export function TropicalFeatureCard({
  title,
  description,
  icon,
  variant = 'jungle',
  className = '',
}: {
  title: string;
  description: string;
  icon: 'palm' | 'wave' | 'sun' | 'flower' | 'bird' | 'volcano' | 'beach';
  variant?: 'jungle' | 'ocean' | 'sunset' | 'volcano';
  className?: string;
}) {
  const variantClasses = {
    jungle: 'border-jungle-200 hover:border-jungle-400 hover:bg-jungle-50',
    ocean: 'border-ocean-200 hover:border-ocean-400 hover:bg-ocean-50',
    sunset: 'border-sunset-200 hover:border-sunset-400 hover:bg-sunset-50',
    volcano: 'border-volcano-200 hover:border-volcano-400 hover:bg-volcano-50',
  };

  const iconColors = {
    jungle: 'text-jungle-500',
    ocean: 'text-ocean-500',
    sunset: 'text-sunset-500',
    volcano: 'text-volcano-500',
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border-2 p-6 transition-all hover:shadow-md ${variantClasses[variant]} ${className}`}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className={iconColors[variant]}>
          <TropicalIcon name={icon} size="xl" />
        </div>
        <h3 className="text-lg font-semibold text-sage-900">{title}</h3>
        <p className="text-sm text-sage-600">{description}</p>
      </div>
    </div>
  );
}
