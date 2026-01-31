/**
 * Advanced React hooks for common patterns
 * State persistence, local storage, permissions, and more
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { analytics, funnelTracker } from '@/lib/utils/analytics';
import { requestDeduplicator } from '@/lib/utils/data-fetching';
import { logger } from '@/lib/utils/logger';

/**
 * Hook for persisting state to localStorage
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            logger.error('Failed to read from localStorage', error, { key });
            return initialValue;
        }
    });

    const setValue = useCallback((value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            localStorage.setItem(key, JSON.stringify(valueToStore));
            analytics.trackEvent('local_storage_updated', 'state', { key });
        } catch (error) {
            logger.error('Failed to write to localStorage', error, { key });
        }
    }, [key, storedValue]);

    return [storedValue, setValue] as const;
}

/**
 * Hook for deduplicating requests
 */
export function useDedupedRequest<T>(
    key: string,
    fn: () => Promise<T>,
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const execute = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await requestDeduplicator.execute(key, fn);
            setData(result);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
        } finally {
            setLoading(false);
        }
    }, [key, fn]);

    return { data, loading, error, execute };
}

/**
 * Hook for tracking user permissions
 */
export function usePermission(permission: string) {
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        // Check permission from API/context
        const checkPermission = async () => {
            try {
                // This would call your actual permission API
                const result = await checkUserPermission(permission);
                setHasPermission(result);
            } catch (error) {
                logger.error('Failed to check permission', error, { permission });
                setHasPermission(false);
            }
        };

        checkPermission();
    }, [permission]);

    return hasPermission;
}

/**
 * Hook for tracking feature usage
 */
export function useFeatureTracking(featureName: string) {
    useEffect(() => {
        analytics.trackFeature(featureName);
    }, [featureName]);
}

/**
 * Hook for tracking funnel steps
 */
export function useFunnelTracking(funnelName: string, stepName: string) {
    useEffect(() => {
        funnelTracker.trackStep(funnelName, stepName);
    }, [funnelName, stepName]);

    return {
        completeFunnel: () => funnelTracker.completeFunnel(funnelName),
        abandonFunnel: (stepNumber: number) => funnelTracker.abandonFunnel(funnelName, stepNumber),
    };
}

/**
 * Hook for page visibility
 */
export function usePageVisibility() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsVisible(!document.hidden);
            analytics.trackEvent(
                document.hidden ? 'page_hidden' : 'page_visible',
                'visibility',
            );
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    return isVisible;
}

/**
 * Hook for window size
 */
export function useWindowSize() {
    const [size, setSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    });

    useEffect(() => {
        const handleResize = () => {
            setSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return size;
}

/**
 * Hook for detecting online/offline status
 */
export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            analytics.trackEvent('app_online', 'connectivity');
        };

        const handleOffline = () => {
            setIsOnline(false);
            analytics.trackEvent('app_offline', 'connectivity');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}

/**
 * Hook for debounced value
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Hook for previous value
 */
export function usePrevious<T>(value: T): T | undefined {
    const ref = useRef<T | undefined>(undefined);

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref.current;
}

/**
 * Hook for mounted state
 */
export function useIsMounted() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    return isMounted;
}

/**
 * Mock permission check (replace with real implementation)
 */
function checkUserPermission(_permission: string): Promise<boolean> {
    // This should call your actual permission API
    return Promise.resolve(true);
}

/**
 * Hook for data refresh with interval
 */
export function useRefreshInterval<T>(
    fn: () => Promise<T>,
    interval = 30000,
    enabled = true,
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!enabled) return;

        const refresh = async () => {
            setLoading(true);
            try {
                const result = await fn();
                setData(result);
                setError(null);
            } catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                setError(error);
            } finally {
                setLoading(false);
            }
        };

        refresh();
        const intervalId = setInterval(refresh, interval);

        return () => clearInterval(intervalId);
    }, [fn, interval, enabled]);

    return { data, loading, error };
}
