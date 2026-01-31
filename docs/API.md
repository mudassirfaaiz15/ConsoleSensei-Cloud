# API Documentation

## Overview

This document describes the internal API endpoints and utilities used by ConsoleSensei Cloud.

## API Modules

### Accounts API (`src/lib/api/accounts.ts`)
Manages AWS account connections and configurations.

**Key Functions:**
- `connectAccount()` - Connect new AWS account
- `disconnectAccount()` - Remove AWS account connection
- `getAccounts()` - Fetch all connected accounts
- `updateAccount()` - Update account settings

### Costs API (`src/lib/api/costs.ts`)
Handles cost analysis and forecasting.

**Key Functions:**
- `getCostData()` - Get monthly cost breakdown
- `getServiceCosts()` - Get costs by service
- `getResourceCosts()` - Get costs by resource
- `getCostRecommendations()` - Get cost optimization recommendations

### Security API (`src/lib/api/security.ts`)
Manages security audits and compliance.

**Key Functions:**
- `getSecurity()` - Get security audit results
- `runAudit()` - Run security audit
- `remediateIssue()` - Fix security issue

### Activity API (`src/lib/api/activity.ts`)
Tracks user and resource activities.

**Key Functions:**
- `getActivities()` - Fetch activity log
- `logActivity()` - Log new activity

### Budget API (`src/lib/api/budgets.ts`)
Manages cost budgets and alerts.

**Key Functions:**
- `getBudgets()` - Get all budgets
- `createBudget()` - Create new budget
- `updateBudget()` - Update budget settings
- `deleteBudget()` - Remove budget

### Team API (`src/lib/api/team.ts`)
Manages team members and permissions.

**Key Functions:**
- `getTeamMembers()` - Fetch team members
- `inviteTeamMember()` - Invite new member
- `removeTeamMember()` - Remove member
- `updateMemberRole()` - Change member role

## Utility Functions

### Error Handler (`src/lib/utils/error-handler.ts`)
Centralized error handling with retry logic.

**Key Exports:**
- `handleApiError()` - Parse and standardize API errors
- `handleAWSError()` - Handle AWS-specific errors
- `getUserFriendlyMessage()` - Get user-friendly error messages
- `retryWithExponentialBackoff()` - Retry failed requests

### Logger (`src/lib/utils/logger.ts`)
Application-wide logging utility.

**Usage:**
```typescript
import { logger } from '@/lib/utils';

logger.info('User login', { userId: '123' });
logger.error('API call failed', error);
logger.logApiCall('GET', '/api/costs');
```

### Validation (`src/lib/utils/validation.ts`)
Input validation and sanitization.

**Key Functions:**
- `validateEmail()` - Validate email addresses
- `validateAWSCredentials()` - Validate AWS keys
- `sanitizeHtml()` - Escape HTML content
- `RateLimiter` - Rate limiting utility

### API Utilities (`src/lib/utils/api.ts`)
Standardized API calls with error handling.

**Usage:**
```typescript
import { apiGet, apiPost } from '@/lib/utils';

const { data, error } = await apiGet<User>('/api/users/123');
if (error) {
    logger.error('Failed to fetch user', error);
}
```

## Error Handling

All API calls should handle errors consistently:

```typescript
try {
    const response = await apiGet('/api/data');
    if (response.error) {
        const message = getUserFriendlyMessage(response.error);
        showErrorNotification(message);
        return;
    }
    
    setData(response.data);
} catch (err) {
    const appError = handleApiError(err);
    logger.error('Request failed', appError);
}
```

## Rate Limiting

Use the `RateLimiter` for client-side rate limiting:

```typescript
import { RateLimiter } from '@/lib/utils';

const limiter = new RateLimiter(5, 60000); // 5 requests per minute

if (!limiter.isAllowed('user-action')) {
    showWarning('Too many requests. Please wait.');
    return;
}
```

## Best Practices

1. **Always log API calls** for debugging
2. **Use typed responses** with TypeScript
3. **Handle errors gracefully** with user-friendly messages
4. **Validate input** before sending to API
5. **Use retry logic** for transient failures
6. **Rate limit** client-side actions
