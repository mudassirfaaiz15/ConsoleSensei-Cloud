/**
 * Feature flags for ConsoleSensei
 * Allows enabling/disabling features without code changes
 */

export enum FeatureFlag {
    // Analytics & Monitoring
    ANALYTICS_ENABLED = 'analytics_enabled',
    PERFORMANCE_MONITORING = 'performance_monitoring',
    ERROR_TRACKING = 'error_tracking',

    // Data Features
    OFFLINE_SYNC = 'offline_sync',
    REQUEST_DEDUPLICATION = 'request_deduplication',
    RESPONSE_CACHING = 'response_caching',

    // UI Features
    ADVANCED_FILTERS = 'advanced_filters',
    BULK_ACTIONS = 'bulk_actions',
    INLINE_EDITING = 'inline_editing',

    // Security
    MFA_REQUIRED = 'mfa_required',
    SESSION_TIMEOUT = 'session_timeout',
}

interface FeatureFlagConfig {
    enabled: boolean;
    rolloutPercentage?: number; // 0-100 for gradual rollout
    description: string;
}

class FeatureFlags {
    private flags: Map<FeatureFlag, FeatureFlagConfig> = new Map([
        [FeatureFlag.ANALYTICS_ENABLED, { enabled: true, description: 'Enable analytics tracking' }],
        [FeatureFlag.PERFORMANCE_MONITORING, { enabled: true, description: 'Enable performance monitoring' }],
        [FeatureFlag.ERROR_TRACKING, { enabled: true, description: 'Enable error tracking' }],
        [FeatureFlag.OFFLINE_SYNC, { enabled: true, description: 'Enable offline sync queue' }],
        [FeatureFlag.REQUEST_DEDUPLICATION, { enabled: true, description: 'Enable request deduplication' }],
        [FeatureFlag.RESPONSE_CACHING, { enabled: true, description: 'Enable response caching' }],
        [FeatureFlag.ADVANCED_FILTERS, { enabled: true, rolloutPercentage: 100, description: 'Enable advanced filters' }],
        [FeatureFlag.BULK_ACTIONS, { enabled: false, rolloutPercentage: 50, description: 'Enable bulk actions' }],
        [FeatureFlag.INLINE_EDITING, { enabled: false, rolloutPercentage: 25, description: 'Enable inline editing' }],
        [FeatureFlag.MFA_REQUIRED, { enabled: false, description: 'Require MFA for all users' }],
        [FeatureFlag.SESSION_TIMEOUT, { enabled: true, description: 'Enable session timeout' }],
    ]);

    /**
     * Check if a feature is enabled
     */
    isEnabled(flag: FeatureFlag): boolean {
        const config = this.flags.get(flag);
        if (!config) return false;

        if (!config.enabled) return false;

        // Check rollout percentage
        if (config.rolloutPercentage !== undefined) {
            const random = Math.random() * 100;
            return random < config.rolloutPercentage;
        }

        return true;
    }

    /**
     * Check if a feature is enabled for a specific user
     */
    isEnabledForUser(flag: FeatureFlag, userId: string): boolean {
        const isEnabled = this.isEnabled(flag);
        if (!isEnabled) return false;

        // Use consistent hashing for per-user rollout
        const config = this.flags.get(flag);
        if (config?.rolloutPercentage !== undefined) {
            const hash = this.hashUserId(userId);
            return (hash % 100) < config.rolloutPercentage;
        }

        return true;
    }

    /**
     * Get all flags
     */
    getAllFlags(): Record<string, FeatureFlagConfig> {
        const result: Record<string, FeatureFlagConfig> = {};
        this.flags.forEach((config, flag) => {
            result[flag] = config;
        });
        return result;
    }

    /**
     * Set flag state (for testing or runtime config)
     */
    setFlag(flag: FeatureFlag, enabled: boolean, rolloutPercentage?: number): void {
        const existing = this.flags.get(flag);
        this.flags.set(flag, {
            enabled,
            rolloutPercentage,
            description: existing?.description || flag,
        });
    }

    /**
     * Simple hash function for consistent user-based rollout
     */
    private hashUserId(userId: string): number {
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            const char = userId.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
}

export const featureFlags = new FeatureFlags();
