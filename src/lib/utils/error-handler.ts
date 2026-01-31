/**
 * Centralized error handling utility
 * Provides standardized error handling across the application
 */

export interface AppError {
    code: string;
    message: string;
    statusCode?: number;
    context?: Record<string, unknown>;
}

export class AppErrorClass extends Error implements AppError {
    code: string;
    message: string;
    statusCode?: number;
    context?: Record<string, unknown>;

    constructor(code: string, message: string, statusCode?: number, context?: Record<string, unknown>) {
        super(message);
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
        this.context = context;
        Object.setPrototypeOf(this, AppErrorClass.prototype);
    }
}

/**
 * Handle errors from API calls
 */
export function handleApiError(error: unknown, context?: string): AppError {
    if (error instanceof AppErrorClass) {
        return error;
    }

    if (error instanceof Error) {
        return {
            code: 'API_ERROR',
            message: error.message,
            context: context ? { context } : undefined,
        };
    }

    if (typeof error === 'string') {
        return {
            code: 'API_ERROR',
            message: error,
            context: context ? { context } : undefined,
        };
    }

    return {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
        context: context ? { context } : undefined,
    };
}

/**
 * Handle AWS SDK errors
 */
export function handleAWSError(error: unknown, service: string): AppError {
    const appError = handleApiError(error, service);
    return {
        ...appError,
        code: 'AWS_ERROR',
        context: {
            ...appError.context,
            service,
        },
    };
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: AppError): string {
    const messages: Record<string, string> = {
        'AWS_ERROR': 'Failed to connect to AWS. Please check your credentials.',
        'AUTH_ERROR': 'Authentication failed. Please log in again.',
        'VALIDATION_ERROR': 'Invalid input provided. Please check your data.',
        'NETWORK_ERROR': 'Network error. Please check your connection.',
        'NOT_FOUND': 'Resource not found.',
        'PERMISSION_ERROR': 'You do not have permission to perform this action.',
    };

    return messages[error.code] || error.message || 'An error occurred. Please try again.';
}

/**
 * Retry logic for transient errors
 */
export async function retryWithExponentialBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000,
): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (i < maxRetries - 1) {
                const delay = baseDelay * Math.pow(2, i);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError || new Error('Max retries exceeded');
}
