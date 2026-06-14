import { useState, useEffect, useRef } from "react";
import { dbGet, dbSet } from "./db";

export function save(key, value) { dbSet(key, value); }
export function load(key, defaultValue) { return dbGet(key, defaultValue); }

export function useLocalStorage(key, defaultValue) {
  const [state, setState] = useState(() => dbGet(key, defaultValue));
  const skipDispatch = useRef(0);

  // Persiste + notifie les autres instances du même key
  useEffect(() => {
    dbSet(key, state);
    if (skipDispatch.current > 0) {
      skipDispatch.current--;
    } else {
      window.dispatchEvent(new CustomEvent("ambre:storage", { detail: { key, value: state } }));
    }
  }, [key, state]);

  // Reçoit les mises à jour des autres instances
  useEffect(() => {
    const handler = e => {
      if (e.detail?.key === key) {
        skipDispatch.current++;
        setState(e.detail.value);
      }
    };
    window.addEventListener("ambre:storage", handler);
    return () => window.removeEventListener("ambre:storage", handler);
  }, [key]);

  return [state, setState];
}
