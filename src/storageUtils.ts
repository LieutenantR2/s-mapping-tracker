export function getStoredNumericConfig(key: string, defaultVal: number) {
  const storedVal = localStorage.getItem(key);
  if (storedVal === null || !storedVal.match(/^\d+$/)) {
    return defaultVal;
  }
  return parseInt(storedVal);
}

export function getStoredBooleanConfig(key: string, defaultVal: boolean) {
  const storedVal = localStorage.getItem(key);
  if (storedVal === null || !storedVal.match(/^(true|false)$/i)) {
    return defaultVal;
  }
  return storedVal.toLowerCase() === 'true';
}

export function getStoredArrayConfig<T>(key: string, defaultVal: T[]) {
  const storedVal = localStorage.getItem(key);
  if (storedVal === null) {
    return defaultVal;
  }
  try {
    return JSON.parse(storedVal) as T[];
  } catch {
    return defaultVal;
  }
}
