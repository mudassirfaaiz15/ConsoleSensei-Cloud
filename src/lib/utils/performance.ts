/**
 * Performance monitoring and metrics collection
 * Tracks application performance, API calls, and component rendering
 */

import { logger } from './logger';

interface PerformanceMetric {
    name: string;
    duration: number;
    timestamp: number;
    metadata?: Record<string, any>;
}

interface ComponentMetrics {
    name: string;
    renderCount: number;
    totalRenderTime: number;
    averageRenderTime: number;
    slowestRender: number;
}

class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private componentMetrics: Map<string, ComponentMetrics> = new Map();
    private marks: Map<string, number> = new Map();
    private maxMetrics = 500;

    /**
     * Mark start of operation
     */
    mark(name: string): void {
        this.marks.set(name, performance.now());
    }

    /**
     * End mark and record metric
     */
    measure(
        name: string,
        metadata?: Record<string, unknown>,
    ): number {
        const startTime = this.marks.get(name);
        if (!startTime) {
            logger.warn('Mark not found', { name });
            return 0;
        }

        const duration = performance.now() - startTime;
        this.recordMetric(name, duration, metadata);
        this.marks.delete(name);

        return duration;
    }

    /**
     * Record API call metric
     */
    recordApiCall(
        method: string,
        endpoint: string,
        duration: number,
        status: number,
    ): void {
        this.recordMetric(`API_${method}_${endpoint}`, duration, {
            method,
            endpoint,
            status,
        } as Record<string, unknown>);

        if (duration > 5000) {
            logger.warn('Slow API call detected', {
                method,
                endpoint,
                duration,
            });
        }
    }

    /**
     * Record component render time
     */
    recordComponentRender(componentName: string, renderTime: number): void {
        const existing = this.componentMetrics.get(componentName) || {
            name: componentName,
            renderCount: 0,
            totalRenderTime: 0,
            averageRenderTime: 0,
            slowestRender: 0,
        };

        existing.renderCount++;
        existing.totalRenderTime += renderTime;
        existing.averageRenderTime = existing.totalRenderTime / existing.renderCount;
        existing.slowestRender = Math.max(existing.slowestRender, renderTime);

        this.componentMetrics.set(componentName, existing);

        if (renderTime > 1000) {
            logger.warn('Slow component render detected', {
                component: componentName,
                renderTime,
            });
        }
    }

    /**
     * Get all metrics
     */
    getMetrics(): PerformanceMetric[] {
        return [...this.metrics];
    }

    /**
     * Get component metrics
     */
    getComponentMetrics(): ComponentMetrics[] {
        return Array.from(this.componentMetrics.values());
    }

    /**
     * Get metrics summary
     */
    getSummary() {
        const apiCalls = this.metrics.filter(m => m.name.startsWith('API_'));
        const avgApiDuration = apiCalls.length > 0
            ? apiCalls.reduce((sum, m) => sum + m.duration, 0) / apiCalls.length
            : 0;

        return {
            totalMetrics: this.metrics.length,
            totalApiCalls: apiCalls.length,
            averageApiDuration: avgApiDuration,
            components: this.componentMetrics.size,
            slowestComponent: Array.from(this.componentMetrics.values()).sort(
                (a, b) => b.slowestRender - a.slowestRender,
            )[0],
        };
    }

    /**
     * Clear metrics
     */
    clear(): void {
        this.metrics = [];
        this.componentMetrics.clear();
        this.marks.clear();
        logger.info('Performance metrics cleared');
    }

    /**
     * Export metrics as JSON
     */
    export(): string {
        return JSON.stringify({
            metrics: this.metrics,
            components: Array.from(this.componentMetrics.values()),
            summary: this.getSummary(),
        }, null, 2);
    }

    /**
     * Record metric
     */
    private recordMetric(
        name: string,
        duration: number,
        metadata?: Record<string, any>,
    ): void {
        this.metrics.push({
            name,
            duration,
            timestamp: Date.now(),
            metadata,
        });

        // Keep only recent metrics
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics);
        }

        logger.debug(`Metric: ${name}`, { duration, ...metadata });
    }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for monitoring component render time
 */
export function useRenderMetrics(componentName: string) {
    const renderStartTime = React.useRef(performance.now());

    React.useEffect(() => {
        const renderTime = performance.now() - renderStartTime.current;
        performanceMonitor.recordComponentRender(componentName, renderTime);
    });
}

/**
 * Measure async function execution
 */
export async function measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>,
): Promise<T> {
    performanceMonitor.mark(name);
    try {
        const result = await fn();
        performanceMonitor.measure(name, metadata);
        return result;
    } catch (error) {
        performanceMonitor.measure(name, { ...metadata, error: true });
        throw error;
    }
}

/**
 * Measure sync function execution
 */
export function measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>,
): T {
    performanceMonitor.mark(name);
    try {
        const result = fn();
        performanceMonitor.measure(name, metadata);
        return result;
    } catch (error) {
        performanceMonitor.measure(name, { ...metadata, error: true });
        throw error;
    }
}

import React from 'react';
