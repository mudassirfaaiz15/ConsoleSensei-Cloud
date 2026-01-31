import { describe, it, expect, beforeEach } from 'vitest';
import { LRUCache, StorageCache } from '@/lib/utils/cache';

describe('Cache Utilities', () => {
    describe('LRUCache', () => {
        let cache: LRUCache<string>;

        beforeEach(() => {
            cache = new LRUCache(3);
        });

        it('should set and get values', () => {
            cache.set('key1', 'value1');
            expect(cache.get('key1')).toBe('value1');
        });

        it('should return null for missing keys', () => {
            expect(cache.get('missing')).toBeNull();
        });

        it('should evict LRU entry when full', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');
            cache.set('key4', 'value4'); // Should evict key1

            expect(cache.get('key1')).toBeNull();
            expect(cache.get('key4')).toBe('value4');
        });

        it('should respect TTL expiration', async () => {
            cache.set('key1', 'value1', 100);
            expect(cache.get('key1')).toBe('value1');

            await new Promise(resolve => setTimeout(resolve, 150));
            expect(cache.get('key1')).toBeNull();
        });

        it('should track cache statistics', () => {
            cache.set('key1', 'value1');
            cache.get('key1'); // hit
            cache.get('missing'); // miss
            cache.get('key1'); // hit

            const stats = cache.getStats();
            expect(stats.hits).toBe(2);
            expect(stats.misses).toBe(1);
        });

        it('should clear cache', () => {
            cache.set('key1', 'value1');
            cache.clear();
            expect(cache.get('key1')).toBeNull();
        });

        it('should check key existence', () => {
            cache.set('key1', 'value1');
            expect(cache.has('key1')).toBe(true);
            expect(cache.has('key2')).toBe(false);
        });
    });

    describe('StorageCache', () => {
        beforeEach(() => {
            StorageCache.clear();
        });

        it('should set and get items from storage', () => {
            StorageCache.setItem('key1', { data: 'value1' });
            const item = StorageCache.getItem('key1');
            expect(item).toEqual({ data: 'value1' });
        });

        it('should return null for missing items', () => {
            expect(StorageCache.getItem('missing')).toBeNull();
        });

        it('should respect TTL expiration', async () => {
            StorageCache.setItem('key1', 'value1', 100);
            expect(StorageCache.getItem('key1')).toBe('value1');

            await new Promise(resolve => setTimeout(resolve, 150));
            expect(StorageCache.getItem('key1')).toBeNull();
        });

        it('should remove items', () => {
            StorageCache.setItem('key1', 'value1');
            StorageCache.removeItem('key1');
            expect(StorageCache.getItem('key1')).toBeNull();
        });

        it('should clear all items', () => {
            StorageCache.setItem('key1', 'value1');
            StorageCache.setItem('key2', 'value2');
            StorageCache.clear();
            expect(StorageCache.getItem('key1')).toBeNull();
            expect(StorageCache.getItem('key2')).toBeNull();
        });
    });
});
