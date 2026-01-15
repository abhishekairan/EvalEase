import { useEffect, useState } from 'react';

/**
 * Custom hook for debouncing values
 * Delays updating the debounced value until after the specified delay has passed
 * since the last change to the input value.
 * 
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 500ms)
 * @returns The debounced value
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 300);
 * 
 * useEffect(() => {
 *   // API call with debouncedSearchTerm
 * }, [debouncedSearchTerm]);
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay completes
    return () => {
      clearTimeout(timeoutId);
    };
  }, [value, delay]);

  return debouncedValue;
}
