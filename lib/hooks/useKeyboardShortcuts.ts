'use client';

import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description?: string;
}

/**
 * Hook for managing keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        // Check if we're in an input field (don't trigger shortcuts)
        const isInputFocused =
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement ||
          (event.target as HTMLElement)?.isContentEditable;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && !isInputFocused) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

/**
 * Common keyboard shortcuts for TMS
 */
export const commonShortcuts = {
  newLoad: { key: 'n', ctrl: true, description: 'Create new load' },
  search: { key: 'k', ctrl: true, description: 'Focus search' },
  save: { key: 's', ctrl: true, description: 'Save' },
  refresh: { key: 'r', ctrl: true, description: 'Refresh' },
  export: { key: 'e', ctrl: true, shift: true, description: 'Export data' },
  close: { key: 'Escape', description: 'Close dialog/modal' },
};

