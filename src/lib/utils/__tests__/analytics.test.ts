import { describe, it, expect, beforeEach } from 'vitest';
import { analytics, funnelTracker, AnalyticsEventEmitter } from '@/lib/utils/analytics';

describe('Analytics Utilities', () => {
    beforeEach(() => {
        analytics.clear();
    });

    describe('Analytics', () => {
        it('should track events', () => {
            analytics.trackEvent('test_event', 'test_category', { value: 123 });
            const events = analytics.getEvents();
            expect(events.length).toBe(1);
            expect(events[0].name).toBe('test_event');
        });

        it('should track page views', () => {
            analytics.trackPageView('home', '/');
            const events = analytics.getEvents();
            expect(events[0].category).toBe('navigation');
        });

        it('should track user actions', () => {
            analytics.trackAction('click', 'button', { text: 'Submit' });
            const events = analytics.getEvents();
            expect(events[0].category).toBe('user_action');
        });

        it('should track errors', () => {
            analytics.trackError('api_error', 'NETWORK', { endpoint: '/api/data' });
            const events = analytics.getEvents();
            expect(events[0].category).toBe('error');
        });

        it('should track features', () => {
            analytics.trackFeature('cost_optimization');
            const events = analytics.getEvents();
            expect(events[0].category).toBe('feature');
        });

        it('should track performance metrics', () => {
            analytics.trackPerformance('api_response_time', 250, 'ms');
            const events = analytics.getEvents();
            expect(events[0].category).toBe('performance');
        });

        it('should set user ID', () => {
            analytics.setUserId('user123');
            analytics.trackEvent('test', 'test');
            const session = analytics.getSession();
            expect(session?.userId).toBe('user123');
        });

        it('should get analytics summary', () => {
            analytics.trackEvent('event1', 'category1');
            analytics.trackEvent('event2', 'category2');
            const summary = analytics.getSummary();
            expect(summary.totalEvents).toBe(2);
            expect(summary.eventsByCategory.category1).toBe(1);
        });

        it('should enable/disable analytics', () => {
            analytics.setEnabled(false);
            analytics.trackEvent('test', 'test');
            expect(analytics.getEvents().length).toBe(0);

            analytics.setEnabled(true);
            analytics.trackEvent('test', 'test');
            expect(analytics.getEvents().length).toBe(1);
        });

        it('should export analytics data', () => {
            analytics.trackEvent('test', 'test');
            const exported = analytics.export();
            const parsed = JSON.parse(exported);
            expect(parsed.events.length).toBe(1);
            expect(parsed.summary).toBeDefined();
        });
    });

    describe('FunnelTracker', () => {
        it('should track funnel steps', () => {
            funnelTracker.trackStep('signup', 'email_entered');
            expect(funnelTracker.getProgress('signup')).toBe(1);

            funnelTracker.trackStep('signup', 'password_entered');
            expect(funnelTracker.getProgress('signup')).toBe(2);
        });

        it('should complete funnel', () => {
            funnelTracker.trackStep('signup', 'step1');
            funnelTracker.completeFunnel('signup');
            expect(funnelTracker.getProgress('signup')).toBe(0);
        });

        it('should track abandoned funnel', () => {
            funnelTracker.trackStep('signup', 'step1');
            funnelTracker.abandonFunnel('signup', 1);
            expect(funnelTracker.getProgress('signup')).toBe(0);
        });
    });

    describe('AnalyticsEventEmitter', () => {
        let emitter: AnalyticsEventEmitter;

        beforeEach(() => {
            emitter = new AnalyticsEventEmitter();
        });

        it('should subscribe and emit events', () => {
            const callback = vi.fn();
            emitter.on('test_event', callback);
            emitter.emit('test_event', { data: 'test' });
            expect(callback).toHaveBeenCalledWith({ data: 'test' });
        });

        it('should unsubscribe from events', () => {
            const callback = vi.fn();
            const unsubscribe = emitter.on('test_event', callback);
            unsubscribe();
            emitter.emit('test_event');
            expect(callback).not.toHaveBeenCalled();
        });

        it('should remove all listeners for event', () => {
            const callback = vi.fn();
            emitter.on('test_event', callback);
            emitter.off('test_event');
            emitter.emit('test_event');
            expect(callback).not.toHaveBeenCalled();
        });

        it('should clear all listeners', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();
            emitter.on('event1', callback1);
            emitter.on('event2', callback2);
            emitter.clear();
            emitter.emit('event1');
            emitter.emit('event2');
            expect(callback1).not.toHaveBeenCalled();
            expect(callback2).not.toHaveBeenCalled();
        });
    });
});

import { vi } from 'vitest';
