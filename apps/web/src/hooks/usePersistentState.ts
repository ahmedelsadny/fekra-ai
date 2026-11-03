'use client';

import { useState, useEffect } from 'react';

/**
 * Like useState, but the value is automatically persisted to localStorage
 * and restored on mount. Hydration-safe for Next.js (client-side only effects).
 */
export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // Restore persisted value once on mount (client-side only)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(key);
      if (saved !== null) {
        setValue(JSON.parse(saved) as T);
      }
    } catch {
      // Corrupted or unavailable storage — keep initial value
    }
    setIsHydrated(true);
  }, [key]);

  // Persist on every change — but only AFTER hydration,
  // so we never overwrite stored data with the initial value.
  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or unavailable — ignore
    }
  }, [key, value, isHydrated]);

  return [value, setValue] as const;
}
