/**
 * API call utilities with standardized error handling and logging
 */

import { logger } from './logger';
import { handleApiError, AppError, retryWithExponentialBackoff } from './error-handler';

interface ApiRequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: unknown;
    timeout?: number;
    retry?: boolean;
    maxRetries?: number;
}

interface ApiResponse<T> {
    data?: T;
    error?: AppError;
    status: number;
    ok: boolean;
}

/**
 * Make API call with error handling and logging
 */
export async function apiCall<T = unknown>(
    endpoint: string,
    options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
    const {
        method = 'GET',
        headers = {},
        body,
        timeout = 30000,
        retry = true,
        maxRetries = 3,
    } = options;

    const startTime = performance.now();

    try {
        logger.logApiCall(method, endpoint, { body });

        const makeRequest = async () => {
            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
                body: body ? JSON.stringify(body) : undefined,
                signal: AbortSignal.timeout(timeout),
            });

            return response;
        };

        const response = retry
            ? await retryWithExponentialBackoff(makeRequest, maxRetries)
            : await makeRequest();

        const duration = performance.now() - startTime;
        logger.logApiResponse(method, endpoint, response.status, Math.round(duration));

        if (!response.ok) {
            const error = await response.text();
            const appError = handleApiError(error, endpoint);
            logger.error(`API failed: ${method} ${endpoint}`, appError);
            return {
                error: appError,
                status: response.status,
                ok: false,
            };
        }

        const contentType = response.headers.get('content-type');
        let data: T | undefined;

        if (contentType?.includes('application/json')) {
            data = await response.json() as T;
        } else {
            data = await response.text() as unknown as T;
        }

        return {
            data,
            status: response.status,
            ok: true,
        };
    } catch (error) {
        const duration = performance.now() - startTime;
        const appError = handleApiError(error, endpoint);
        logger.logApiError(method, endpoint, appError);
        logger.warn(`API call failed after ${duration}ms`, { endpoint, method });

        return {
            error: appError,
            status: 0,
            ok: false,
        };
    }
}

/**
 * GET request
 */
export function apiGet<T = unknown>(endpoint: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
    return apiCall<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request
 */
export function apiPost<T = unknown>(endpoint: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
    return apiCall<T>(endpoint, { ...options, method: 'POST', body });
}

/**
 * PUT request
 */
export function apiPut<T = unknown>(endpoint: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
    return apiCall<T>(endpoint, { ...options, method: 'PUT', body });
}

/**
 * DELETE request
 */
export function apiDelete<T = unknown>(endpoint: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
    return apiCall<T>(endpoint, { ...options, method: 'DELETE' });
}

/**
 * PATCH request
 */
export function apiPatch<T = unknown>(endpoint: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
    return apiCall<T>(endpoint, { ...options, method: 'PATCH', body });
}
