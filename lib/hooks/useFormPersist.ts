'use client';

import { useEffect, useCallback, useRef } from 'react';
import type { UseFormReturn, FieldValues } from 'react-hook-form';

interface UseFormPersistOptions {
  /** Unique key for sessionStorage. Should be stable per form instance. */
  key: string;
  /** React Hook Form instance */
  form: UseFormReturn<any>;
  /** Fields to exclude from persistence (e.g., passwords, tokens) */
  exclude?: string[];
  /** Debounce interval in ms for saving (default: 500) */
  debounceMs?: number;
  /** Whether persistence is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Persists React Hook Form state to sessionStorage.
 * Auto-restores on mount, auto-saves on changes, clears on successful submit.
 *
 * Usage:
 * ```tsx
 * const form = useForm({ defaultValues: { ... } });
 * const { clear } = useFormPersist({ key: 'load-form', form });
 *
 * const onSubmit = async (data) => {
 *   await saveData(data);
 *   clear(); // Clear persisted state on success
 * };
 * ```
 */
export function useFormPersist({
  key,
  form,
  exclude = [],
  debounceMs = 500,
  enabled = true,
}: UseFormPersistOptions) {
  const storageKey = `form-persist:${key}`;
  const isRestoredRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore from sessionStorage on mount
  useEffect(() => {
    if (!enabled || isRestoredRef.current) return;
    isRestoredRef.current = true;

    try {
      const stored = sessionStorage.getItem(storageKey);
      if (!stored) return;

      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        // Reset form with stored values, merging with defaults
        const currentValues = form.getValues();
        const mergedValues = { ...currentValues, ...parsed };

        // Remove excluded fields
        for (const field of exclude) {
          delete mergedValues[field];
        }

        form.reset(mergedValues, { keepDefaultValues: true });
      }
    } catch {
      // Invalid stored data — clear it
      sessionStorage.removeItem(storageKey);
    }
  }, [storageKey, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Watch all fields and save on change (debounced)
  useEffect(() => {
    if (!enabled) return;

    const subscription = form.watch((values) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        try {
          const toStore = { ...values };

          // Remove excluded fields
          for (const field of exclude) {
            delete toStore[field];
          }

          sessionStorage.setItem(storageKey, JSON.stringify(toStore));
        } catch {
          // Storage full or unavailable — fail silently
        }
      }, debounceMs);
    });

    return () => {
      subscription.unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [form, storageKey, exclude, debounceMs, enabled]);

  // Clear persisted data
  const clear = useCallback(() => {
    sessionStorage.removeItem(storageKey);
  }, [storageKey]);

  // Check if there is persisted data
  const hasPersisted = useCallback(() => {
    try {
      return sessionStorage.getItem(storageKey) !== null;
    } catch {
      return false;
    }
  }, [storageKey]);

  return { clear, hasPersisted };
}
