/**
 * Service Worker for Driver PWA
 * 
 * Handles offline caching and background sync.
 * @see docs/specs/OPERATIONAL_OVERHAUL.MD Section 6
 */

// @ts-nocheck
import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Cache API responses
    {
      urlPattern: /^https?:\/\/.*\/api\/mobile\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        networkTimeoutSeconds: 10,
      },
    },
    // Cache static assets
    {
      urlPattern: /\.(?:js|css|woff2?)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    // Cache images
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    // Default cache for other requests
    ...defaultCache,
  ],
});

serwist.addEventListeners();

// Background sync for offline uploads
self.addEventListener('sync', (event) => {
  if (event.tag === 'upload-pod') {
    event.waitUntil(syncPODUploads());
  }
  if (event.tag === 'sync-status-update') {
    event.waitUntil(syncStatusUpdates());
  }
});

// Sync POD uploads when back online
async function syncPODUploads() {
  try {
    const db = await openIndexedDB();
    const pendingUploads = await db.getAll('pending-uploads');
    
    for (const upload of pendingUploads) {
      try {
        const formData = new FormData();
        formData.append('file', upload.file);
        formData.append('loadId', upload.loadId);
        formData.append('type', upload.type);
        
        const response = await fetch('/api/mobile/driver/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          await db.delete('pending-uploads', upload.id);
        }
      } catch (error) {
        console.error('Failed to sync upload:', error);
      }
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
}

// Sync status updates when back online
async function syncStatusUpdates() {
  try {
    const db = await openIndexedDB();
    const pendingUpdates = await db.getAll('pending-status-updates');
    
    for (const update of pendingUpdates) {
      try {
        const response = await fetch(`/api/mobile/driver/loads/${update.loadId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: update.status }),
        });
        
        if (response.ok) {
          await db.delete('pending-status-updates', update.id);
        }
      } catch (error) {
        console.error('Failed to sync status:', error);
      }
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
}

// IndexedDB helper
function openIndexedDB(): Promise<IDBDatabase & { getAll: (store: string) => Promise<any[]>; delete: (store: string, key: string) => Promise<void> }> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('driver-pwa', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result as IDBDatabase & { getAll: (store: string) => Promise<any[]>; delete: (store: string, key: string) => Promise<void> };
      
      db.getAll = (store: string) => {
        return new Promise((res, rej) => {
          const tx = db.transaction(store, 'readonly');
          const objStore = tx.objectStore(store);
          const req = objStore.getAll();
          req.onsuccess = () => res(req.result);
          req.onerror = () => rej(req.error);
        });
      };
      
      db.delete = (store: string, key: string) => {
        return new Promise((res, rej) => {
          const tx = db.transaction(store, 'readwrite');
          const objStore = tx.objectStore(store);
          const req = objStore.delete(key);
          req.onsuccess = () => res();
          req.onerror = () => rej(req.error);
        });
      };
      
      resolve(db);
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
}



