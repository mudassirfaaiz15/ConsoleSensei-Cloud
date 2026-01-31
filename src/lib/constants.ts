/**
 * Application-wide constants
 * Centralized configuration and magic numbers
 */

// AWS Configuration
export const AWS_CONFIG = {
    REGIONS: [
        { value: 'us-east-1', label: 'US East (N. Virginia)' },
        { value: 'us-west-2', label: 'US West (Oregon)' },
        { value: 'eu-west-1', label: 'EU (Ireland)' },
        { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
    ] as const,
    DEFAULT_REGION: 'us-east-1',
    CREDENTIAL_STORAGE_KEY: 'aws_credentials',
};

// API Configuration
export const API_CONFIG = {
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
    BASE_URL: import.meta.env.VITE_API_URL || '/api',
};

// Rate Limiting
export const RATE_LIMIT_CONFIG = {
    API_CALLS_PER_MINUTE: 60,
    USER_ACTIONS_PER_MINUTE: 30,
    SEARCH_QUERIES_PER_MINUTE: 20,
};

// Pagination
export const PAGINATION_CONFIG = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    DEFAULT_LIMIT: 10,
};

// Cache Duration (in milliseconds)
export const CACHE_DURATION = {
    SHORT: 5 * 60 * 1000, // 5 minutes
    MEDIUM: 15 * 60 * 1000, // 15 minutes
    LONG: 60 * 60 * 1000, // 1 hour
    VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
};

// Notification Config
export const NOTIFICATION_CONFIG = {
    DURATION: 4000, // 4 seconds
    MAX_NOTIFICATIONS: 5,
    POSITION: 'top-right' as const,
};

// Error Messages
export const ERROR_MESSAGES = {
    INVALID_CREDENTIALS: 'Invalid AWS credentials. Please verify and try again.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    TIMEOUT: 'Request timed out. Please try again.',
    UNAUTHORIZED: 'Unauthorized. Please log in again.',
    FORBIDDEN: 'You do not have permission to perform this action.',
    NOT_FOUND: 'Resource not found.',
    SERVER_ERROR: 'Server error. Please try again later.',
    VALIDATION_ERROR: 'Invalid input. Please check your data.',
    UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
    ACCOUNT_CONNECTED: 'AWS account connected successfully.',
    ACCOUNT_DISCONNECTED: 'AWS account disconnected.',
    SETTINGS_UPDATED: 'Settings updated successfully.',
    PROFILE_UPDATED: 'Profile updated successfully.',
    ACTION_COMPLETED: 'Action completed successfully.',
};

// Feature Flags
export const FEATURE_FLAGS = {
    ENABLE_MULTI_ACCOUNT: true,
    ENABLE_ADVANCED_ANALYTICS: true,
    ENABLE_COST_FORECASTING: true,
    ENABLE_SECURITY_AUDIT: true,
    ENABLE_TEAM_MANAGEMENT: true,
    ENABLE_CUSTOM_ALERTS: true,
};

// UI Configuration
export const UI_CONFIG = {
    SIDEBAR_WIDTH: '250px',
    HEADER_HEIGHT: '64px',
    MOBILE_BREAKPOINT: 768,
    ANIMATION_DURATION: 300, // ms
};

// Demo Mode Configuration
export const DEMO_CONFIG = {
    ENABLED: import.meta.env.VITE_DEMO_MODE === 'true',
    // Mock data refresh interval
    REFRESH_INTERVAL: 5000, // 5 seconds
};

// AWS Resource Types
export const AWS_RESOURCE_TYPES = {
    EC2: 'ec2',
    EBS: 'ebs',
    RDS: 'rds',
    S3: 's3',
    IAM: 'iam',
    LAMBDA: 'lambda',
    DYNAMODB: 'dynamodb',
    ELASTICACHE: 'elasticache',
    ALB: 'alb',
    NAT: 'nat',
    EIP: 'eip',
} as const;

// Security Levels
export const SECURITY_LEVELS = {
    CRITICAL: 'critical' as const,
    HIGH: 'high' as const,
    MEDIUM: 'medium' as const,
    LOW: 'low' as const,
    INFO: 'info' as const,
};

// Cost Trends
export const COST_TRENDS = {
    UP: 'up' as const,
    DOWN: 'down' as const,
    STABLE: 'stable' as const,
};

// User Roles
export const USER_ROLES = {
    ADMIN: 'admin' as const,
    MANAGER: 'manager' as const,
    USER: 'user' as const,
    VIEWER: 'viewer' as const,
};

// Local Storage Keys
export const LOCAL_STORAGE_KEYS = {
    THEME: 'theme',
    AUTH_TOKEN: 'auth_token',
    USER_PREFERENCES: 'user_preferences',
    LAST_AWS_ACCOUNT: 'last_aws_account',
    SIDEBAR_COLLAPSED: 'sidebar_collapsed',
};

// Time Ranges for Reports
export const TIME_RANGES = {
    LAST_7_DAYS: '7d',
    LAST_30_DAYS: '30d',
    LAST_90_DAYS: '90d',
    LAST_6_MONTHS: '6m',
    LAST_YEAR: '1y',
    CUSTOM: 'custom',
} as const;
