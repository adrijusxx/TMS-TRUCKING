'use client';

import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * Unified click-to-call hook.
 *
 * Priority:
 * 1. Desk phone via NS API (if VoIP enabled) — rings user's device first
 * 2. Native tel: link fallback
 */
export function useClickToCall() {
  const [calling, setCalling] = useState(false);
  const settingsCache = useRef<{ enabled: boolean; fetched: boolean }>({
    enabled: false,
    fetched: false,
  });

  const initiateCall = useCallback(
    async (destination: string, e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }

      if (!destination) {
        toast.error('No phone number available');
        return;
      }

      setCalling(true);
      try {
        // Cache VoIP settings to avoid repeated fetches
        if (!settingsCache.current.fetched) {
          const settingsRes = await fetch('/api/user/voip-settings');
          const settingsData = await settingsRes.json();
          settingsCache.current = {
            enabled: !!settingsData?.voipConfig?.enabled,
            fetched: true,
          };
        }

        if (settingsCache.current.enabled) {
          toast.info('Initiating call via PBX...');
          const callRes = await fetch('/api/communications/call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destination }),
          });
          const callData = await callRes.json();
          if (!callRes.ok) throw new Error(callData.error);
          toast.success('Call initiated! Check your device.');
        } else {
          window.location.href = `tel:${destination}`;
        }
      } catch (err) {
        console.error('Call failed:', err);
        window.location.href = `tel:${destination}`;
      } finally {
        setCalling(false);
      }
    },
    [],
  );

  return { initiateCall, calling };
}
