/**
 * Application configuration
 * Centralized configuration for environment-specific settings
 */

export const config = {
    // API Configuration
    api: {
        timeout: 30000, // 30 seconds
        retryAttempts: 3,
        retryDelay: 1000, // 1 second
        baseUrl: process.env.VITE_API_URL || 'https://api.consolesensei.com',
    },

    // Cache Configuration
    cache: {
        defaultTTL: 5 * 60 * 1000, // 5 minutes
        maxSize: 50,
        enablePersistence: true,
    },

    // Session Configuration
    session: {
        timeout: 30 * 60 * 1000, // 30 minutes
        warningTime: 5 * 60 * 1000, // 5 minutes before timeout
    },

    // Performance Thresholds
    performance: {
        slowApiThreshold: 5000, // 5 seconds
        slowRenderThreshold: 1000, // 1 second
        slowQueryThreshold: 3000, // 3 seconds
    },

    // AWS Configuration
    aws: {
        regions: [
            'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
            'eu-west-1', 'eu-west-2', 'eu-central-1',
            'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1',
        ],
        primaryRegion: 'us-east-1',
    },

    // Analytics Configuration
    analytics: {
        enabled: true,
        maxEvents: 1000,
        batchSize: 50,
        flushInterval: 60000, // 1 minute
    },

    // UI Configuration
    ui: {
        defaultPageSize: 20,
        maxPageSize: 100,
        debounceDelay: 300, // 300ms
    },

    // Feature Flags
    features: {
        analyticsEnabled: true,
        performanceMonitoringEnabled: true,
        offlineSyncEnabled: true,
    },

    // Environment
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isDemoMode: process.env.VITE_DEMO_MODE === 'true',
};

/**
 * Get configuration value with type safety
 */
export function getConfig<T>(path: string, defaultValue: T): T {
    const keys = path.split('.');
    let value: any = config;

    for (const key of keys) {
        value = value?.[key];
        if (value === undefined) return defaultValue;
    }

    return value ?? defaultValue;
}

/**
 * Update configuration at runtime
 */
export function updateConfig(path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop();

    if (!lastKey) return;

    let obj = config as any;
    for (const key of keys) {
        if (!(key in obj)) obj[key] = {};
        obj = obj[key];
    }

    obj[lastKey] = value;
}
