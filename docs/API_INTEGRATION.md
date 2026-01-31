# API Integration Guide

Complete guide for integrating the advanced utility systems into your API modules, components, and hooks.

## Table of Contents

1. [Error Handling Integration](#error-handling-integration)
2. [Caching Strategy](#caching-strategy)
3. [Logging Best Practices](#logging-best-practices)
4. [Analytics Integration](#analytics-integration)
5. [Offline Support](#offline-support)
6. [Performance Monitoring](#performance-monitoring)
7. [Request Deduplication](#request-deduplication)
8. [Data Fetching Patterns](#data-fetching-patterns)
9. [Advanced Hooks Usage](#advanced-hooks-usage)
10. [Examples & Patterns](#examples--patterns)

---

## Error Handling Integration

### Basic Error Handling in API Functions

```typescript
import { handleApiError, AppError, retryWithExponentialBackoff } from '@/lib/utils/error-handler';
import { logger } from '@/lib/utils/logger';
import { analytics } from '@/lib/utils/analytics';

export async function fetchUserData(userId: string) {
    try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
            throw new AppError(
                `Failed to fetch user ${userId}`,
                'USER_FETCH_ERROR',
                response.status,
                { userId, status: response.status }
            );
        }
        return await response.json();
    } catch (error) {
        const appError = handleApiError(error);
        logger.error('Error fetching user data', appError);
        analytics.trackError(appError);
        throw appError;
    }
}
```

### Retry Logic with Exponential Backoff

```typescript
// Automatically retries with exponential backoff
export async function fetchWithRetry(url: string) {
    return retryWithExponentialBackoff(
        async () => {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        },
        {
            maxAttempts: 3,
            delayMs: 1000,
            shouldRetry: (attempt, error) => {
                // Don't retry 4xx errors except 408, 429
                if (error.status && error.status >= 400 && error.status < 500) {
                    return error.status === 408 || error.status === 429;
                }
                return attempt < 3;
            }
        }
    );
}
```

### Error Recovery Patterns

```typescript
// Graceful degradation
export async function fetchOptionalData() {
    try {
        return await fetchExpensiveData();
    } catch (error) {
        logger.warn('Failed to fetch optional data, using defaults', error);
        return getDefaultData();
    }
}

// Fallback chain
export async function fetchWithFallback() {
    try {
        return await fetch('https://primary-api.com/data');
    } catch {
        try {
            return await fetch('https://backup-api.com/data');
        } catch {
            return getCachedData();
        }
    }
}
```

---

## Caching Strategy

### LRUCache Implementation

```typescript
import { LRUCache } from '@/lib/utils/cache';

// Create cache with 50 items max, 5 minute TTL
const userCache = new LRUCache<User>(50, { ttl: 5 * 60 * 1000 });
const resourceCache = new LRUCache<Resource>(100, { ttl: 10 * 60 * 1000 });

// Usage in API functions
export async function fetchUser(userId: string): Promise<User> {
    // Check cache
    const cached = userCache.get(userId);
    if (cached) return cached;

    // Fetch and cache
    const user = await fetch(`/api/users/${userId}`).then(r => r.json());
    userCache.set(userId, user);
    return user;
}

// Cache statistics
const stats = userCache.getStats();
console.log(`Cache hit rate: ${stats.hits}/${stats.total}`);
```

### StorageCache for Persistence

```typescript
import { StorageCache } from '@/lib/utils/cache';

// Persists to localStorage with TTL
const persistedCache = new StorageCache('app-cache', 60 * 60 * 1000); // 1 hour

export async function fetchWithPersistence(key: string) {
    // Check localStorage first
    const cached = persistedCache.get(key);
    if (cached) return cached;

    // Fetch and persist
    const data = await fetchData(key);
    persistedCache.set(key, JSON.stringify(data));
    return data;
}

// Clear persisted cache on logout
export function logout() {
    persistedCache.clear();
}
```

### Cache Invalidation

```typescript
// Invalidate specific cache entry
export async function updateUser(userId: string, updates: User) {
    const result = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    });

    // Invalidate cache
    userCache.delete(userId);
    logger.info(`Cache invalidated for user ${userId}`);

    return result.json();
}

// Clear entire cache on batch operations
export async function importUsers(users: User[]) {
    await fetch('/api/users/bulk', { method: 'POST', body: JSON.stringify(users) });
    userCache.clear(); // Clear all cached users
}
```

---

## Logging Best Practices

### Structured Logging

```typescript
import { logger } from '@/lib/utils/logger';

// Info level - normal operations
logger.info('User logged in', { userId: '123', timestamp: Date.now() });

// Debug level - detailed info for debugging
logger.debug('Processing request', { endpoint: '/api/users', queryParams: { page: 1 } });

// Warn level - potentially problematic situations
logger.warn('Cache miss for critical data', { dataType: 'user', misses: 5 });

// Error level - error conditions
logger.error('Database connection failed', error, { retry: 3, nextAttempt: '5s' });
```

### API Call Logging

```typescript
export async function fetchData(endpoint: string) {
    const startTime = Date.now();
    
    logger.info(`API call started`, { endpoint });
    
    try {
        const response = await fetch(endpoint);
        const duration = Date.now() - startTime;
        
        logger.info(`API call successful`, {
            endpoint,
            status: response.status,
            duration: `${duration}ms`
        });
        
        return response.json();
    } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`API call failed`, error, {
            endpoint,
            duration: `${duration}ms`
        });
        throw error;
    }
}
```

### Exporting Logs

```typescript
export async function exportApplicationLogs() {
    const logs = logger.export();
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${Date.now()}.json`;
    a.click();
}
```

---

## Analytics Integration

### Event Tracking

```typescript
import { analytics } from '@/lib/utils/analytics';

// Track custom events
analytics.trackEvent('user_signup', {
    method: 'email',
    plan: 'premium'
});

// Track page views
analytics.trackPageView('/dashboard');

// Track errors
analytics.trackError(new Error('Payment failed'), {
    context: 'checkout',
    amount: 99.99
});

// Track performance
analytics.trackPerformanceMetric('dashboard_load', 1250); // ms
```

### Funnel Tracking

```typescript
const signupFunnel = new FunnelTracker('signup');

// Step 1: User views signup form
signupFunnel.enter();

// Step 2: User enters email
signupFunnel.track('email_entered');

// Step 3: User enters password
signupFunnel.track('password_entered');

// Step 4: User submits form
signupFunnel.track('form_submitted');

// Get funnel data
const funnel = signupFunnel.getFunnel();
console.log(`Signup conversion rate: ${funnel.completionRate * 100}%`);

// Get abandoned data
const abandoned = signupFunnel.getAbandoned();
console.log(`Users abandoned at: ${abandoned.abandonedAt}`);
```

### Session Tracking

```typescript
// Set user ID
analytics.setUserId('user-123');

// Get summary
const summary = analytics.getAnalyticsSummary();
console.log(`Events tracked: ${summary.totalEvents}`);
console.log(`Errors: ${summary.totalErrors}`);

// Export for analysis
const data = analytics.export();
fetch('/api/analytics', { method: 'POST', body: JSON.stringify(data) });
```

---

## Offline Support

### Using OfflineQueue

```typescript
import { OfflineQueue } from '@/lib/utils/data-fetching';

const offlineQueue = new OfflineQueue();

export async function saveDataWithOfflineSupport(data: any) {
    try {
        const response = await fetch('/api/data', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            offlineQueue.clear(); // Clear queued requests
            return response.json();
        }
    } catch (error) {
        // Queue the request for later
        offlineQueue.enqueue({
            method: 'POST',
            url: '/api/data',
            body: JSON.stringify(data),
            timestamp: Date.now()
        });
        
        logger.warn('Request queued for offline sync', { data });
    }
}

// Sync when back online
window.addEventListener('online', async () => {
    const requests = offlineQueue.dequeue();
    for (const req of requests) {
        try {
            await fetch(req.url, {
                method: req.method,
                body: req.body
            });
        } catch (error) {
            logger.error('Failed to sync offline request', error);
        }
    }
});
```

---

## Performance Monitoring

### Component Render Time Tracking

```typescript
import { performanceMonitor } from '@/lib/utils/performance';
import { useRenderMetrics } from '@/lib/utils/performance';

export function DashboardPage() {
    useRenderMetrics('dashboard-page');

    // Component logic...
}
```

### Manual Measurements

```typescript
import { measureAsync, measureSync } from '@/lib/utils/performance';

// Async operations
export async function heavyComputation() {
    return measureAsync(
        async () => {
            // Expensive async work
            return await complexCalculation();
        },
        'heavy-computation'
    );
}

// Sync operations
export function sortLargeArray(arr: number[]) {
    return measureSync(
        () => {
            return [...arr].sort((a, b) => a - b);
        },
        'array-sort'
    );
}
```

### Performance Analytics

```typescript
export function reportPerformanceMetrics() {
    const metrics = performanceMonitor.getMetrics();
    
    metrics.forEach(metric => {
        if (metric.average > 1000) {
            logger.warn(`Slow operation detected: ${metric.name}`, {
                average: `${metric.average}ms`,
                max: `${metric.max}ms`,
                count: metric.count
            });
        }
    });
}
```

---

## Request Deduplication

### Preventing Duplicate Requests

```typescript
import { RequestDeduplicator } from '@/lib/utils/data-fetching';

const deduplicator = new RequestDeduplicator();

export async function fetchUserProfile(userId: string) {
    const cacheKey = `user-profile-${userId}`;
    
    // Execute only once, other requests share the result
    return deduplicator.execute(cacheKey, async () => {
        return fetch(`/api/users/${userId}`).then(r => r.json());
    });
}

// Multiple rapid calls will only trigger one fetch
Promise.all([
    fetchUserProfile('user-1'),
    fetchUserProfile('user-1'),
    fetchUserProfile('user-1')
]); // Only 1 API call made
```

---

## Data Fetching Patterns

### Batch Processing

```typescript
import { BatchProcessor } from '@/lib/utils/data-fetching';

const batchProcessor = new BatchProcessor(
    async (items) => {
        return fetch('/api/bulk-process', {
            method: 'POST',
            body: JSON.stringify({ items })
        });
    },
    50, // batch size
    100 // delay ms
);

export async function processItem(item: any) {
    return batchProcessor.add(item);
}

// Items are automatically batched and processed
items.forEach(item => processItem(item));
```

---

## Advanced Hooks Usage

### Async State Management

```typescript
import { useAsync, useSubmit, useDebouncedAsync } from '@/lib/hooks/use-async';

export function UserSearch() {
    // Automatic loading state management
    const { data, loading, error, execute } = useAsync(
        (query: string) => fetch(`/api/search?q=${query}`).then(r => r.json()),
        []
    );

    // Debounced async calls
    const { execute: search } = useDebouncedAsync(
        (query: string) => execute(query),
        500
    );

    return (
        <input onChange={(e) => search(e.target.value)} />
    );
}
```

### Form Submission

```typescript
import { useSubmit } from '@/lib/hooks/use-async';

export function LoginForm() {
    const { execute: submit, loading, error } = useSubmit(
        async (credentials) => {
            const response = await fetch('/api/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });
            if (!response.ok) throw new Error('Login failed');
            return response.json();
        }
    );

    return (
        <button onClick={() => submit()} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
        </button>
    );
}
```

### Local Storage Integration

```typescript
import { useLocalStorage } from '@/lib/hooks/use-advanced';

export function UserPreferences() {
    const [theme, setTheme] = useLocalStorage('theme', 'light');
    const [notifications, setNotifications] = useLocalStorage('notifications', true);

    return (
        <div>
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                Toggle Theme: {theme}
            </button>
        </div>
    );
}
```

### Online Status Detection

```typescript
import { useOnlineStatus, usePolling } from '@/lib/hooks/use-advanced';

export function DataSync() {
    const isOnline = useOnlineStatus();

    usePolling(
        async () => {
            if (isOnline) {
                await syncData();
            }
        },
        5000 // poll every 5 seconds
    );

    return (
        <div>
            Status: {isOnline ? '🟢 Online' : '🔴 Offline'}
        </div>
    );
}
```

---

## Examples & Patterns

### Complete API Module Example

```typescript
import { handleApiError, AppError } from '@/lib/utils/error-handler';
import { logger } from '@/lib/utils/logger';
import { LRUCache } from '@/lib/utils/cache';
import { analytics } from '@/lib/utils/analytics';
import { RequestDeduplicator } from '@/lib/utils/data-fetching';

interface Post {
    id: string;
    title: string;
    content: string;
}

const postCache = new LRUCache<Post>(100, { ttl: 10 * 60 * 1000 });
const deduplicator = new RequestDeduplicator();

export async function fetchPost(postId: string): Promise<Post> {
    try {
        // 1. Check cache
        const cached = postCache.get(postId);
        if (cached) {
            logger.debug(`Post ${postId} retrieved from cache`);
            return cached;
        }

        // 2. Deduplicate concurrent requests
        const post = await deduplicator.execute(`post-${postId}`, async () => {
            logger.info(`Fetching post ${postId}`);
            
            const response = await fetch(`/api/posts/${postId}`);
            if (!response.ok) {
                throw new AppError(
                    `Post not found`,
                    'POST_NOT_FOUND',
                    response.status,
                    { postId }
                );
            }

            return response.json() as Promise<Post>;
        });

        // 3. Cache the result
        postCache.set(postId, post);

        // 4. Track analytics
        analytics.trackEvent('post_fetched', { postId });

        return post;
    } catch (error) {
        const appError = handleApiError(error);
        logger.error(`Error fetching post ${postId}`, appError);
        analytics.trackError(appError);
        throw appError;
    }
}

export async function updatePost(postId: string, updates: Partial<Post>): Promise<Post> {
    try {
        logger.info(`Updating post ${postId}`, updates);

        const response = await fetch(`/api/posts/${postId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        if (!response.ok) {
            throw new AppError(
                'Failed to update post',
                'POST_UPDATE_ERROR',
                response.status
            );
        }

        const updatedPost = await response.json();

        // Invalidate cache
        postCache.delete(postId);
        logger.info(`Cache invalidated for post ${postId}`);

        analytics.trackEvent('post_updated', { postId });

        return updatedPost;
    } catch (error) {
        const appError = handleApiError(error);
        logger.error(`Error updating post ${postId}`, appError);
        analytics.trackError(appError);
        throw appError;
    }
}
```

### Complete Component Example

```typescript
import React, { useState } from 'react';
import { useAsync } from '@/lib/hooks/use-async';
import { useLocalStorage } from '@/lib/hooks/use-advanced';
import { useOnlineStatus } from '@/lib/hooks/use-advanced';
import { logger } from '@/lib/utils/logger';
import { analytics } from '@/lib/utils/analytics';

export function PostList() {
    const isOnline = useOnlineStatus();
    const [filters, setFilters] = useLocalStorage('post-filters', {});

    const { data: posts, loading, error, execute: fetchPosts } = useAsync(
        async () => {
            if (!isOnline) {
                logger.warn('Offline - using cached posts');
                return getCachedPosts();
            }

            const response = await fetch('/api/posts');
            if (!response.ok) throw new Error('Failed to fetch posts');
            return response.json();
        },
        [isOnline]
    );

    React.useEffect(() => {
        fetchPosts();
        analytics.trackPageView('/posts');
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div>
            <h1>Posts {!isOnline && '(Offline Mode)'}</h1>
            {posts?.map(post => (
                <article key={post.id}>{post.title}</article>
            ))}
        </div>
    );
}
```

---

## Migration Checklist

When integrating utilities into existing code:

- [ ] Update API functions to use error handling
- [ ] Add caching to expensive queries
- [ ] Replace console.log with logger calls
- [ ] Add analytics tracking to key user actions
- [ ] Integrate offline support for critical operations
- [ ] Add performance monitoring to slow components
- [ ] Use request deduplication for parallel requests
- [ ] Update components to use advanced hooks
- [ ] Add error boundaries and fallbacks
- [ ] Test offline scenarios
- [ ] Monitor performance metrics
- [ ] Review analytics data regularly
