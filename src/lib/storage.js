import { useState, useEffect } from "react";
import { dbGet, dbSet } from "./db";

export function save(key, value) { dbSet(key, value); }
export function load(key, defaultValue) { return dbGet(key, defaultValue); }

export function useLocalStorage(key, defaultValue) {
  const [state, setState] = useState(() => dbGet(key, defaultValue));
  useEffect(() => {
    dbSet(key, state);
    window.dispatchEvent(new CustomEvent("ambre:storage", { detail: { key, value: state } }));
  }, [key, state]);
  return [state, setState];
}
