"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseLiveDataOptions<T> {
  /** Function to fetch data */
  fetcher: () => Promise<T>;
  /** Polling interval in milliseconds (default: 5000ms) */
  interval?: number;
  /** Whether to start polling immediately (default: true) */
  enabled?: boolean;
  /** Callback when data is updated */
  onUpdate?: (data: T) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

interface UseLiveDataReturn<T> {
  /** The fetched data */
  data: T | null;
  /** Loading state for initial fetch */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Whether the data is currently being refreshed */
  isRefreshing: boolean;
  /** Manually trigger a refresh */
  refresh: () => Promise<void>;
  /** Pause polling */
  pause: () => void;
  /** Resume polling */
  resume: () => void;
  /** Whether polling is currently active */
  isPolling: boolean;
  /** Last updated timestamp */
  lastUpdated: Date | null;
}

/**
 * Custom hook for live data fetching with polling
 * Optimized for real-time dashboards and data tables
 */
export function useLiveData<T>({
  fetcher,
  interval = 5000,
  enabled = true,
  onUpdate,
  onError,
}: UseLiveDataOptions<T>): UseLiveDataReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(enabled);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async (isInitial = false) => {
    if (!isMountedRef.current) return;
    
    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    
    try {
      const result = await fetcher();
      
      if (!isMountedRef.current) return;
      
      setData(result);
      setError(null);
      setLastUpdated(new Date());
      onUpdate?.(result);
    } catch (err) {
      if (!isMountedRef.current) return;
      
      const error = err instanceof Error ? err : new Error("Failed to fetch data");
      setError(error);
      onError?.(error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [fetcher, onUpdate, onError]);

  const refresh = useCallback(async () => {
    await fetchData(false);
  }, [fetchData]);

  const pause = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resume = useCallback(() => {
    setIsPolling(true);
  }, []);

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchData(true);
    
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  // Set up polling interval
  useEffect(() => {
    if (!isPolling || !enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      fetchData(false);
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPolling, enabled, interval, fetchData]);

  return {
    data,
    isLoading,
    error,
    isRefreshing,
    refresh,
    pause,
    resume,
    isPolling,
    lastUpdated,
  };
}
