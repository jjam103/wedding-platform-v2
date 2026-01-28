'use client';

import { ReactNode } from 'react';
import { OfflineIndicator, UpdateAvailableBanner } from '@/components/ui/OfflineIndicator';

interface PWAProviderProps {
  children: ReactNode;
}

/**
 * PWA Provider Component
 * 
 * Wraps the application with PWA functionality including:
 * - Offline indicator
 * - Update notifications
 * - Service worker management
 */
export function PWAProvider({ children }: PWAProviderProps) {
  return (
    <>
      <OfflineIndicator />
      <UpdateAvailableBanner />
      {children}
    </>
  );
}
