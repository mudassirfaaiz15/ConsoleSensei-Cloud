# Quick Reference Guide

## Installation & Setup

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test:run

# Watch tests
npm run test

# Type check
npm run typecheck

# Lint
npm run lint
```

## Key Utilities

### Error Handling
```typescript
import { handleApiError, AppError, retryWithExponentialBackoff } from '@/lib/utils/error-handler';

// Custom error
throw new AppError('User not found', 'USER_NOT_FOUND', 404);

// Auto-handle errors
try { await fetch(...) } 
catch (error) { handleApiError(error); }

// Retry with backoff
await retryWithExponentialBackoff(() => fetch(...));
```

### Logging
```typescript
import { logger } from '@/lib/utils/logger';

logger.debug('Debug info', { key: 'value' });
logger.info('Info message', { context: 'data' });
logger.warn('Warning', error);
logger.error('Error', error, { context: 'operation' });

// Export logs
const logs = logger.export();
```

### Validation
```typescript
import { 
    validateEmail, 
    validateURL, 
    validateAwsResource,
    sanitizeHtml,
    RateLimiter 
} from '@/lib/utils/validation';

validateEmail('user@example.com'); // true
validateURL('https://example.com'); // true
validateAwsResource('arn:aws:s3:::bucket-name'); // true
sanitizeHtml('<img onerror="alert()">'); // safe HTML

const limiter = new RateLimiter(10, 60000); // 10 calls per minute
limiter.check('user-1'); // throws if limit exceeded
```

### Caching
```typescript
import { LRUCache, StorageCache } from '@/lib/utils/cache';

// In-memory cache with TTL
const cache = new LRUCache<User>(50, { ttl: 5 * 60 * 1000 });
cache.set('user-1', user);
const user = cache.get('user-1');
cache.delete('user-1');
cache.clear();

// Persistent cache
const persistent = new StorageCache('app-data', 60 * 60 * 1000);
persistent.set('key', value);
persistent.get('key');
```

### Performance Monitoring
```typescript
import { 
    useRenderMetrics, 
    measureAsync, 
    measureSync,
    performanceMonitor 
} from '@/lib/utils/performance';

// In React component
export function MyComponent() {
    useRenderMetrics('my-component');
    // ...
}

// Async measurement
const result = await measureAsync(
    () => expensiveOperation(),
    'operation-name'
);

// Sync measurement
const sorted = measureSync(
    () => arr.sort(),
    'sort-operation'
);

// Get metrics
const metrics = performanceMonitor.getMetrics();
```

### Analytics
```typescript
import { analytics, FunnelTracker } from '@/lib/utils/analytics';

// Event tracking
analytics.trackEvent('user_signup', { provider: 'google' });
analytics.trackPageView('/dashboard');
analytics.trackError(error, { context: 'payment' });
analytics.trackPerformanceMetric('api_response', 250);

// Funnel tracking
const funnel = new FunnelTracker('checkout');
funnel.enter();
funnel.track('email_entered');
funnel.track('payment_info_entered');
funnel.track('order_placed');

// Session management
analytics.setUserId('user-123');
const summary = analytics.getAnalyticsSummary();
const data = analytics.export();
```

### Data Fetching
```typescript
import { 
    RequestDeduplicator, 
    OfflineQueue, 
    BatchProcessor 
} from '@/lib/utils/data-fetching';

// Deduplication
const dedup = new RequestDeduplicator();
const result = await dedup.execute('cache-key', () => fetch(...));

// Offline support
const offline = new OfflineQueue();
offline.enqueue({ method: 'POST', url: '/api/data', body });
const pending = offline.dequeue();

// Batch processing
const batch = new BatchProcessor(
    async (items) => fetch('/api/bulk', { body: JSON.stringify({items}) }),
    50, // batch size
    100 // delay ms
);
await batch.add(item);
```

### Advanced Hooks

**Async Hooks**
```typescript
import { useAsync, useSubmit, useDebouncedAsync, usePolling } from '@/lib/hooks/use-async';

// Generic async
const { data, loading, error, execute } = useAsync(fetchData, []);

// Form submission
const { execute: submit, loading } = useSubmit(async (data) => {
    return fetch('/api/submit', { method: 'POST', body: JSON.stringify(data) });
});

// Debounced async
const { execute: search } = useDebouncedAsync((query) => search(query), 500);

// Polling
usePolling(() => syncData(), 5000);
```

**UI Hooks**
```typescript
import { 
    useLocalStorage, 
    useDebouncedValue,
    useOnlineStatus,
    useWindowSize,
    usePageVisibility,
    usePrevious,
    useIsMounted 
} from '@/lib/hooks/use-advanced';

// Local storage
const [theme, setTheme] = useLocalStorage('theme', 'light');

// Debounced value
const [searchTerm, search] = useState('');
const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

