import { useState, useEffect, useRef } from "react";
import { dbGet, dbSet } from "./db";

export function save(key, value) { dbSet(key, value); }
export function load(key, defaultValue) { return dbGet(key, defaultValue); }

export function useLocalStorage(key, defaultValue) {
  const [state, setState] = useState(() => dbGet(key, defaultValue));
  const skipDispatch = useRef(false);

  // Persiste + notifie les autres instances du même key
  useEffect(() => {
    dbSet(key, state);
    if (!skipDispatch.current) {
      window.dispatchEvent(new CustomEvent("ambre:storage", { detail: { key, value: state } }));
    }
    skipDispatch.current = false;
  }, [key, state]);

  // Reçoit les mises à jour des autres instances
  useEffect(() => {
    const handler = e => {
      if (e.detail?.key === key) {
        skipDispatch.current = true; // on ne re-dispatche pas, pour éviter la boucle
        setState(e.detail.value);
      }
    };
    window.addEventListener("ambre:storage", handler);
    return () => window.removeEventListener("ambre:storage", handler);
  }, [key]);

  return [state, setState];
}
