/**
 * Safe localStorage Utilities
 * 
 * Provides safe wrappers around localStorage operations that handle
 * SecurityError exceptions that can occur in certain browser contexts
 * (e.g., sandboxed iframes, private browsing mode, or when storage is disabled).
 * 
 * These utilities ensure the application doesn't crash when localStorage
 * is unavailable and provide graceful fallbacks.
 */

/**
 * Safely retrieves an item from localStorage
 * 
 * @param key - The localStorage key to retrieve
 * @returns The stored value or null if unavailable/error
 */
export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    // Handle SecurityError or other localStorage access errors
    console.warn(`Failed to read from localStorage (key: ${key}):`, error);
    return null;
  }
}

/**
 * Safely sets an item in localStorage
 * 
 * @param key - The localStorage key to set
 * @param value - The value to store
 * @returns true if successful, false if error occurred
 */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    // Handle SecurityError, QuotaExceededError, or other localStorage access errors
    console.warn(`Failed to write to localStorage (key: ${key}):`, error);
    return false;
  }
}

/**
 * Safely removes an item from localStorage
 * 
 * @param key - The localStorage key to remove
 * @returns true if successful, false if error occurred
 */
export function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    // Handle SecurityError or other localStorage access errors
    console.warn(`Failed to remove from localStorage (key: ${key}):`, error);
    return false;
  }
}

/**
 * Safely clears all items from localStorage
 * 
 * @returns true if successful, false if error occurred
 */
export function safeClear(): boolean {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    // Handle SecurityError or other localStorage access errors
    console.warn('Failed to clear localStorage:', error);
    return false;
  }
}

/**
 * Checks if localStorage is available and accessible
 * 
 * @returns true if localStorage is available, false otherwise
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Safely retrieves and parses JSON from localStorage
 * 
 * @param key - The localStorage key to retrieve
 * @param defaultValue - Default value to return if key doesn't exist or parsing fails
 * @returns The parsed JSON value or defaultValue
 */
export function safeGetJSON<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Failed to read/parse JSON from localStorage (key: ${key}):`, error);
    return defaultValue;
  }
}

/**
 * Safely stringifies and stores JSON in localStorage
 * 
 * @param key - The localStorage key to set
 * @param value - The value to stringify and store
 * @returns true if successful, false if error occurred
 */
export function safeSetJSON<T>(key: string, value: T): boolean {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.warn(`Failed to stringify/write JSON to localStorage (key: ${key}):`, error);
    return false;
  }
}
