/**
 * Centralized logging utility
 * Provides consistent logging across the application with different severity levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: Record<string, unknown>;
    stack?: string;
}

class Logger {
    private isDevelopment = import.meta.env.DEV;
    private logs: LogEntry[] = [];
    private maxLogs = 100;

    /**
     * Debug level logging (development only)
     */
    debug(message: string, context?: Record<string, unknown>): void {
        if (this.isDevelopment) {
            console.debug(`[DEBUG] ${message}`, context);
        }
        this.addLog('debug', message, context);
    }

    /**
     * Info level logging
     */
    info(message: string, context?: Record<string, unknown>): void {
        console.info(`[INFO] ${message}`, context);
        this.addLog('info', message, context);
    }

    /**
     * Warning level logging
     */
    warn(message: string, context?: Record<string, unknown>): void {
        console.warn(`[WARN] ${message}`, context);
        this.addLog('warn', message, context);
    }

    /**
     * Error level logging
     */
    error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;
        console.error(`[ERROR] ${message}`, errorMessage, context);
        this.addLog('error', message, { ...context, error: errorMessage }, stack);
    }

    /**
     * Log API calls
     */
    logApiCall(method: string, endpoint: string, params?: unknown): void {
        this.debug(`API: ${method} ${endpoint}`, { params });
    }

    /**
     * Log API response
     */
    logApiResponse(method: string, endpoint: string, status: number, duration: number): void {
        this.debug(`API Response: ${method} ${endpoint} - ${status} (${duration}ms)`, {
            status,
            duration,
        });
    }

    /**
     * Log API error
     */
    logApiError(method: string, endpoint: string, error: unknown): void {
        this.error(`API Error: ${method} ${endpoint}`, error, {
            method,
            endpoint,
        });
    }

    /**
     * Get all logs
     */
    getLogs(): LogEntry[] {
        return [...this.logs];
    }

    /**
     * Clear logs
     */
    clearLogs(): void {
        this.logs = [];
    }

    /**
     * Export logs as JSON
     */
    exportLogs(): string {
        return JSON.stringify(this.logs, null, 2);
    }

    /**
     * Add log entry
     */
    private addLog(level: LogLevel, message: string, context?: Record<string, unknown>, stack?: string): void {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            stack,
        };

        this.logs.push(entry);

        // Keep only recent logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
    }
}

export const logger = new Logger();
