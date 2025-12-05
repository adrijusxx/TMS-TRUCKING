'use client';

/**
 * Offline Indicator
 * 
 * Shows when the app is offline and pending sync items.
 */

import { usePWA } from '@/hooks/usePWA';
import { WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const { isOffline, isUpdateAvailable, update } = usePWA();

  if (!isOffline && !isUpdateAvailable) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium transition-all',
        isOffline
          ? 'bg-yellow-500 text-yellow-950'
          : 'bg-blue-500 text-white'
      )}
    >
      {isOffline ? (
        <div className="flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span>You&apos;re offline. Changes will sync when connected.</span>
        </div>
      ) : isUpdateAvailable ? (
        <button
          onClick={update}
          className="flex items-center justify-center gap-2 w-full"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Update available. Tap to refresh.</span>
        </button>
      ) : null}
    </div>
  );
}





