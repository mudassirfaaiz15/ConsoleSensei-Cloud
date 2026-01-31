/**
 * Hook for standardized loading and error state management
 * Reduces boilerplate code in components
 */

import { useState, useCallback } from 'react';
import { AppError, handleApiError } from '@/lib/utils/error-handler';

interface UseAsyncState<T> {
    data?: T;
    error?: AppError;
    isLoading: boolean;
    isSuccess: boolean;
}

/**
 * Hook for async operations with loading and error states
 */
export function useAsync<T>(asyncFn: () => Promise<T>, immediate = true) {
    const [state, setState] = useState<UseAsyncState<T>>({
        isLoading: immediate,
        isSuccess: false,
    });

    const execute = useCallback(async () => {
        setState({ isLoading: true, isSuccess: false });
        try {
            const response = await asyncFn();
            setState({
                data: response,
                isLoading: false,
                isSuccess: true,
            });
            return response;
        } catch (error) {
            const appError = handleApiError(error);
            setState({
                error: appError,
                isLoading: false,
                isSuccess: false,
            });
            throw appError;
        }
    }, [asyncFn]);

    const reset = useCallback(() => {
        setState({
            data: undefined,
            error: undefined,
            isLoading: false,
            isSuccess: false,
        });
    }, []);

    return { ...state, execute, reset };
}

/**
 * Hook for form submission with loading and error handling
 */
export function useSubmit<T>(onSubmit: (data: T) => Promise<void>) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<AppError | undefined>();

    const submit = useCallback(
        async (data: T) => {
            setIsSubmitting(true);
            setSubmitError(undefined);
            try {
                await onSubmit(data);
            } catch (error) {
                const appError = handleApiError(error, 'form submission');
                setSubmitError(appError);
                throw appError;
            } finally {
                setIsSubmitting(false);
            }
        },
        [onSubmit],
    );

    const clearError = useCallback(() => {
        setSubmitError(undefined);
    }, []);

    return { submit, isSubmitting, error: submitError, clearError };
}

/**
 * Hook for debounced async operations (e.g., search)
 */
export function useDebouncedAsync<T, Args extends unknown[]>(
    asyncFn: (...args: Args) => Promise<T>,
    delay = 300,
) {
    const [state, setState] = useState<UseAsyncState<T>>({
        isLoading: false,
        isSuccess: false,
    });
    const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

    const execute = useCallback(
        (...args: Args) => {
            // Clear previous timeout
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            // Set new timeout
            const newTimeoutId = setTimeout(async () => {
                setState({ isLoading: true, isSuccess: false });
                try {
                    const response = await asyncFn(...args);
                    setState({
                        data: response,
                        isLoading: false,
                        isSuccess: true,
                    });
                } catch (error) {
                    const appError = handleApiError(error);
                    setState({
                        error: appError,
                        isLoading: false,
                        isSuccess: false,
                    });
                }
            }, delay);

            setTimeoutId(newTimeoutId);
        },
        [asyncFn, delay, timeoutId],
    );

    return { ...state, execute };
}

/**
 * Hook for polling data
 */
export function usePolling<T>(
    fetchFn: () => Promise<T>,
    interval = 30000,
    immediate = true,
) {
    const [state, setState] = useState<UseAsyncState<T>>({
        isLoading: immediate,
        isSuccess: false,
    });
    const [isPolling, setIsPolling] = useState(false);

    const startPolling = useCallback(() => {
        setIsPolling(true);
        const poll = async () => {
            try {
                const response = await fetchFn();
                setState({
                    data: response,
                    isLoading: false,
                    isSuccess: true,
                });
            } catch (error) {
                const appError = handleApiError(error);
                setState({
                    error: appError,
                    isLoading: false,
                    isSuccess: false,
                });
            }
        };

        // Initial fetch
        poll();

        // Poll at interval
        const intervalId = setInterval(poll, interval);

        return () => {
            clearInterval(intervalId);
            setIsPolling(false);
        };
    }, [fetchFn, interval]);

    const stopPolling = useCallback(() => {
        setIsPolling(false);
    }, []);

    return { ...state, startPolling, stopPolling, isPolling };
}
