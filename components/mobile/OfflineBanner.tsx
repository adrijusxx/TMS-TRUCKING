/**
 * Offline Banner
 *
 * Displays connectivity status and sync progress for the driver mobile PWA.
 * Shows a yellow banner when offline and a blue banner with sync progress
 * when coming back online with pending items.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePWA } from '@/hooks/usePWA';
import {
  getTotalPendingCount,
  getPendingSyncItems,
  markSynced,
  clearSyncedItems,
  type OfflineStore,
} from '@/lib/mobile/offline-storage';
import { WifiOff, RefreshCw, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';

type SyncState = 'idle' | 'syncing' | 'done';

export default function OfflineBanner() {
  const { isOffline } = usePWA();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncedCount, setSyncedCount] = useState(0);
  const [wasOffline, setWasOffline] = useState(false);

  // Track pending count while offline
  useEffect(() => {
    if (!isOffline) return;
    setWasOffline(true);

    const interval = setInterval(async () => {
      try {
        const count = await getTotalPendingCount();
        setPendingCount(count);
      } catch {
        // IndexedDB may not be available
      }
    }, 2000);

    // Initial check
    getTotalPendingCount()
      .then(setPendingCount)
      .catch(() => {});

    return () => clearInterval(interval);
  }, [isOffline]);

  const syncPendingItems = useCallback(async () => {
    const stores: OfflineStore[] = ['pending-status-updates', 'pending-uploads'];
    let synced = 0;

    for (const store of stores) {
      const items = await getPendingSyncItems(store);
      for (const item of items) {
        try {
          const payload = item.data as Record<string, unknown>;
          const endpoint = store === 'pending-status-updates'
            ? apiUrl(`/api/mobile/loads/${payload.loadId}`)
            : apiUrl('/api/documents/upload');

          const response = await fetch(endpoint, {
            method: store === 'pending-status-updates' ? 'PATCH' : 'POST',
            headers: store === 'pending-status-updates'
              ? { 'Content-Type': 'application/json' }
              : undefined,
            body: store === 'pending-status-updates'
              ? JSON.stringify(payload)
              : (payload.formData as BodyInit),
          });

          if (response.ok) {
            await markSynced(store, item.key);
            synced++;
            setSyncedCount(synced);
          }
        } catch {
          // Will retry on next sync
        }
      }
      await clearSyncedItems(store);
    }

    return synced;
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOffline || !wasOffline) return;

    const doSync = async () => {
      const count = await getTotalPendingCount();
      if (count === 0) {
        setWasOffline(false);
        return;
      }

      setPendingCount(count);
      setSyncState('syncing');
      setSyncedCount(0);

      try {
        const synced = await syncPendingItems();
        setSyncState('done');

        if (synced > 0) {
          toast.success(`Synced ${synced} item${synced !== 1 ? 's' : ''} successfully`);
        }
      } catch {
        toast.error('Some items failed to sync. They will retry later.');
      }

      // Reset after a delay
      setTimeout(() => {
        setSyncState('idle');
        setPendingCount(0);
        setSyncedCount(0);
        setWasOffline(false);
      }, 3000);
    };

    doSync();
  }, [isOffline, wasOffline, syncPendingItems]);

  // Nothing to show
  if (!isOffline && syncState === 'idle' && !wasOffline) return null;
  if (!isOffline && pendingCount === 0 && syncState === 'idle') return null;

  return (
    <div
      className={cn(
        'sticky top-0 left-0 right-0 z-50 px-4 py-2.5 text-center text-sm font-medium transition-all',
        isOffline && 'bg-yellow-500 text-yellow-950',
        !isOffline && syncState === 'syncing' && 'bg-blue-500 text-white',
        !isOffline && syncState === 'done' && 'bg-green-500 text-white',
      )}
    >
      {isOffline ? (
        <div className="flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span>
            You are offline.
            {pendingCount > 0 && ` ${pendingCount} item${pendingCount !== 1 ? 's' : ''} pending sync.`}
          </span>
        </div>
      ) : syncState === 'syncing' ? (
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>
            Syncing {syncedCount} of {pendingCount} item{pendingCount !== 1 ? 's' : ''}...
          </span>
        </div>
      ) : syncState === 'done' ? (
        <div className="flex items-center justify-center gap-2">
          <Check className="h-4 w-4" />
          <span>All items synced successfully</span>
        </div>
      ) : pendingCount > 0 ? (
        <button
          onClick={() => {
            setSyncState('syncing');
            syncPendingItems().then(() => setSyncState('done'));
          }}
          className="flex items-center justify-center gap-2 w-full"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Tap to sync {pendingCount} pending item{pendingCount !== 1 ? 's' : ''}</span>
        </button>
      ) : null}
    </div>
  );
}
