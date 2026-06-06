"use client";
// Runtime mock/real switch. The env var NEXT_PUBLIC_USE_MOCK sets the initial
// default; the UI toggle overrides it at runtime and persists to localStorage.
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "rushhour-mock";
const EVENT = "rushhour-mock-change";
const ENV_DEFAULT = process.env.NEXT_PUBLIC_USE_MOCK === "true";

let current: boolean | null = null;

function read(): boolean {
  if (current !== null) return current;
  if (typeof window === "undefined") return ENV_DEFAULT;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  current = stored === null ? ENV_DEFAULT : stored === "true";
  return current;
}

export function getMockMode(): boolean {
  return read();
}

export function setMockMode(value: boolean): void {
  current = value;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, String(value));
    window.dispatchEvent(new CustomEvent(EVENT));
  }
}

// React hook so components re-render when the mode flips anywhere.
export function useMockMode(): [boolean, (v: boolean) => void] {
  // Start from ENV_DEFAULT on both server and first client paint to avoid a
  // hydration mismatch; reconcile with localStorage after mount.
  const [mode, setMode] = useState(ENV_DEFAULT);
  useEffect(() => {
    setMode(read());
    const onChange = () => setMode(read());
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);
  const update = useCallback((v: boolean) => setMockMode(v), []);
  return [mode, update];
}
