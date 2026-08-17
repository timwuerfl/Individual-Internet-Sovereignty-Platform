import { useEffect, useState } from "react";

// Like useState, but persists to localStorage so demo edits survive reloads.
// // TODO: backend — replace with server-side persistence (API mutations).
export function usePersistentState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const storageKey = `icp:${key}`;
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      /* ignore quota / private-mode errors */
    }
  }, [storageKey, value]);

  return [value, setValue];
}
