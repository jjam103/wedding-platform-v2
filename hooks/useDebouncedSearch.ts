import { useState, useEffect } from 'react';

/**
 * Custom hook for debounced search input
 * 
 * @param initialValue - Initial search value
 * @param delay - Debounce delay in milliseconds (default: 500ms)
 * @returns [debouncedValue, actualValue, setValue]
 */
export function useDebouncedSearch(
  initialValue: string = '',
  delay: number = 500
): [string, string, (value: string) => void] {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return [debouncedValue, value, setValue];
}
