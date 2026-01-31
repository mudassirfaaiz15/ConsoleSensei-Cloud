/**
 * Advanced data fetching utilities
 * Request deduplication, background sync, offline support
 */

import { logger } from './logger';

interface PendingRequest<T extends unknown> {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
}

/**
 * Request deduplicator - prevents duplicate API calls
 */
export class RequestDeduplicator {
    private pendingRequests: Map<string, PendingRequest<any>> = new Map();

    /**
     * Execute request with deduplication
     */
    async execute<T extends unknown>(
        key: string,
        fn: () => Promise<T>,
    ): Promise<T> {
        // Return existing request if in progress
        if (this.pendingRequests.has(key)) {
            logger.debug('Returning cached request promise', { key });
            return this.pendingRequests.get(key)!.promise;
        }

        // Create new promise
        let resolve: (value: T) => void;
        let reject: (error: Error) => void;

        const promise = new Promise<T>((res, rej) => {
            resolve = res;
            reject = rej;
        });

        this.pendingRequests.set(key, {
            promise,
            resolve: resolve!,
            reject: reject!,
        });

        try {
            const result = await fn();
            this.pendingRequests.get(key)?.resolve(result);
            this.pendingRequests.delete(key);
            return result;
        } catch (error) {
            const appError = error instanceof Error ? error : new Error(String(error));
            this.pendingRequests.get(key)?.reject(appError);
            this.pendingRequests.delete(key);
            throw appError;
        }
    }

    /**
     * Clear pending requests
     */
    clear(): void {
        this.pendingRequests.clear();
        logger.info('Cleared all pending requests');
    }

    /**
     * Get pending request count
     */
    getPendingCount(): number {
        return this.pendingRequests.size;
    }
}

export const requestDeduplicator = new RequestDeduplicator();

/**
 * Offline storage for sync when reconnected
 */
export class OfflineQueue {
    private queue: Array<{
        id: string;
        method: string;
        url: string;
        data?: any;
        timestamp: number;
    }> = [];
    private storageKey = 'offline_queue';
    private isOnline = navigator.onLine;

    constructor() {
        this.loadFromStorage();
        this.setupListeners();
    }

    /**
     * Add request to offline queue
     */
    enqueue(method: string, url: string, data?: any): void {
        const request = {
            id: `${Date.now()}-${Math.random()}`,
            method,
            url,
            data,
            timestamp: Date.now(),
        };

        this.queue.push(request);
        this.saveToStorage();
        logger.info('Request added to offline queue', { method, url });
    }

    /**
     * Get all queued requests
     */
    getQueue() {
        return [...this.queue];
    }

    /**
     * Remove request from queue
     */
    dequeue(id: string): void {
        this.queue = this.queue.filter(r => r.id !== id);
        this.saveToStorage();
    }

    /**
     * Clear queue
     */
    clear(): void {
        this.queue = [];
        this.saveToStorage();
        logger.info('Offline queue cleared');
    }

    /**
     * Get queue size
     */
    size(): number {
        return this.queue.length;
    }

    /**
     * Check if online
     */
    getIsOnline(): boolean {
        return this.isOnline;
    }

    /**
     * Setup online/offline listeners
     */
    private setupListeners(): void {
        window.addEventListener('online', () => {
            this.isOnline = true;
            logger.info('Application is online');
            // Trigger sync when coming online
            window.dispatchEvent(new Event('app-online'));
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            logger.warn('Application is offline');
            window.dispatchEvent(new Event('app-offline'));
        });
    }

    /**
     * Save queue to storage
     */
    private saveToStorage(): void {
        try {
            sessionStorage.setItem(this.storageKey, JSON.stringify(this.queue));
        } catch (error) {
            logger.error('Failed to save offline queue', error);
        }
    }

    /**
     * Load queue from storage
     */
    private loadFromStorage(): void {
        try {
            const data = sessionStorage.getItem(this.storageKey);
            if (data) {
                this.queue = JSON.parse(data);
                logger.debug('Loaded offline queue from storage', { size: this.queue.length });
            }
        } catch (error) {
            logger.error('Failed to load offline queue', error);
        }
    }
}

export const offlineQueue = new OfflineQueue();

/**
 * Batch request processor
 */
export class BatchProcessor<T> {
    private queue: T[] = [];
    private timer: NodeJS.Timeout | null = null;
    private readonly maxBatchSize: number;
    private readonly batchDelay: number;
    private readonly processor: (items: T[]) => Promise<void>;

    constructor(
        processor: (items: T[]) => Promise<void>,
        maxBatchSize = 20,
        batchDelay = 1000,
    ) {
        this.processor = processor;
        this.maxBatchSize = maxBatchSize;
        this.batchDelay = batchDelay;
    }

    /**
     * Add item to batch
     */
    add(item: T): void {
        this.queue.push(item);

        // Process if batch is full
        if (this.queue.length >= this.maxBatchSize) {
            this.flush();
        } else if (!this.timer) {
            // Schedule processing
            this.timer = setTimeout(() => this.flush(), this.batchDelay);
        }
    }

    /**
     * Process batch
     */
    async flush(): Promise<void> {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        if (this.queue.length === 0) {
            return;
        }

        const items = this.queue.splice(0);
        logger.debug('Processing batch', { size: items.length });

        try {
            await this.processor(items);
        } catch (error) {
            logger.error('Batch processing failed', error);
            // Re-queue failed items
            this.queue.unshift(...items);
        }
    }

    /**
     * Get queue size
     */
    size(): number {
        return this.queue.length;
    }
}

/**
 * React Query integration helper
 */
export function createQueryKey(namespace: string, ...params: any[]): (string | any)[] {
    return [namespace, ...params];
}

/**
 * Background sync manager
 */
export class BackgroundSyncManager {
    private syncing = false;

    /**
     * Sync offline queue when online
     */
    async syncOfflineData(syncFn: (queue: OfflineQueue) => Promise<void>): Promise<void> {
        if (this.syncing || offlineQueue.getIsOnline() === false) {
            return;
        }

        this.syncing = true;
        try {
            await syncFn(offlineQueue);
        } catch (error) {
            logger.error('Background sync failed', error);
        } finally {
            this.syncing = false;
        }
    }
}

export const backgroundSyncManager = new BackgroundSyncManager();
