import { useEffect, useState, useRef } from 'react';

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
  const isFirstRender = useRef(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Immediate update for first render to avoid delay on page load
  useEffect(() => {
    if (isFirstRender.current) {
      console.log('useDebounce: Initial value set immediately', value);
      setDebouncedValue(value);
      isFirstRender.current = false;
      return;
    }

    console.log('useDebounce: Value changed, setting timer', value);
    
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Set up timeout to update debounced value
    timerRef.current = setTimeout(() => {
      console.log('useDebounce: Timer fired, updating value', value);
      setDebouncedValue(value);
      timerRef.current = null;
    }, delay);

    // Clean up timeout on value change or unmount
    return () => {
      if (timerRef.current) {
        console.log('useDebounce: Cleanup timer');
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [value, delay]);

  // Log when returning a value
  console.log('useDebounce: Returning value', { current: value, debounced: debouncedValue });
  
  return debouncedValue;
} 