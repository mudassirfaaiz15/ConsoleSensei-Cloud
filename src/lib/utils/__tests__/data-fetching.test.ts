import { describe, it, expect, beforeEach } from 'vitest';
import { RequestDeduplicator, OfflineQueue, BatchProcessor } from '@/lib/utils/data-fetching';

describe('Data Fetching Utilities', () => {
    describe('RequestDeduplicator', () => {
        let deduplicator: RequestDeduplicator;

        beforeEach(() => {
            deduplicator = new RequestDeduplicator();
        });

        it('should execute request once for duplicate calls', async () => {
            let callCount = 0;
            const fn = async () => {
                callCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
                return 'result';
            };

            const key = 'test-request';
            const [result1, result2] = await Promise.all([
                deduplicator.execute(key, fn),
                deduplicator.execute(key, fn),
            ]);

            expect(result1).toBe('result');
            expect(result2).toBe('result');
            expect(callCount).toBe(1); // Called only once despite two calls
        });

        it('should handle different keys separately', async () => {
            let callCount = 0;
            const fn = async () => {
                callCount++;
                return `result-${callCount}`;
            };

            const result1 = await deduplicator.execute('key1', fn);
            const result2 = await deduplicator.execute('key2', fn);

            expect(result1).toBe('result-1');
            expect(result2).toBe('result-2');
            expect(callCount).toBe(2);
        });

        it('should clear pending requests', () => {
            expect(deduplicator.getPendingCount()).toBe(0);
            deduplicator.clear();
            expect(deduplicator.getPendingCount()).toBe(0);
        });
    });

    describe('OfflineQueue', () => {
        let queue: OfflineQueue;

        beforeEach(() => {
            queue = new OfflineQueue();
            queue.clear();
        });

        it('should enqueue requests', () => {
            queue.enqueue('POST', '/api/data', { name: 'test' });
            expect(queue.size()).toBe(1);
        });

        it('should dequeue requests', () => {
            queue.enqueue('POST', '/api/data');
            const requests = queue.getQueue();
            queue.dequeue(requests[0].id);
            expect(queue.size()).toBe(0);
        });

        it('should clear queue', () => {
            queue.enqueue('POST', '/api/data');
            queue.enqueue('GET', '/api/data');
            queue.clear();
            expect(queue.size()).toBe(0);
        });

        it('should track online status', () => {
            const isOnline = queue.getIsOnline();
            expect(typeof isOnline).toBe('boolean');
        });
    });

    describe('BatchProcessor', () => {
        it('should process batches', async () => {
            const processedItems: number[] = [];
            const processor = new BatchProcessor(async (items: number[]) => {
                processedItems.push(...items);
            }, 3, 100);

            processor.add(1);
            processor.add(2);
            processor.add(3); // Should trigger flush

            await new Promise(resolve => setTimeout(resolve, 150));

            expect(processor.size()).toBe(0);
            expect(processedItems).toContain(1);
            expect(processedItems).toContain(2);
            expect(processedItems).toContain(3);
        });

        it('should flush on manual call', async () => {
            const processedItems: number[] = [];
            const processor = new BatchProcessor(async (items: number[]) => {
                processedItems.push(...items);
            });

            processor.add(1);
            processor.add(2);
            await processor.flush();

            expect(processor.size()).toBe(0);
            expect(processedItems.length).toBe(2);
        });
    });
});
