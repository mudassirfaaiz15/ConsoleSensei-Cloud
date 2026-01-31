/**
 * Advanced caching utilities for performance optimization
 * Supports memory cache with LRU eviction, session storage, and local storage
 */

import { logger } from './logger';

interface CacheEntry<T> {
    value: T;
    timestamp: number;
    ttl?: number;
}

interface CacheStats {
    hits: number;
    misses: number;
    size: number;
}

const DEFAULT_MAX_CACHE_SIZE = 50;

/**
 * LRU Cache implementation
 */
export class LRUCache<T> {
    private cache: Map<string, CacheEntry<T>> = new Map();
    private accessOrder: string[] = [];
    private maxSize: number;
    private stats: CacheStats = { hits: 0, misses: 0, size: 0 };

    constructor(maxSize = DEFAULT_MAX_CACHE_SIZE) {
        this.maxSize = maxSize;
    }

    /**
     * Get value from cache
     */
    get(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            logger.debug('Cache miss', { key });
            return null;
        }

        // Check if expired
        if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            this.stats.misses++;
            logger.debug('Cache expired', { key });
            return null;
        }

        // Update access order
        this.updateAccessOrder(key);
        this.stats.hits++;
        logger.debug('Cache hit', { key, hitRate: this.getHitRate() });

        return entry.value;
    }

    /**
     * Set value in cache
     */
    set(key: string, value: T, ttl?: number): void {
        // Remove old entry
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }

        // Add new entry
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            ttl,
        });

        this.updateAccessOrder(key);
        this.stats.size = this.cache.size;

        // Evict least recently used if over capacity
        if (this.cache.size > this.maxSize) {
            const lruKey = this.accessOrder.shift();
            if (lruKey) {
                this.cache.delete(lruKey);
                logger.debug('Cache evicted LRU entry', { key: lruKey });
            }
        }
    }

    /**
     * Check if key exists
     */
    has(key: string): boolean {
        return this.cache.has(key);
    }

    /**
     * Clear cache
     */
    clear(): void {
        this.cache.clear();
        this.accessOrder = [];
        this.stats = { hits: 0, misses: 0, size: 0 };
        logger.info('Cache cleared');
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats & { hitRate: number } {
        const total = this.stats.hits + this.stats.misses;
        return {
            ...this.stats,
            hitRate: total > 0 ? this.stats.hits / total : 0,
        };
    }

    /**
     * Update access order (mark as most recently used)
     */
    private updateAccessOrder(key: string): void {
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
        this.accessOrder.push(key);
    }

    /**
     * Get hit rate
     */
    private getHitRate(): number {
        const total = this.stats.hits + this.stats.misses;
        return total > 0 ? parseFloat((this.stats.hits / total * 100).toFixed(2)) : 0;
    }
}

/**
 * Global cache instance
 */
export const cache = new LRUCache<unknown>();

/**
 * Storage adapter for persisting cache
 */
export class StorageCache {
    static setItem<T>(key: string, value: T, ttl?: number): void {
        try {
            const entry: CacheEntry<T> = {
                value,
                timestamp: Date.now(),
                ttl,
            };
            sessionStorage.setItem(key, JSON.stringify(entry));
            logger.debug('Item cached to storage', { key });
        } catch (error) {
            logger.error('Failed to cache to storage', error, { key });
        }
    }

    static getItem<T>(key: string): T | null {
        try {
            const data = sessionStorage.getItem(key);
            if (!data) return null;

            const entry: CacheEntry<T> = JSON.parse(data);

            // Check if expired
            if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
                sessionStorage.removeItem(key);
                return null;
            }

            logger.debug('Item retrieved from storage', { key });
            return entry.value;
        } catch (error) {
            logger.error('Failed to retrieve from storage', error, { key });
            return null;
        }
    }

    static removeItem(key: string): void {
        try {
            sessionStorage.removeItem(key);
        } catch (error) {
            logger.error('Failed to remove from storage', error, { key });
        }
    }

    static clear(): void {
        try {
            sessionStorage.clear();
            logger.info('Storage cache cleared');
        } catch (error) {
            logger.error('Failed to clear storage', error);
        }
    }
}

/**
 * Hook for using cache with React Query
 */
export function getCacheKey(...parts: (string | number | boolean | undefined)[]): string {
    return parts.filter(Boolean).join(':');
}

/**
 * Cache decorator for functions
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    ttl = 5 * 60 * 1000, // 5 minutes
): T {
    return (async (...args: any[]) => {
        const cacheKey = getCacheKey(fn.name, ...args);
        const cached = cache.get(cacheKey);

        if (cached) {
            return cached;
        }

        const result = await fn(...args);
        cache.set(cacheKey, result, ttl);
        return result;
    }) as T;
}
