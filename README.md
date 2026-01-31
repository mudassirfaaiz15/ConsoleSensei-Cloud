# ConsoleSensei Cloud

<div align="center">

![ConsoleSensei Cloud](https://img.shields.io/badge/ConsoleSensei-Cloud-6366f1?style=for-the-badge&logo=amazon-aws&logoColor=white)
![Status](https://img.shields.io/badge/Status-Production%20Ready-10B981?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**Intelligent AWS Cloud Management Platform**

Comprehensive dashboard for monitoring, analyzing, and optimizing AWS infrastructure with real-time insights and actionable recommendations.

[🌐 Live Application](https://console-sensei-cloud.vercel.app/app) · [📚 Documentation](https://github.com/mudassirfaaiz15/ConsoleSensei-Cloud) · [🐛 Report Issue](https://github.com/mudassirfaaiz15/ConsoleSensei-Cloud/issues) · [✨ Request Feature](https://github.com/mudassirfaaiz15/ConsoleSensei-Cloud/issues/new)

</div>

---

## 📋 Overview

**ConsoleSensei Cloud** is an enterprise-grade AWS management dashboard designed to help teams efficiently monitor cloud infrastructure, identify security vulnerabilities, reduce operational costs, and maintain compliance. Built with modern technologies and best practices, it provides real-time visibility into your AWS environment with zero setup overhead.

### ✨ Core Features

- **🔍 AWS Resource Discovery** - Auto-scan and catalog all resources across multiple AWS accounts and regions
- **💰 Cost Intelligence** - Real-time cost tracking, usage analytics, and cost optimization recommendations
- **🛡️ Security & Compliance** - IAM policy analysis, security audit scoring, and compliance tracking
- **📊 Multi-Account Management** - Seamless management of multiple AWS accounts from a single dashboard
- **⏰ Intelligent Alerts** - Customizable notifications for cost anomalies, resource utilization, and security events
- **📈 Activity Monitoring** - Real-time CloudTrail integration and audit logging
- **🎯 Cloud Optimization** - Identify unused resources and potential cost-saving opportunities
- **👥 Team Collaboration** - Role-based access control and team management

---

## 🏗️ Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, TypeScript, React Router 7 | User interface and routing |
| **Styling** | Tailwind CSS 4, Radix UI | Responsive design and accessibility |
| **State Management** | React Query, Context API | Application state and data fetching |
| **Forms** | React Hook Form, Zod | Form handling and validation |
| **Data Visualization** | Recharts | Interactive charts and analytics |
| **Icons** | Lucide React (500+ icons) | UI iconography |
| **Build** | Vite 6 | Fast development and optimized production builds |
| **Backend** | Flask + boto3 | AWS integration and API endpoints |
| **Deployment** | Vercel, Railway/Render | Production hosting |

### Infrastructure

```
┌─────────────────────────────────────────────────────────┐
│                   ConsoleSensei Cloud                   │
├─────────────────────────────────────────────────────────┤
│  Frontend (React 18 + TypeScript)                       │
│  ├─ Dashboard Components                               │
│  ├─ AWS Resource Management                            │
│  ├─ Security & Compliance Modules                      │
│  └─ Cost Analysis & Reporting                          │
├─────────────────────────────────────────────────────────┤
│  Backend API (Flask + Python)                          │
│  ├─ AWS Resource Scanning                              │
│  ├─ Cost Calculation Engine                            │
│  ├─ Security Audit Logic                               │
│  └─ Activity Logging & Analytics                       │
├─────────────────────────────────────────────────────────┤
│  AWS SDK Integration (boto3)                           │
│  ├─ EC2, RDS, S3, Lambda, IAM                          │
│  ├─ CloudTrail, Security Hub                           │
│  └─ 13+ AWS Services Support                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18.0 or higher
- **Python**: 3.9+ (for backend)
- **AWS Account**: With appropriate IAM permissions
- **npm/yarn/pnpm**: Node package manager

### Installation & Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/mudassirfaaiz15/ConsoleSensei-Cloud.git
cd ConsoleSensei-Cloud
```

#### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Create environment configuration
cp .env.example .env.local

# Update .env.local with your backend API URL
# VITE_API_URL=http://localhost:5000
```

#### 3. Backend Setup

```bash
# Navigate to backend
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Configure AWS credentials
# Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY as environment variables
```

#### 4. Development Servers

```bash
# Terminal 1: Start backend (from backend directory)
python api.py

# Terminal 2: Start frontend (from root directory)
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api/docs

### Production Build

```bash
# Create optimized production bundle
npm run build

# Preview production build locally
npm run preview

# Run all tests before deployment
npm test
npm run test:coverage
```

---

## 🔐 Security & Authentication

### Security Features

- **Secure Credential Handling** - AWS credentials encrypted and never stored
- **JWT Authentication** - Secure token-based API authentication
- **API Key Support** - Alternative authentication method for programmatic access
- **CORS Protection** - Properly configured cross-origin policies
- **Input Validation** - Comprehensive form and API validation with Zod
- **Security Headers** - HTTP security headers configured in Vercel
- **SSL/TLS Encryption** - All traffic encrypted in transit

### Getting Started

1. Navigate to the application
2. Create an account or login
3. Connect AWS credentials (never exposed in client)
4. Grant necessary IAM permissions
5. Start scanning your AWS resources

> **Important**: Store AWS credentials securely. Never commit credentials to version control.

---

## 📊 Project Structure

```
ConsoleSensei-Cloud/
├── src/
│   ├── app/
│   │   ├── components/              # React components
│   │   │   ├── ui/                  # 48+ reusable UI components
│   │   │   ├── aws-resource-dashboard.tsx
│   │   │   ├── dashboard-layout.tsx
│   │   │   ├── error-boundary.tsx
│   │   │   ├── command-palette.tsx
│   │   │   └── __tests__/           # Component tests
│   │   ├── context/
│   │   │   └── auth-context.tsx     # Global auth state
│   │   ├── pages/                   # Page components
│   │   │   ├── dashboard-page.tsx
│   │   │   ├── aws-resources-page.tsx
│   │   │   ├── cost-breakdown-page.tsx
│   │   │   ├── security-audit-page.tsx
│   │   │   ├── multi-account-page.tsx
│   │   │   ├── team-management-page.tsx
│   │   │   ├── login-page.tsx
│   │   │   ├── register-page.tsx
│   │   │   └── __tests__/
│   │   ├── App.tsx
│   │   └── routes.tsx               # React Router configuration
│   ├── lib/
│   │   ├── api/                     # Backend API services
│   │   │   ├── accounts.ts
│   │   │   ├── costs.ts
│   │   │   ├── security.ts
│   │   │   ├── team.ts
│   │   │   ├── activity.ts
│   │   │   ├── budgets.ts
│   │   │   ├── aws-resources.ts     # AWS resource integration
│   │   │   └── index.ts
│   │   ├── aws/                     # AWS SDK wrapper
│   │   │   ├── client.ts
│   │   │   ├── cost-service.ts
│   │   │   ├── ec2-service.ts
│   │   │   ├── iam-service.ts
│   │   │   └── s3-service.ts
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── use-aws-resources.ts
│   │   │   ├── use-keyboard-shortcuts.ts
│   │   │   ├── index.ts
│   │   │   └── __tests__/
│   │   ├── config.ts                # Configuration management
│   │   ├── supabase.ts              # Supabase client
│   │   ├── notifications.ts         # Toast notifications
│   │   ├── export-utils.ts          # Export utilities
│   │   └── pdf-export.ts            # PDF generation
│   ├── hooks/
│   │   └── use-aws-data.ts
│   ├── providers/
│   │   └── query-provider.tsx       # React Query provider
│   ├── services/
│   │   ├── auth-service.ts
│   │   └── aws-service.ts
│   ├── styles/
│   │   ├── index.css
│   │   ├── fonts.css
│   │   ├── theme.css
│   │   └── tailwind.css
│   ├── test/
│   │   ├── setup.ts
│   │   └── test-utils.tsx
│   ├── types/
│   │   └── index.ts                 # TypeScript type definitions
│   ├── main.tsx
│   └── vite-env.d.ts
├── backend/
│   ├── api.py                       # Flask application (521 LOC)
│   ├── aws_resource_scanner.py      # AWS scanning logic
│   ├── resource_manager.py          # Resource management
│   ├── requirements.txt             # Python dependencies
│   └── config.py                    # Backend configuration
├── public/
│   ├── robots.txt
│   ├── sitemap.xml
│   └── sw.js                        # Service worker
├── .github/
│   └── workflows/
│       └── ci.yml                   # GitHub Actions CI/CD
├── vite.config.ts                   # Vite configuration
├── vitest.config.ts                 # Vitest configuration
├── tsconfig.json                    # TypeScript configuration
├── tailwind.config.ts               # Tailwind CSS configuration
├── vercel.json                      # Vercel deployment config
├── package.json
└── README.md
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- button.test.tsx
```

**Test Coverage**:
- ✅ Unit tests for components
- ✅ Integration tests for pages
- ✅ API service tests
- ✅ Hook tests (React Query)
- ✅ Type safety validation

---

## 📈 Performance

- **Bundle Size**: 117.45 KB (gzipped)
- **Build Time**: ~10 seconds
- **Load Time**: < 2 seconds (average)
- **Lighthouse Score**: 95+ (Performance)
- **Core Web Vitals**: All green

### Optimizations Implemented

- Code splitting with lazy loading
- React Suspense for async components
- Image optimization with fallbacks
- CSS purging with Tailwind
- Tree shaking and dead code elimination
- Minification and compression

---

## 🚢 Deployment

### Frontend (Vercel)

ConsoleSensei Cloud is deployed on **Vercel** for optimal performance:

```bash
# Deploy manually
npm run build
vercel --prod

# Or connect GitHub for auto-deploy
# Every push to main/master branch auto-deploys
```

**Live URL**: https://console-sensei-cloud.vercel.app/app

### Backend (Railway/Render)

Backend API deployed on Railway or Render:

```bash
# Deploy to Railway
railway up

# Or deploy to Render
# Connect repository and auto-deploy
```

### Environment Variables

Create `.env.local` for development:

```env
# Frontend
VITE_API_URL=http://localhost:5000

# Backend
AWS_REGION=us-east-1
FLASK_ENV=production
CORS_ORIGINS=https://console-sensei-cloud.vercel.app
```

For production deployment, configure these in Vercel/Railway dashboards.

---

## 📚 Documentation

- **[Vercel Deployment Guide](./docs/VERCEL_DEPLOYMENT_GUIDE.md)** - Step-by-step Vercel deployment
- **[GitHub Actions CI/CD](./docs/GITHUB_ACTIONS_SETUP.md)** - Automated testing and deployment
- **[Pre-Deployment Checklist](./docs/PRE_DEPLOYMENT_CHECKLIST.md)** - Pre-launch verification
- **[Getting Started Guide](./docs/START_HERE.md)** - Quick start instructions
- **[API Documentation](./backend/README.md)** - Backend API reference

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** changes (`git commit -m 'Add AmazingFeature'`)
4. **Push** to branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Code Style

- Follow TypeScript strict mode
- Use ESLint for linting
- Format with Prettier
- Write tests for new features
- Update documentation

---

## 🐛 Bug Reports & Feature Requests

Found a bug or have a feature idea? Please [open an issue](https://github.com/mudassirfaaiz15/ConsoleSensei-Cloud/issues) with:

- **Bug Reports**: Steps to reproduce, expected vs actual behavior
- **Feature Requests**: Use case description and proposed solution

---

## 📋 Roadmap

### Q1 2026
- [ ] Kubernetes cost monitoring
- [ ] Advanced budget forecasting
- [ ] Slack/Teams integration

### Q2 2026
- [ ] Mobile application
- [ ] Machine learning cost predictions
- [ ] API marketplace integrations

### Q3 2026
- [ ] Enterprise SSO support
- [ ] Advanced compliance reporting
- [ ] Custom dashboard builder

---

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

### Libraries & Frameworks
- [React](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Radix UI](https://www.radix-ui.com/) - Accessible components
- [React Query](https://tanstack.com/query/latest) - Data fetching
- [Recharts](https://recharts.org/) - Charting library
- [Lucide Icons](https://lucide.dev/) - Icon library

### AWS
- [AWS SDK for Python (boto3)](https://boto3.amazonaws.com/) - AWS integration
- [AWS CLI](https://aws.amazon.com/cli/) - Command line tools

### Tools & Services
- [Vite](https://vitejs.dev/) - Build tool
- [Vercel](https://vercel.com/) - Deployment platform
- [Railway](https://railway.app/) - Cloud infrastructure
- [GitHub Actions](https://github.com/features/actions) - CI/CD

---

## 📞 Support

For support, email us at [support@consolesensei.com](mailto:support@consolesensei.com) or open an issue on GitHub.

### Getting Help

- 📖 Check the [documentation](./docs)
- 🐛 Search [existing issues](https://github.com/mudassirfaaiz15/ConsoleSensei-Cloud/issues)
- 💬 Join our community discussions
- 📧 Contact the maintainers

---

<div align="center">

**Made with ❤️ by the ConsoleSensei Team**

⭐ If you find this project helpful, please consider giving it a star!

[⬆ Back to Top](#consolesensei-cloud)

</div>

<div align="center">

**Built with ❤️ for the cloud community**

</div>