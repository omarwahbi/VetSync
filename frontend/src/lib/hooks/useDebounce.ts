import { useEffect, useState } from 'react';

/**
 * A hook that debounces a value. Use this to prevent 
 * rapid-fire API calls or expensive operations.
 * 
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up timeout to update debounced value
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up timeout on value change or unmount
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
} 