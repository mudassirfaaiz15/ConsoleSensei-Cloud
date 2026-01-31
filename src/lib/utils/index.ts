/**
 * Utility modules index
 * Centralized exports for all utility functions and classes
 *
 * @packageDocumentation
 *
 * ## Core Utilities
 * - **error-handler**: Comprehensive error handling and recovery
 * - **logger**: Structured logging system with categorized levels
 * - **validation**: Input validation and sanitization
 * - **cache**: LRU caching with persistence options
 *
 * ## Data Utilities
 * - **data-fetching**: Request deduplication and offline support
 * - **api**: Standardized API client with error handling
 *
 * ## Analytics & Monitoring
 * - **analytics**: Event tracking and funnel analysis
 * - **performance**: Performance monitoring and metrics
 *
 * ## Configuration & Features
 * - **feature-flags**: Feature flag management with gradual rollouts
 *
 * ## Accessibility
 * - **accessibility**: ARIA labels and keyboard navigation helpers
 */

export * from './error-handler';
export * from './logger';
export * from './validation';
export * from './api';
export * from './cache';
export * from './performance';
export * from './data-fetching';
export * from './analytics';
export * from './feature-flags';
export * from './accessibility';
