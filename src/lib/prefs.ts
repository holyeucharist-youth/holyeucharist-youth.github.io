const PREFIX = 'att_pref_';

export function getPref<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setPref<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export function usePref<T>(key: string, fallback: T): [T, (v: T) => void] {
  // Not a React hook — returns a getter and setter pair for use in component state init.
  // Call getPref in useState initializer, call setPref in the setter.
  const get = () => getPref(key, fallback);
  const set = (v: T) => setPref(key, v);
  return [get(), set];
}
