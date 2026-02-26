'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface KeyboardShortcut {
  /** Unique key for this shortcut */
  id: string;
  /** Keys to display (e.g., "G then L") */
  keys: string;
  /** Human-readable label */
  label: string;
  /** Category for grouping in cheat sheet */
  category: 'navigation' | 'actions' | 'views';
}

/** All registered keyboard shortcuts for the cheat sheet */
export const SHORTCUTS: KeyboardShortcut[] = [
  // Navigation — "G then X" go-to pattern (like GitHub)
  { id: 'go-dashboard', keys: 'G D', label: 'Go to Dashboard', category: 'navigation' },
  { id: 'go-loads', keys: 'G L', label: 'Go to Loads', category: 'navigation' },
  { id: 'go-drivers', keys: 'G R', label: 'Go to Drivers', category: 'navigation' },
  { id: 'go-trucks', keys: 'G T', label: 'Go to Trucks', category: 'navigation' },
  { id: 'go-invoices', keys: 'G I', label: 'Go to Invoices', category: 'navigation' },
  { id: 'go-settlements', keys: 'G S', label: 'Go to Settlements', category: 'navigation' },
  { id: 'go-customers', keys: 'G C', label: 'Go to Customers', category: 'navigation' },
  { id: 'go-safety', keys: 'G F', label: 'Go to Safety', category: 'navigation' },

  // Actions
  { id: 'search', keys: 'Ctrl+K', label: 'Open Search', category: 'actions' },
  { id: 'shortcuts', keys: '?', label: 'Show Shortcuts', category: 'actions' },

  // Views
  { id: 'go-settings', keys: 'G ,', label: 'Go to Settings', category: 'views' },
  { id: 'go-fleet', keys: 'G E', label: 'Go to Fleet', category: 'views' },
  { id: 'go-analytics', keys: 'G A', label: 'Go to Analytics', category: 'views' },
];

const NAV_ROUTES: Record<string, string> = {
  d: '/dashboard',
  l: '/dashboard/loads',
  r: '/dashboard/drivers',
  t: '/dashboard/trucks',
  i: '/dashboard/invoices',
  s: '/dashboard/settlements',
  c: '/dashboard/customers',
  f: '/dashboard/safety',
  e: '/dashboard/fleet',
  a: '/dashboard/analytics',
  ',': '/dashboard/settings',
};

/**
 * Enables keyboard shortcuts across the dashboard.
 * Uses a "G then X" pattern for navigation (like GitHub).
 * Press "?" to open the shortcut cheat sheet.
 *
 * @param onShowShortcuts - callback to open the cheat sheet dialog
 */
export function useKeyboardShortcuts(onShowShortcuts?: () => void) {
  const router = useRouter();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip when user is typing in an input/textarea/contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      // "?" opens cheat sheet
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onShowShortcuts?.();
        return;
      }

      // "G" starts the go-to sequence
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        // Listen for the next key press within 1.5s
        const handleSecondKey = (e2: KeyboardEvent) => {
          const t2 = e2.target as HTMLElement;
          if (t2.tagName === 'INPUT' || t2.tagName === 'TEXTAREA' || t2.isContentEditable) {
            return;
          }

          const route = NAV_ROUTES[e2.key.toLowerCase()];
          if (route) {
            e2.preventDefault();
            router.push(route);
          }
          cleanup();
        };

        const cleanup = () => {
          document.removeEventListener('keydown', handleSecondKey);
          clearTimeout(timeout);
        };

        const timeout = setTimeout(cleanup, 1500);
        document.addEventListener('keydown', handleSecondKey, { once: true });
      }
    },
    [router, onShowShortcuts]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
