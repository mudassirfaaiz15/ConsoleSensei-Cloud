import { describe, it, expect, vi } from 'vitest';
import {
    AppErrorClass,
    handleApiError,
    handleAWSError,
    getUserFriendlyMessage,
    retryWithExponentialBackoff,
} from '@/lib/utils/error-handler';

describe('Error Handler', () => {
    describe('AppErrorClass', () => {
        it('should create an error with code, message, and statusCode', () => {
            const error = new AppErrorClass('TEST_ERROR', 'Test message', 400);
            expect(error.code).toBe('TEST_ERROR');
            expect(error.message).toBe('Test message');
            expect(error.statusCode).toBe(400);
        });

        it('should include context if provided', () => {
            const context = { userId: '123' };
            const error = new AppErrorClass('TEST_ERROR', 'Test message', 400, context);
            expect(error.context).toEqual(context);
        });
    });

    describe('handleApiError', () => {
        it('should return AppError for Error instance', () => {
            const originalError = new Error('Network failed');
            const result = handleApiError(originalError, 'fetchUsers');
            expect(result.code).toBe('API_ERROR');
            expect(result.message).toBe('Network failed');
            expect(result.context).toEqual({ context: 'fetchUsers' });
        });

        it('should return AppError for string', () => {
            const result = handleApiError('Something went wrong');
            expect(result.code).toBe('API_ERROR');
            expect(result.message).toBe('Something went wrong');
        });

        it('should handle unknown error types', () => {
            const result = handleApiError({ unknown: 'error' });
            expect(result.code).toBe('UNKNOWN_ERROR');
            expect(result.message).toBe('An unknown error occurred');
        });

        it('should preserve AppErrorClass instances', () => {
            const appError = new AppErrorClass('CUSTOM', 'Custom error', 500);
            const result = handleApiError(appError);
            expect(result).toBe(appError);
        });
    });

    describe('handleAWSError', () => {
        it('should create AWS error with service context', () => {
            const error = new Error('Access Denied');
            const result = handleAWSError(error, 'EC2');
            expect(result.code).toBe('AWS_ERROR');
            expect(result.context?.service).toBe('EC2');
        });
    });

    describe('getUserFriendlyMessage', () => {
        it('should return appropriate message for known error codes', () => {
            const error = { code: 'AWS_ERROR', message: 'Technical error' };
            const message = getUserFriendlyMessage(error as any);
            expect(message).toBe('Failed to connect to AWS. Please check your credentials.');
        });

        it('should return original message for unknown error codes', () => {
            const error = { code: 'UNKNOWN', message: 'Something specific' };
            const message = getUserFriendlyMessage(error as any);
            expect(message).toBe('Something specific');
        });
    });

    describe('retryWithExponentialBackoff', () => {
        it('should succeed on first attempt', async () => {
            const fn = vi.fn().mockResolvedValue('success');
            const result = await retryWithExponentialBackoff(fn);
            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should retry on failure', async () => {
            const fn = vi.fn()
                .mockRejectedValueOnce(new Error('fail1'))
                .mockResolvedValueOnce('success');

            const result = await retryWithExponentialBackoff(fn, 3, 10);
            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(2);
        });

        it('should fail after max retries', async () => {
            const fn = vi.fn().mockRejectedValue(new Error('always fails'));
            await expect(retryWithExponentialBackoff(fn, 2, 10)).rejects.toThrow();
            expect(fn).toHaveBeenCalledTimes(2);
        });
    });
});
