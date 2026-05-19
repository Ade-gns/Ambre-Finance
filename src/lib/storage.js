import { useState, useEffect } from "react";

const PREFIX = "ambre_";

export function save(key, value) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch {}
}

export function load(key, defaultValue) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw !== null ? JSON.parse(raw) : defaultValue;
  } catch { return defaultValue; }
}

/* Hook — remplace useState, persiste automatiquement dans localStorage. */
export function useLocalStorage(key, defaultValue) {
  const [state, setState] = useState(() => load(key, defaultValue));
  useEffect(() => { save(key, state); }, [key, state]);
  return [state, setState];
}
