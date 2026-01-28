'use client';

import { useState, useEffect, useCallback } from 'react';

interface PWAState {
  isOnline: boolean;
  isInstalled: boolean;
  isUpdateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

interface UsePWAReturn extends PWAState {
  installPrompt: () => Promise<void>;
  updateServiceWorker: () => Promise<void>;
  cacheItinerary: (data: unknown) => Promise<void>;
  clearCache: () => Promise<void>;
}

/**
 * PWA Hook
 * 
 * Manages Progressive Web App functionality including:
 * - Service worker registration
 * - Online/offline status
 * - Install prompt
 * - Update notifications
 * - Itinerary caching
 */
export function usePWA(): UsePWAReturn {
  const [state, setState] = useState<PWAState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isInstalled: false,
    isUpdateAvailable: false,
    registration: null,
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  /**
   * Register service worker
   */
  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('[PWA] Service worker registered:', registration);

        setState(prev => ({ ...prev, registration }));

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] Update available');
                setState(prev => ({ ...prev, isUpdateAvailable: true }));
              }
            });
          }
        });

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute

        return registration;
      } catch (error) {
        console.error('[PWA] Service worker registration failed:', error);
        return null;
      }
    }
    return null;
  }, []);

  /**
   * Handle online/offline events
   */
  useEffect(() => {
    const handleOnline = () => {
      console.log('[PWA] Online');
      setState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      console.log('[PWA] Offline');
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Handle install prompt
   */
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('[PWA] Install prompt available');
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      console.log('[PWA] App installed');
      setState(prev => ({ ...prev, isInstalled: true }));
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setState(prev => ({ ...prev, isInstalled: true }));
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  /**
   * Register service worker on mount
   */
  useEffect(() => {
    registerServiceWorker();
  }, [registerServiceWorker]);

  /**
   * Show install prompt
   */
  const installPrompt = useCallback(async () => {
    if (!deferredPrompt) {
      console.log('[PWA] No install prompt available');
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] Install prompt outcome:', outcome);

      if (outcome === 'accepted') {
        setState(prev => ({ ...prev, isInstalled: true }));
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
    }
  }, [deferredPrompt]);

  /**
   * Update service worker
   */
  const updateServiceWorker = useCallback(async () => {
    if (!state.registration) {
      console.log('[PWA] No registration available');
      return;
    }

    try {
      const newWorker = state.registration.waiting;
      if (newWorker) {
        newWorker.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    } catch (error) {
      console.error('[PWA] Update failed:', error);
    }
  }, [state.registration]);

  /**
   * Cache itinerary data
   */
  const cacheItinerary = useCallback(async (data: unknown) => {
    if (!state.registration) {
      console.log('[PWA] No registration available');
      return;
    }

    try {
      const controller = navigator.serviceWorker.controller;
      if (controller) {
        controller.postMessage({
          type: 'CACHE_ITINERARY',
          payload: data,
        });
        console.log('[PWA] Itinerary cache requested');
      }
    } catch (error) {
      console.error('[PWA] Cache itinerary failed:', error);
    }
  }, [state.registration]);

  /**
   * Clear all caches
   */
  const clearCache = useCallback(async () => {
    if (!state.registration) {
      console.log('[PWA] No registration available');
      return;
    }

    try {
      const controller = navigator.serviceWorker.controller;
      if (controller) {
        controller.postMessage({ type: 'CLEAR_CACHE' });
        console.log('[PWA] Cache clear requested');
      }
    } catch (error) {
      console.error('[PWA] Clear cache failed:', error);
    }
  }, [state.registration]);

  return {
    ...state,
    installPrompt,
    updateServiceWorker,
    cacheItinerary,
    clearCache,
  };
}
