# AWS Integration Guide

## Overview

ConsoleSensei Cloud integrates with AWS services to provide monitoring, cost analysis, and security auditing.

## Supported AWS Services

### Cost Management
- **AWS Cost Explorer** - Cost analysis and forecasting
- **AWS Billing** - Billing data and invoices

### Compute
- **EC2** - Virtual machine monitoring and optimization
- **Auto Scaling** - Scaling group management

### Storage
- **S3** - Bucket management and analysis
- **EBS** - Volume monitoring

### Identity & Access
- **IAM** - User and permission auditing

## AWS Credentials

### Setup

1. Create IAM user in AWS Console
2. Generate Access Key ID and Secret Access Key
3. Add credentials in ConsoleSensei settings
4. Grant minimal required permissions

### Security Best Practices

- ✅ Use IAM users (not root account)
- ✅ Enable MFA on AWS account
- ✅ Use read-only policies when possible
- ✅ Rotate credentials regularly
- ✅ Never hardcode credentials
- ❌ Don't share credentials
- ❌ Don't commit .env files

### Required IAM Permissions

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ce:GetCostAndUsage",
                "ce:GetCostForecast",
                "ec2:DescribeInstances",
                "ec2:DescribeSnapshots",
                "ec2:DescribeVolumes",
                "s3:ListAllMyBuckets",
                "s3:GetBucketLocation",
                "iam:ListUsers",
                "iam:ListRoles",
                "sts:GetCallerIdentity"
            ],
            "Resource": "*"
        }
    ]
}
```

## AWS Service Integration

### Cost Service (`src/lib/aws/cost-service.ts`)

Fetches cost data from AWS Cost Explorer.

```typescript
import { getCostSummary, getMonthlyCosts } from '@/lib/aws/cost-service';

const summary = await getCostSummary();
const monthly = await getMonthlyCosts(6);
```

### EC2 Service (`src/lib/aws/ec2-service.ts`)

Monitors EC2 instances and provides optimization recommendations.

```typescript
import { getEC2Summary } from '@/lib/aws/ec2-service';

const ec2Data = await getEC2Summary();
```

### S3 Service (`src/lib/aws/s3-service.ts`)

Manages S3 bucket analysis and cost tracking.

```typescript
import { getS3Summary } from '@/lib/aws/s3-service';

const s3Data = await getS3Summary();
```

### IAM Service (`src/lib/aws/iam-service.ts`)

Audits IAM users, roles, and policies for security issues.

```typescript
import { getIAMSummary } from '@/lib/aws/iam-service';

const iamData = await getIAMSummary();
```

## Error Handling

AWS API calls may fail for various reasons. All errors are handled consistently:

```typescript
try {
    const data = await getCostData();
} catch (error) {
    const appError = handleAWSError(error, 'CostExplorer');
    logger.error('Failed to fetch costs', appError);
    // Show user-friendly message
}
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Invalid Credentials | Verify Access Key ID and Secret Access Key |
| Access Denied | Check IAM permissions, ensure user has required policies |
| Rate Limit Exceeded | Wait before retrying, use exponential backoff |
| Region Not Available | Check if service is available in selected region |
| Network Timeout | Check internet connection, try again |

## Demo Mode

When AWS credentials aren't configured, the app runs in demo mode with mock data.

```typescript
import { isDemoMode } from '@/lib/supabase';

if (isDemoMode()) {
    // Show demo data notice
}
```

## Multi-Account Support

Connect multiple AWS accounts for centralized monitoring.

```typescript
const accounts = await getAccounts();
// Switch between accounts
await switchAccount(accountId);
```

## Region Selection

Most services are region-specific. Users can select their primary region.

```typescript
const region = 'us-east-1'; // configurable
```

## Caching Strategy

AWS data is cached using React Query for optimal performance:

```typescript
import { useResources } from '@/lib/hooks';

const { data, isLoading, error } = useResources();
// Cache automatically managed by React Query
```

## Troubleshooting

### Credentials Not Saved

- Check browser storage permissions
- Verify .env variables are set
- Check browser console for errors

### AWS API Failures

- Enable debug logging: `logger.debug()`
- Check AWS service status
- Verify IAM permissions
- Review CloudTrail logs in AWS Console

### Rate Limiting

- Implement request queuing
- Use exponential backoff (automatic in `apiCall()`)
- Reduce polling frequency
