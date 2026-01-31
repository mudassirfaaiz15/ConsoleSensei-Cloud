/**
 * Security validation utilities
 * Provides input validation and sanitization functions
 */

/**
 * Validate AWS credentials format
 */
export function validateAWSCredentials(accessKeyId: string, secretAccessKey: string): boolean {
    // AWS Access Key IDs are typically 20 characters
    if (!accessKeyId || accessKeyId.length < 16) {
        return false;
    }

    // AWS Secret Access Keys are typically 40 characters
    if (!secretAccessKey || secretAccessKey.length < 30) {
        return false;
    }

    // Check for valid AWS key ID pattern (alphanumeric)
    if (!/^[A-Z0-9]+$/.test(accessKeyId)) {
        return false;
    }

    return true;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Sanitize HTML content
 */
export function sanitizeHtml(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

/**
 * Validate object keys against whitelist
 */
export function validateObjectKeys<T extends Record<string, unknown>>(
    obj: unknown,
    allowedKeys: (keyof T)[],
): obj is T {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        return false;
    }

    const keys = Object.keys(obj as Record<string, unknown>);
    return keys.every(key => allowedKeys.includes(key as keyof T));
}

/**
 * Escape user input for safe display
 */
export function escapeUserInput(input: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };

    return input.replace(/[&<>"']/g, char => map[char] || char);
}

/**
 * Rate limiter utility
 */
export class RateLimiter {
    private attempts: Map<string, number[]> = new Map();
    private readonly maxAttempts: number;
    private readonly windowMs: number;

    constructor(maxAttempts = 5, windowMs = 60000) {
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
    }

    /**
     * Check if action is allowed
     */
    isAllowed(key: string): boolean {
        const now = Date.now();
        const timestamps = this.attempts.get(key) || [];

        // Remove old attempts outside window
        const recentAttempts = timestamps.filter(time => now - time < this.windowMs);

        if (recentAttempts.length >= this.maxAttempts) {
            return false;
        }

        recentAttempts.push(now);
        this.attempts.set(key, recentAttempts);
        return true;
    }

    /**
     * Reset rate limiter for key
     */
    reset(key: string): void {
        this.attempts.delete(key);
    }

    /**
     * Clear all rate limiter data
     */
    clear(): void {
        this.attempts.clear();
    }
}
