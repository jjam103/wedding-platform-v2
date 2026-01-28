'use client';

import { useEffect, useRef } from 'react';

interface LiveRegionProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearAfter?: number; // Clear message after X milliseconds
}

/**
 * LiveRegion Component
 * 
 * ARIA live region for announcing dynamic content changes to screen readers.
 * 
 * Features:
 * - Polite or assertive announcements
 * - Auto-clear after specified time
 * - Visually hidden but accessible to screen readers
 * 
 * @example
 * <LiveRegion message="Guest created successfully" priority="polite" clearAfter={3000} />
 */
export function LiveRegion({ message, priority = 'polite', clearAfter }: LiveRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!message || !regionRef.current) return;

    // Clear and set message with slight delay for screen readers to detect change
    regionRef.current.textContent = '';
    const timer = setTimeout(() => {
      if (regionRef.current) {
        regionRef.current.textContent = message;
      }
    }, 100);

    // Auto-clear if specified
    let clearTimer: NodeJS.Timeout | undefined;
    if (clearAfter) {
      clearTimer = setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = '';
        }
      }, clearAfter);
    }

    return () => {
      clearTimeout(timer);
      if (clearTimer) clearTimeout(clearTimer);
    };
  }, [message, clearAfter]);

  return (
    <div
      ref={regionRef}
      role={priority === 'assertive' ? 'alert' : 'status'}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    />
  );
}

/**
 * VisuallyHidden Component
 * 
 * Hides content visually but keeps it accessible to screen readers.
 * 
 * @example
 * <VisuallyHidden>Additional context for screen readers</VisuallyHidden>
 */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
