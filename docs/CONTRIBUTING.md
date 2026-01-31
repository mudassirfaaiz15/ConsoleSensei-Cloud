# Contributing Guide

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork**: `git clone https://github.com/your-username/ConsoleSensei-Cloud.git`
3. **Install dependencies**: `npm install`
4. **Create a branch**: `git checkout -b feature/your-feature`

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- AWS account (for testing)

### Environment Variables

Create `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_DEMO_MODE=false
```

### Running Locally

```bash
npm run dev
# Visit http://localhost:5173
```

## Code Standards

### TypeScript

- Always use TypeScript, avoid `any` type
- Use proper typing for function parameters and returns
- Create interfaces for complex objects

```typescript
interface User {
    id: string;
    email: string;
    role: 'admin' | 'user';
}

function getUser(id: string): Promise<User> {
    // ...
}
```

### Error Handling

Use centralized error handling:

```typescript
import { handleApiError, getUserFriendlyMessage } from '@/lib/utils';

try {
    const data = await fetchData();
} catch (error) {
    const appError = handleApiError(error, 'fetchData');
    const message = getUserFriendlyMessage(appError);
    // Handle error
}
```

### Logging

Use the logger for debugging:

```typescript
import { logger } from '@/lib/utils';

logger.info('User logged in', { userId: user.id });
logger.error('API call failed', error);
```

### API Calls

Use standardized API utilities:

```typescript
import { apiGet, apiPost } from '@/lib/utils';

const { data, error } = await apiGet<User[]>('/api/users');
if (error) {
    logger.error('Failed to fetch users', error);
}
```

### Validation

Always validate user input:

```typescript
import { validateEmail, RateLimiter } from '@/lib/utils';

if (!validateEmail(email)) {
    showError('Invalid email address');
    return;
}

const limiter = new RateLimiter(5, 60000);
if (!limiter.isAllowed(userId)) {
    showWarning('Too many requests');
    return;
}
```

## Testing

### Write Tests

Tests should be in `__tests__` folders next to source files.

```typescript
// src/lib/utils/__tests__/validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateEmail } from '../validation';

describe('validateEmail', () => {
    it('should validate correct email', () => {
        expect(validateEmail('user@example.com')).toBe(true);
    });
    
    it('should reject invalid email', () => {
        expect(validateEmail('invalid')).toBe(false);
    });
});
```

### Run Tests

```bash
npm run test          # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage report
```

### Coverage Requirements

- Aim for 80%+ coverage on critical paths
- Test error cases, not just happy path
- Mock external dependencies

## Git Workflow

### Commit Messages

Use clear, descriptive messages:

```
✨ feat: Add cost breakdown chart
🐛 fix: Handle null values in API response
📚 docs: Update AWS integration guide
♻️ refactor: Extract error handling to utility
🧪 test: Add validation tests
🎨 style: Format code with prettier
⚡ perf: Optimize cost calculation
🔒 security: Validate credentials on input
```

### Pull Request Process

1. **Create descriptive PR title**
2. **Link related issues**
3. **Describe changes clearly**
4. **Include before/after for UI changes**
5. **Run tests locally**: `npm run test:run`
6. **Check types**: `npm run typecheck`
7. **Lint code**: `npm run lint`

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Testing
Describe how to test these changes

## Checklist
- [ ] Tests added
- [ ] Documentation updated
- [ ] TypeScript types are correct
- [ ] No console errors/warnings
```

## Project Structure

```
src/
├── app/              # React components and pages
│   ├── components/  # Reusable components
│   ├── pages/       # Page components
│   └── context/     # React context
├── lib/              # Utilities and business logic
│   ├── api/         # API endpoints
│   ├── aws/         # AWS integration
│   ├── hooks/       # Custom React hooks
│   └── utils/       # Utility functions
├── services/         # Core services
└── styles/           # Global styles
```

## Component Guidelines

### Functional Components Only

```typescript
interface ButtonProps {
    text: string;
    onClick: () => void;
    disabled?: boolean;
}

export function Button({ text, onClick, disabled }: ButtonProps) {
    return (
        <button onClick={onClick} disabled={disabled}>
            {text}
        </button>
    );
}
```

### Use React Hooks

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

export function UserProfile({ userId }: { userId: string }) {
    const [isEditing, setIsEditing] = useState(false);
    
    const { data: user, isLoading } = useQuery({
        queryKey: ['user', userId],
        queryFn: () => fetchUser(userId),
    });
    
    const handleEdit = useCallback(() => {
        setIsEditing(true);
    }, []);
    
    if (isLoading) return <Skeleton />;
    
    return <div>{user?.name}</div>;
}
```

### Props Interface

```typescript
interface ComponentProps {
    // Required props first
    id: string;
    title: string;
    // Optional props
    className?: string;
    onClick?: () => void;
}
```

## Performance Considerations

- Use React Query for server state
- Memoize expensive computations
- Lazy load routes and heavy components
- Optimize bundle size
- Use virtualization for long lists

## Security Considerations

- Never log sensitive data
- Validate all user inputs
- Sanitize HTML content
- Use HTTPS only in production
- Keep dependencies updated
- Review IAM permissions regularly

## Getting Help

- Check existing issues and PRs
- Review documentation in `/docs`
- Ask questions in discussions
- Review code comments

## Code Review Process

Maintainers will review PRs for:
- Code quality and standards
- Test coverage
- Performance impact
- Security concerns
- Documentation completeness

Feedback should be constructive and collaborative.

---

Thank you for contributing to ConsoleSensei Cloud! 🚀
