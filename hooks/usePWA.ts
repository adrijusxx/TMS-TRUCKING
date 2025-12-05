/**
 * PWA Hook
 * 
 * Manages PWA installation, offline status, and background sync.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  isUpdateAvailable: boolean;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOffline: false,
    isUpdateAvailable: false,
  });
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setState((prev) => ({ ...prev, isInstalled: isStandalone }));

    // Check online status
    const updateOnlineStatus = () => {
      setState((prev) => ({ ...prev, isOffline: !navigator.onLine }));
    };
    updateOnlineStatus();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setState((prev) => ({ ...prev, isInstallable: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setState((prev) => ({
        ...prev,
        isInstallable: false,
        isInstalled: true,
      }));
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setState((prev) => ({ ...prev, isUpdateAvailable: true }));
              }
            });
          }
        });
      });
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setState((prev) => ({
          ...prev,
          isInstallable: false,
          isInstalled: true,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Install error:', error);
      return false;
    }
  }, [deferredPrompt]);

  const update = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      });
    }
  }, []);

  return {
    ...state,
    install,
    update,
  };
}

/**
 * Hook for background sync
 */
export function useBackgroundSync() {
  const requestSync = useCallback(async (tag: string) => {
    if ('serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register(tag);
        return true;
      } catch (error) {
        console.error('Background sync registration failed:', error);
        return false;
      }
    }
    return false;
  }, []);

  return { requestSync };
}

/**
 * Hook for offline data storage
 */
export function useOfflineStorage() {
  const saveForSync = useCallback(async (
    store: 'pending-uploads' | 'pending-status-updates',
    data: Record<string, unknown>
  ) => {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('driver-pwa', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(store, 'readwrite');
        const objStore = tx.objectStore(store);
        
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        objStore.add({ ...data, id });
        
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('pending-uploads')) {
          db.createObjectStore('pending-uploads', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('pending-status-updates')) {
          db.createObjectStore('pending-status-updates', { keyPath: 'id' });
        }
      };
    });
  }, []);

  return { saveForSync };
}





