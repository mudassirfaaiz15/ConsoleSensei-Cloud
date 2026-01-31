# Environment Setup Guide

## Development Environment

### Prerequisites

- **Node.js**: 18+ LTS (check with `node --version`)
- **npm**: 9+ or yarn 4+ (included with Node.js)
- **Git**: Latest stable version

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mudassirfaaiz15/ConsoleSensei-Cloud.git
   cd ConsoleSensei-Cloud
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env.local
   ```

4. **Update `.env.local` with your values**
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   
   # Optional: AWS Configuration
   VITE_AWS_REGION=us-east-1
   
   # Demo Mode (no AWS credentials required)
   VITE_DEMO_MODE=false
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:5173`

## Environment Variables

### Supabase Setup

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Project Settings > API Keys
4. Copy `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### AWS Setup (Optional)

1. Create AWS account or use existing
2. Create IAM user with required permissions
3. Generate Access Keys
4. In ConsoleSensei: Settings > AWS Connect
5. Enter Access Key ID and Secret Access Key

### Available Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `VITE_AWS_REGION` | No | Default AWS region |
| `VITE_DEMO_MODE` | No | Enable demo with mock data |
| `VITE_API_TIMEOUT` | No | API timeout in ms (default: 30000) |

## Development Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Generate coverage report
npm run test:coverage

# Type checking
npm run typecheck

# Linting
npm run lint

# Analyze bundle size
npm run analyze
```

## Testing

### Unit Tests

Tests are located in `__tests__` folders next to source files.

```bash
# Run all tests
npm run test:run

# Watch mode (re-run on changes)
npm run test

# With coverage report
npm run test:coverage
```

### Test Configuration

- **Framework**: Vitest
- **Test Utils**: @testing-library/react
- **Setup**: `src/test/setup.ts`

## Debugging

### Browser DevTools

1. Open Developer Tools (F12 or Cmd+Option+I)
2. Check Console for logs and errors
3. Use Network tab to inspect API calls
4. Use Application tab to view localStorage

### Logging

```typescript
import { logger } from '@/lib/utils';

logger.info('Message', { context: 'data' });
logger.error('Error', error);

// View logs
console.log(logger.getLogs());
console.log(logger.exportLogs());
```

### VSCode Extensions

Recommended extensions:

- **ES7+ React/Redux/React-Native snippets** - dsznajder.es7-react-js-snippets
- **TypeScript Vue Plugin** - Vue.vscode-typescript-vue-plugin
- **Prettier** - esbenp.prettier-vscode
- **ESLint** - dbaeumer.vscode-eslint
- **Tailwind CSS IntelliSense** - bradlc.vscode-tailwindcss

## Production Deployment

### Build

```bash
npm run build
```

Outputs to `dist/` folder.

### Environment for Production

Create `.env.production`:

```env
VITE_SUPABASE_URL=https://prod-supabase.supabase.co
VITE_SUPABASE_ANON_KEY=prod-key
VITE_DEMO_MODE=false
```

### Vercel Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

See [docs/AWS_INTEGRATION.md](./AWS_INTEGRATION.md) for AWS-specific setup.

## Troubleshooting

### Port 5173 Already in Use

```bash
# Use different port
npm run dev -- --port 3000
```

### Dependencies Installation Issues

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### Type Errors

```bash
# Run type checker
npm run typecheck

# Clear TypeScript cache
rm -rf node_modules/.vite
npm install
```

### Tests Not Running

```bash
# Ensure vitest is installed
npm install --save-dev vitest

# Run with verbose output
npm run test -- --reporter=verbose
```

### Hot Reload Not Working

1. Check if port 5173 is accessible
2. Restart dev server: `npm run dev`
3. Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)

## Performance Tips

- Use React DevTools to profile components
- Check bundle size with `npm run analyze`
- Enable source maps in development
- Use Chrome DevTools Performance tab

## Security Checklist

- [ ] Never commit `.env.local`
- [ ] Don't hardcode secrets in code
- [ ] Validate all user inputs
- [ ] Use HTTPS in production
- [ ] Keep dependencies updated
- [ ] Review IAM permissions regularly
- [ ] Rotate AWS credentials quarterly

## Need Help?

- Check [API documentation](./API.md)
- Review [AWS integration guide](./AWS_INTEGRATION.md)
- Read [contributing guidelines](./CONTRIBUTING.md)
- Check GitHub issues for known problems
