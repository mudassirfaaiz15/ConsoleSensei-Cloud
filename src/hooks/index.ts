/**
 * Consolidated hooks index
 * All application hooks exported from a single location
 * 
 * UI Hooks (component-specific): src/hooks/
 * Data Hooks (API/Query hooks): src/lib/hooks/
 */

// UI Hooks - Component level
export { useKeyboardShortcuts } from './use-keyboard-shortcuts';

// Data Hooks - API/Query level
export * from '../lib/hooks/index';
