import { memo } from 'react';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

/**
 * Base Card Component
 * 
 * Modern card component with header, body, and footer sections.
 * Designed for admin interface with consistent styling.
 * Memoized to prevent unnecessary re-renders.
 */
export const Card = memo(function Card({ children, className = '', onClick }: CardProps) {
  const baseClasses = 'bg-white rounded-lg shadow-md border border-sage-200 overflow-hidden transition-all duration-200';
  const clickableClass = onClick ? 'cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]' : '';

  return (
    <div
      className={`${baseClasses} ${clickableClass} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {children}
    </div>
  );
});

/**
 * Card Header Component
 * 
 * Header section for Card component with bottom border.
 * Memoized to prevent unnecessary re-renders.
 */
export const CardHeader = memo(function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`px-6 py-4 border-b border-sage-200 ${className}`}>
      {children}
    </div>
  );
});

/**
 * Card Body Component
 * 
 * Main content section for Card component.
 * Memoized to prevent unnecessary re-renders.
 */
export const CardBody = memo(function CardBody({ children, className = '' }: CardBodyProps) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
});

/**
 * Card Footer Component
 * 
 * Footer section for Card component with top border.
 * Memoized to prevent unnecessary re-renders.
 */
export const CardFooter = memo(function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`px-6 py-4 border-t border-sage-200 ${className}`}>
      {children}
    </div>
  );
});
