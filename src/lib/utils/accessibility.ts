/**
 * Accessibility utilities for ConsoleSensei
 * Provides helpers for ARIA labels, keyboard navigation, and screen reader support
 */

/**
 * Generate ARIA label for resource status
 * @param status - The resource status (safe, warning, critical)
 * @returns Accessible label string
 */
export function getStatusAriaLabel(status: 'safe' | 'warning' | 'critical'): string {
    const labels: Record<string, string> = {
        safe: 'Status is safe',
        warning: 'Status warning',
        critical: 'Status critical',
    };
    return labels[status] || 'Unknown status';
}

/**
 * Generate ARIA label for currency values
 * @param amount - The amount in dollars
 * @returns Accessible label string
 */
export function getCurrencyAriaLabel(amount: number): string {
    return `${amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
    })} USD`;
}

/**
 * Generate ARIA label for percentage changes
 * @param percentage - The percentage change
 * @param type - The type of change (up, down, neutral)
 * @returns Accessible label string
 */
export function getChangeAriaLabel(percentage: number, type: 'up' | 'down' | 'neutral'): string {
    const direction = type === 'up' ? 'increased' : type === 'down' ? 'decreased' : 'changed';
    return `${direction} by ${Math.abs(percentage)}%`;
}

/**
 * Generate ARIA label for alert severity
 * @param severity - The alert severity level
 * @returns Accessible label string
 */
export function getAlertAriaLabel(severity: 'critical' | 'warning' | 'info'): string {
    const labels: Record<string, string> = {
        critical: 'Critical alert',
        warning: 'Warning alert',
        info: 'Information alert',
    };
    return labels[severity] || 'Alert';
}

/**
 * Handle keyboard navigation for list items
 * @param event - The keyboard event
 * @param onEnter - Callback when Enter is pressed
 * @param onSpace - Callback when Space is pressed
 */
export function handleKeyboardNavigation(
    event: React.KeyboardEvent,
    onEnter?: () => void,
    onSpace?: () => void,
): void {
    if (event.key === 'Enter' && onEnter) {
        event.preventDefault();
        onEnter();
    } else if (event.key === ' ' && onSpace) {
        event.preventDefault();
        onSpace();
    }
}

/**
 * Announce message to screen readers
 * @param message - The message to announce
 * @param priority - The priority level (polite, assertive)
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

/**
 * Focus management utilities
 */
export const focusManagement = {
    /**
     * Focus first focusable element in a container
     */
    focusFirst(container: HTMLElement | null): void {
        if (!container) return;
        const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const firstFocusable = container.querySelector(focusableSelector) as HTMLElement;
        firstFocusable?.focus();
    },

    /**
     * Focus last focusable element in a container
     */
    focusLast(container: HTMLElement | null): void {
        if (!container) return;
        const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusables = container.querySelectorAll(focusableSelector) as NodeListOf<HTMLElement>;
        focusables[focusables.length - 1]?.focus();
    },

    /**
     * Trap focus within a container (for modals)
     */
    trapFocus(container: HTMLElement | null, event: KeyboardEvent): void {
        if (!container || event.key !== 'Tab') return;

        const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusables = container.querySelectorAll(focusableSelector) as NodeListOf<HTMLElement>;

        if (focusables.length === 0) {
            event.preventDefault();
            return;
        }

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];
        const activeElement = document.activeElement;

        if (event.shiftKey) {
            // Shift + Tab
            if (activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab
            if (activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }
    },
};

/**
 * Color contrast checker (WCAG compliance)
 */
export const colorContrast = {
    /**
     * Calculate relative luminance
     */
    getLuminance(r: number, g: number, b: number): number {
        const [rs, gs, bs] = [r, g, b].map(x => {
            x = x / 255;
            return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    },

    /**
     * Calculate contrast ratio between two colors
     */
    getContrastRatio(color1: string, color2: string): number {
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);

        if (!rgb1 || !rgb2) return 0;

        const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
        const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);

        const lighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);

        return (lighter + 0.05) / (darker + 0.05);
    },

    /**
     * Check if contrast meets WCAG AA standard
     */
    meetsWCAG_AA(color1: string, color2: string): boolean {
        return this.getContrastRatio(color1, color2) >= 4.5;
    },

    /**
     * Check if contrast meets WCAG AAA standard
     */
    meetsWCAG_AAA(color1: string, color2: string): boolean {
        return this.getContrastRatio(color1, color2) >= 7;
    },

    /**
     * Convert hex color to RGB
     */
    hexToRgb(hex: string): { r: number; g: number; b: number } | null {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? {
                  r: parseInt(result[1], 16),
                  g: parseInt(result[2], 16),
                  b: parseInt(result[3], 16),
              }
            : null;
    },
};
