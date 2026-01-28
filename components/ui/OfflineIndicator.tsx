'use client';

import { usePWA } from '@/hooks/usePWA';

/**
 * Offline Indicator Component
 * 
 * Displays a banner when the user is offline.
 * Shows sync queue status and provides retry option.
 */
export function OfflineIndicator() {
  const { isOnline } = usePWA();

  if (isOnline) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 bg-volcano-500 text-white px-4 py-2 text-center z-50 safe-top"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center justify-center space-x-2">
        <span className="text-lg">📡</span>
        <span className="text-sm font-medium">
          You're offline. Changes will sync when you reconnect.
        </span>
      </div>
    </div>
  );
}

/**
 * Update Available Banner
 * 
 * Displays a banner when a service worker update is available.
 */
export function UpdateAvailableBanner() {
  const { isUpdateAvailable, updateServiceWorker } = usePWA();

  if (!isUpdateAvailable) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 bg-ocean-500 text-white px-4 py-3 text-center z-50 safe-top"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center justify-center space-x-4">
        <span className="text-sm font-medium">
          A new version is available!
        </span>
        <button
          onClick={updateServiceWorker}
          className="px-4 py-1 bg-white text-ocean-600 rounded-lg text-sm font-medium hover:bg-ocean-50 transition-colors tap-target"
        >
          Update Now
        </button>
      </div>
    </div>
  );
}

/**
 * Install Prompt Banner
 * 
 * Displays a banner prompting the user to install the PWA.
 */
export function InstallPromptBanner() {
  const { isInstalled, installPrompt } = usePWA();

  if (isInstalled) {
    return null;
  }

  return (
    <div
      className="fixed bottom-20 left-4 right-4 bg-jungle-500 text-white px-4 py-3 rounded-lg shadow-lg z-40 safe-bottom md:left-auto md:right-4 md:max-w-sm"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start justify-between space-x-4">
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">
            Install Costa Rica Wedding
          </p>
          <p className="text-xs opacity-90">
            Access your wedding info offline and get quick access from your home screen!
          </p>
        </div>
        <button
          onClick={installPrompt}
          className="px-4 py-2 bg-white text-jungle-600 rounded-lg text-sm font-medium hover:bg-jungle-50 transition-colors tap-target flex-shrink-0"
        >
          Install
        </button>
      </div>
    </div>
  );
}
