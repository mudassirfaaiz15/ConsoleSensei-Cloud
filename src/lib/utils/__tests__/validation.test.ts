import { describe, it, expect } from 'vitest';
import {
    validateEmail,
    validateUrl,
    validateAWSCredentials,
    sanitizeHtml,
    validateObjectKeys,
    escapeUserInput,
    RateLimiter,
} from '@/lib/utils/validation';

describe('Validation Utilities', () => {
    describe('validateEmail', () => {
        it('should validate correct email format', () => {
            expect(validateEmail('user@example.com')).toBe(true);
            expect(validateEmail('test.user+tag@domain.co.uk')).toBe(true);
        });

        it('should reject invalid email format', () => {
            expect(validateEmail('invalid.email')).toBe(false);
            expect(validateEmail('@example.com')).toBe(false);
            expect(validateEmail('user@')).toBe(false);
            expect(validateEmail('')).toBe(false);
        });

        it('should reject emails exceeding max length', () => {
            const longEmail = 'a'.repeat(255) + '@example.com';
            expect(validateEmail(longEmail)).toBe(false);
        });
    });

    describe('validateUrl', () => {
        it('should validate correct URLs', () => {
            expect(validateUrl('https://example.com')).toBe(true);
            expect(validateUrl('http://localhost:3000')).toBe(true);
            expect(validateUrl('https://api.example.com/v1/users')).toBe(true);
        });

        it('should reject invalid URLs', () => {
            expect(validateUrl('not a url')).toBe(false);
            expect(validateUrl('example.com')).toBe(false);
            expect(validateUrl('')).toBe(false);
        });
    });

    describe('validateAWSCredentials', () => {
        it('should validate valid AWS credentials', () => {
            const accessKey = 'AKIAIOSFODNN7EXAMPLE';
            const secretKey = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
            expect(validateAWSCredentials(accessKey, secretKey)).toBe(true);
        });

        it('should reject short access key', () => {
            expect(validateAWSCredentials('SHORT', 'valid-secret-key-here-is-long')).toBe(false);
        });

        it('should reject short secret key', () => {
            expect(validateAWSCredentials('AKIAIOSFODNN7EXAMPLE', 'short')).toBe(false);
        });

        it('should reject invalid character in access key', () => {
            expect(validateAWSCredentials('akiaiosfodnn7example', 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY')).toBe(false);
        });
    });

    describe('sanitizeHtml', () => {
        it('should escape HTML special characters', () => {
            expect(sanitizeHtml('<script>alert("xss")</script>')).toContain('&lt;');
            expect(sanitizeHtml('<img src=x onerror=alert(1)>')).not.toContain('<img');
        });

        it('should preserve normal text', () => {
            const text = 'Normal text with & special < characters >';
            expect(sanitizeHtml(text)).toContain('Normal text');
        });
    });

    describe('validateObjectKeys', () => {
        it('should validate objects with allowed keys', () => {
            const obj = { name: 'John', email: 'john@example.com' };
            const allowedKeys: (keyof typeof obj)[] = ['name', 'email'];
            expect(validateObjectKeys(obj, allowedKeys)).toBe(true);
        });

        it('should reject objects with disallowed keys', () => {
            const obj = { name: 'John', password: 'secret' };
            const allowedKeys: string[] = ['name'];
            expect(validateObjectKeys(obj, allowedKeys as any)).toBe(false);
        });

        it('should reject non-objects', () => {
            expect(validateObjectKeys('string', ['key'])).toBe(false);
            expect(validateObjectKeys([1, 2, 3], ['key'])).toBe(false);
            expect(validateObjectKeys(null, ['key'])).toBe(false);
        });
    });

    describe('escapeUserInput', () => {
        it('should escape HTML characters', () => {
            expect(escapeUserInput('<script>')).toBe('&lt;script&gt;');
            expect(escapeUserInput('&copy;')).toBe('&amp;copy;');
            expect(escapeUserInput('"quotes"')).toBe('&quot;quotes&quot;');
            expect(escapeUserInput("'apostrophe'")).toBe('&#039;apostrophe&#039;');
        });

        it('should preserve normal text', () => {
            expect(escapeUserInput('normal text')).toBe('normal text');
        });
    });

    describe('RateLimiter', () => {
        it('should allow requests within limit', () => {
            const limiter = new RateLimiter(3, 1000);
            expect(limiter.isAllowed('user:1')).toBe(true);
            expect(limiter.isAllowed('user:1')).toBe(true);
            expect(limiter.isAllowed('user:1')).toBe(true);
        });

        it('should block requests exceeding limit', () => {
            const limiter = new RateLimiter(2, 1000);
            expect(limiter.isAllowed('user:1')).toBe(true);
            expect(limiter.isAllowed('user:1')).toBe(true);
            expect(limiter.isAllowed('user:1')).toBe(false);
        });

        it('should track different keys separately', () => {
            const limiter = new RateLimiter(2, 1000);
            expect(limiter.isAllowed('user:1')).toBe(true);
            expect(limiter.isAllowed('user:2')).toBe(true);
            expect(limiter.isAllowed('user:1')).toBe(true);
            expect(limiter.isAllowed('user:1')).toBe(false);
            expect(limiter.isAllowed('user:2')).toBe(true);
        });

        it('should reset rate limit for key', () => {
            const limiter = new RateLimiter(1, 1000);
            expect(limiter.isAllowed('user:1')).toBe(true);
            expect(limiter.isAllowed('user:1')).toBe(false);
            limiter.reset('user:1');
            expect(limiter.isAllowed('user:1')).toBe(true);
        });

        it('should clear all data', () => {
            const limiter = new RateLimiter(1, 1000);
            limiter.isAllowed('user:1');
            limiter.isAllowed('user:2');
            limiter.clear();
            expect(limiter.isAllowed('user:1')).toBe(true);
            expect(limiter.isAllowed('user:2')).toBe(true);
        });
    });
});