// Online status
const isOnline = useOnlineStatus();

// Window size
const { width, height } = useWindowSize();

// Page visibility
const isVisible = usePageVisibility();

// Previous value
const prevCount = usePrevious(count);

// Mount state
const mounted = useIsMounted();
```

**Analytics Hooks**
```typescript
import { useFeatureTracking, useFunnelTracking } from '@/lib/hooks/use-advanced';

// Feature tracking
useFeatureTracking('dashboard_view');

// Funnel tracking
const { enter, track, complete } = useFunnelTracking('signup');
enter();
track('email_entered');
complete();
```

## API Integration Pattern

```typescript
import { handleApiError } from '@/lib/utils/error-handler';
import { logger } from '@/lib/utils/logger';
import { LRUCache } from '@/lib/utils/cache';
import { analytics } from '@/lib/utils/analytics';

// Create cache
const cache = new LRUCache<Data>(50, { ttl: 5 * 60 * 1000 });

export async function fetchData(id: string) {
    try {
        // 1. Check cache
        const cached = cache.get(id);
        if (cached) return cached;

        // 2. Fetch
        logger.info('Fetching data', { id });
        const response = await fetch(`/api/data/${id}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // 3. Cache
        cache.set(id, data);

        // 4. Track
        analytics.trackEvent('data_fetched', { id });
        logger.info('Data fetched successfully', { id });

        return data;
    } catch (error) {
        const appError = handleApiError(error);
        logger.error('Failed to fetch data', appError);
        analytics.trackError(appError);
        throw appError;
    }
}
```

## Component Integration Pattern

```typescript
import { useAsync } from '@/lib/hooks/use-async';
import { useLocalStorage } from '@/lib/hooks/use-advanced';
import { useOnlineStatus } from '@/lib/hooks/use-advanced';
import { useRenderMetrics } from '@/lib/utils/performance';
import { analytics } from '@/lib/utils/analytics';

export function MyPage() {
    // Performance monitoring
    useRenderMetrics('my-page');

    // Local state
    const [filters, setFilters] = useLocalStorage('filters', {});
    
    // Online detection
    const isOnline = useOnlineStatus();

    // Async data
    const { data, loading, error } = useAsync(
        async () => {
            if (!isOnline) {
                return getCachedData();
            }
            return fetch('/api/data').then(r => r.json());
        },
        [isOnline]
    );

    // Analytics
    React.useEffect(() => {
        analytics.trackPageView('/my-page');
    }, []);

    if (loading) return <Spinner />;
    if (error) return <ErrorBoundary error={error} />;

    return <div>{/* content */}</div>;
}
```

## Testing

```bash
# Run all tests
npm run test:run

# Watch mode
npm run test

# Coverage
npm run test:coverage
```

**Test Example**
```typescript
import { describe, it, expect } from 'vitest';
import { handleApiError } from '@/lib/utils/error-handler';

describe('Error Handler', () => {
    it('should handle network errors', () => {
        const error = new Error('Network error');
        const result = handleApiError(error);
        expect(result.category).toBe('NETWORK');
    });
});
```

## Debugging

```typescript
// Log levels control verbosity
logger.debug('Detailed info'); // Most verbose
logger.info('General info');
logger.warn('Warning');
logger.error('Error'); // Least verbose

// Export logs for analysis
const logs = logger.export();
localStorage.setItem('app-logs', JSON.stringify(logs));

// Analytics data export
const data = analytics.export();
fetch('/api/analytics', { method: 'POST', body: JSON.stringify(data) });
```

## Performance Tips

1. **Use caching** for expensive queries
2. **Deduplicate requests** for concurrent calls
3. **Batch operations** when processing multiple items
4. **Monitor performance** with `useRenderMetrics`
5. **Enable offline support** for critical operations
6. **Track analytics** for user insights

## Common Patterns

### Retry on Failure
```typescript
await retryWithExponentialBackoff(() => fetch(...), {
    maxAttempts: 3,
    delayMs: 1000
});
```

### Cache with Automatic Invalidation
```typescript
await updateData(id, updates);
cache.delete(id); // Invalidate
```

### Offline-First
```typescript
const offline = new OfflineQueue();
try {
    await submitData(data);
} catch {
    offline.enqueue({ method: 'POST', url: '/api/data', body: data });
}
```

### Analytics Tracking
```typescript
analytics.trackEvent('action_completed', { duration: 250 });
analytics.trackError(error, { severity: 'high' });
```

## Resources

- [Setup Guide](./docs/SETUP.md)
- [Contributing Guidelines](./docs/CONTRIBUTING.md)
- [AWS Integration](./docs/AWS_INTEGRATION.md)
- [API Documentation](./docs/API.md)
- [API Integration](./docs/API_INTEGRATION.md)
- [Enterprise Features](./docs/NEXT_LEVEL_FEATURES.md)
