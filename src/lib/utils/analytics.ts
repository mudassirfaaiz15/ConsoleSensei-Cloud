/**
 * Analytics and telemetry system
 * Tracks user interactions, feature usage, and application events
 */

import { logger } from './logger';

interface AnalyticsEvent {
    name: string;
    category: string;
    timestamp: number;
    metadata?: Record<string, unknown>;
    userId?: string;
}

interface UserSession {
    sessionId: string;
    startTime: number;
    endTime?: number;
    userId?: string;
    events: AnalyticsEvent[];
}

class Analytics {
    private events: AnalyticsEvent[] = [];
    private session: UserSession | null = null;
    private maxEvents = 1000;
    private enabled = true;
    private readonly sessionStorageKey = 'analytics_session';

    constructor() {
        this.initializeSession();
    }

    /**
     * Track event
     */
    trackEvent(name: string, category: string, metadata?: Record<string, unknown>): void {
        if (!this.enabled) return;

        const event: AnalyticsEvent = {
            name,
            category,
            timestamp: Date.now(),
            metadata,
            userId: this.session?.userId,
        };

        this.events.push(event);

        // Add to session
        if (this.session) {
            this.session.events.push(event);
        }

        // Keep only recent events
        if (this.events.length > this.maxEvents) {
            this.events = this.events.slice(-this.maxEvents);
        }

        logger.debug('Analytics event', { name, category, ...metadata });
    }

    /**
     * Track page view
     */
    trackPageView(pageName: string, path: string): void {
        this.trackEvent('page_view', 'navigation', {
            page: pageName,
            path,
        });
    }

    /**
     * Track user action
     */
    trackAction(action: string, target: string, metadata?: Record<string, unknown>): void {
        this.trackEvent(action, 'user_action', {
            target,
            ...metadata,
        });
    }

    /**
     * Track error
     */
    trackError(errorName: string, errorCode: string, metadata?: Record<string, unknown>): void {
        this.trackEvent(errorName, 'error', {
            code: errorCode,
            ...metadata,
        });
    }

    /**
     * Track feature usage
     */
    trackFeature(featureName: string, metadata?: Record<string, unknown>): void {
        this.trackEvent(featureName, 'feature', metadata);
    }

    /**
     * Track performance metric
     */
    trackPerformance(metricName: string, value: number, unit: string): void {
        this.trackEvent(metricName, 'performance', {
            value,
            unit,
        });
    }

    /**
     * Set user ID
     */
    setUserId(userId: string): void {
        if (this.session) {
            this.session.userId = userId;
        }
    }

    /**
     * Get all events
     */
    getEvents(): AnalyticsEvent[] {
        return [...this.events];
    }

    /**
     * Get session
     */
    getSession(): UserSession | null {
        return this.session ? { ...this.session } : null;
    }

    /**
     * Get analytics summary
     */
    getSummary() {
        const eventsByCategory = this.events.reduce(
            (acc, event) => {
                acc[event.category] = (acc[event.category] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>,
        );

        return {
            totalEvents: this.events.length,
            eventsByCategory,
            session: this.session ? {
                duration: (this.session.endTime || Date.now()) - this.session.startTime,
                eventCount: this.session.events.length,
            } : null,
        };
    }

    /**
     * Export analytics data
     */
    export(): string {
        return JSON.stringify({
            events: this.events,
            session: this.session,
            summary: this.getSummary(),
        }, null, 2);
    }

    /**
     * Clear events
     */
    clear(): void {
        this.events = [];
        logger.info('Analytics events cleared');
    }

    /**
     * Enable/disable analytics
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        logger.info('Analytics', { enabled });
    }

    /**
     * Initialize session
     */
    private initializeSession(): void {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        this.session = {
            sessionId,
            startTime: Date.now(),
            events: [],
        };

        logger.info('Analytics session started', { sessionId });

        // End session on beforeunload
        window.addEventListener('beforeunload', () => {
            if (this.session) {
                this.session.endTime = Date.now();
                this.saveSession();
            }
        });
    }

    /**
     * Save session to storage
     */
    private saveSession(): void {
        try {
            if (this.session) {
                sessionStorage.setItem(this.sessionStorageKey, JSON.stringify(this.session));
            }
        } catch (error) {
            logger.error('Failed to save analytics session', error);
        }
    }
}

export const analytics = new Analytics();

/**
 * Funnel tracking for user flows
 */
export class FunnelTracker {
    private funnels: Map<string, string[]> = new Map();

    /**
     * Track funnel step
     */
    trackStep(funnelName: string, step: string): void {
        if (!this.funnels.has(funnelName)) {
            this.funnels.set(funnelName, []);
        }

        const steps = this.funnels.get(funnelName)!;
        steps.push(step);

        analytics.trackEvent(`funnel_${funnelName}`, 'funnel', {
            step,
            stepNumber: steps.length,
        });
    }

    /**
     * Complete funnel
     */
    completeFunnel(funnelName: string): void {
        const steps = this.funnels.get(funnelName) || [];
        analytics.trackEvent(`funnel_completed`, 'funnel', {
            funnel: funnelName,
            steps: steps.length,
        });
        this.funnels.delete(funnelName);
    }

    /**
     * Abandon funnel
     */
    abandonFunnel(funnelName: string, stepNumber: number): void {
        analytics.trackEvent(`funnel_abandoned`, 'funnel', {
            funnel: funnelName,
            abandonedAtStep: stepNumber,
        });
        this.funnels.delete(funnelName);
    }

    /**
     * Get funnel progress
     */
    getProgress(funnelName: string): number {
        return this.funnels.get(funnelName)?.length || 0;
    }
}

export const funnelTracker = new FunnelTracker();

/**
 * Event emitter for analytics events
 */
export class AnalyticsEventEmitter {
    private listeners: Map<string, Function[]> = new Map();

    /**
     * Subscribe to event
     */
    on(event: string, callback: Function): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }

        this.listeners.get(event)!.push(callback);

        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(event)!;
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }

    /**
     * Emit event
     */
    emit(event: string, data?: any): void {
        const callbacks = this.listeners.get(event) || [];
        callbacks.forEach(callback => callback(data));
    }

    /**
     * Remove all listeners for event
     */
    off(event: string): void {
        this.listeners.delete(event);
    }

    /**
     * Clear all listeners
     */
    clear(): void {
        this.listeners.clear();
    }
}

export const analyticsEventEmitter = new AnalyticsEventEmitter();
