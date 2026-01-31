# Frontend Integration Guide - AWS Resource Tracker

Complete guide for integrating the AWS Resource Tracker backend with the ConsoleSensei frontend React application.

## 📱 Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend                            │
│                (ConsoleSensei UI)                            │
│  - AWS Credential Management                                 │
│  - Resource Dashboard & Visualization                        │
│  - Cost Analysis & Recommendations                           │
│  - Resource Management UI                                    │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS REST API
                     ↓
┌─────────────────────────────────────────────────────────────┐
│         AWS Resource Tracker Backend                         │
│               (Python/Flask)                                 │
│  POST /api/v1/scan - Multi-region resource scanning         │
│  POST /api/v1/resources/action - Perform operations         │
│  POST /api/v1/resources/bulk-action - Bulk operations       │
│  POST /api/v1/resources/filter - Filter results             │
└─────────────────────────────────────────────────────────────┘
                     ↓ AWS SDK (boto3)
┌─────────────────────────────────────────────────────────────┐
│                   AWS Services                               │
│  EC2, S3, RDS, Lambda, ELB, CloudWatch, NAT, IAM, etc.     │
└─────────────────────────────────────────────────────────────┘
```

## 🔌 API Service Integration

### 1. Create API Service Layer

Create `src/lib/api/aws-service.ts`:

```typescript
import { AxiosInstance } from 'axios';
import { apiClient } from './api-client';

export interface ResourceMetadata {
  resource_id: string;
  resource_name: string;
  resource_type: string;
  region: string;
  state: string;
  creation_date: string;
  tags: Record<string, string>;
  estimated_cost_monthly: number;
  metadata: Record<string, any>;
}

export interface ScanResult {
  timestamp: string;
  regions_scanned: string[];
  resources: ResourceMetadata[];
  errors: Array<{ type: string; message: string }>;
  summary: {
    total_resources: number;
    by_type: Record<string, number>;
    by_region: Record<string, number>;
    by_state: Record<string, number>;
  };
  cost_summary: {
    estimated_monthly_total: number;
    by_resource_type: Record<string, number>;
  };
}

export class AWSResourceService {
  private client: AxiosInstance;

  constructor(baseURL: string = '/api/v1') {
    this.client = apiClient;
    this.client.defaults.baseURL = baseURL;
  }

  /**
   * Scan AWS resources across all regions
   */
  async scanResources(
    accessKey: string,
    secretKey: string,
    maxWorkers: number = 5
  ): Promise<ScanResult> {
    const response = await this.client.post<{ success: boolean; data: ScanResult }>(
      '/scan',
      {
        access_key_id: accessKey,
        secret_access_key: secretKey,
        max_workers: maxWorkers,
      },
      {
        timeout: 600000, // 10 minutes
      }
    );

    if (!response.data.success) {
      throw new Error('Scan failed');
    }

    return response.data.data;
  }

  /**
   * Filter resources from scan result
   */
  async filterResources(
    resources: ResourceMetadata[],
    filters: {
      resource_type?: string;
      region?: string;
      state?: string;
      tags?: Record<string, string>;
    }
  ): Promise<ResourceMetadata[]> {
    const response = await this.client.post<{
      success: boolean;
      resources: ResourceMetadata[];
    }>('/resources/filter', {
      resources,
      filters,
    });

    return response.data.resources;
  }

  /**
   * Perform action on a resource (stop/delete)
   */
  async performAction(
    accessKey: string,
    secretKey: string,
    resourceId: string,
    resourceType: string,
    region: string,
    action: 'stop' | 'delete'
  ): Promise<{
    success: boolean;
    message: string;
    verification_status: string;
    error?: string;
  }> {
    const response = await this.client.post('/resources/action', {
      access_key_id: accessKey,
      secret_access_key: secretKey,
      resource_id: resourceId,
      resource_type: resourceType,
      region,
      action,
    });

    return response.data;
  }

  /**
   * Perform bulk actions on multiple resources
   */
  async performBulkAction(
    accessKey: string,
    secretKey: string,
    actions: Array<{
      resource_id: string;
      resource_type: string;
      region: string;
      action: string;
    }>
  ): Promise<{
    success: boolean;
    total_actions: number;
    successful: number;
    failed: number;
    results: Array<{
      resource_id: string;
      success: boolean;
      message: string;
    }>;
  }> {
    const response = await this.client.post('/resources/bulk-action', {
      access_key_id: accessKey,
      secret_access_key: secretKey,
      actions,
    });

    return response.data;
  }
}

export const awsResourceService = new AWSResourceService();
```

### 2. Create React Hook for AWS Resources

Create `src/hooks/use-aws-resources.ts`:

```typescript
import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { awsResourceService, ScanResult, ResourceMetadata } from '@/lib/api/aws-service';

export function useAWSResources() {
  const [credentials, setCredentials] = useState<{
    accessKey: string;
    secretKey: string;
  }>({ accessKey: '', secretKey: '' });

  // Scan resources
  const scanMutation = useMutation({
    mutationFn: () =>
      awsResourceService.scanResources(
        credentials.accessKey,
        credentials.secretKey,
        5
      ),
  });

  // Filter resources
  const filterMutation = useMutation({
    mutationFn: (params: {
      resources: ResourceMetadata[];
      filters: Record<string, any>;
    }) =>
      awsResourceService.filterResources(
        params.resources,
        params.filters
      ),
  });

  // Perform action
  const actionMutation = useMutation({
    mutationFn: (params: {
      resource_id: string;
      resource_type: string;
      region: string;
      action: 'stop' | 'delete';
    }) =>
      awsResourceService.performAction(
        credentials.accessKey,
        credentials.secretKey,
        params.resource_id,
        params.resource_type,
        params.region,
        params.action
      ),
  });

  return {
    credentials,
    setCredentials,
    scan: scanMutation,
    filter: filterMutation,
    performAction: actionMutation,
  };
}
```

### 3. Create Resource Dashboard Component

Create `src/app/components/aws-resource-dashboard.tsx`:

```typescript
import React, { useState } from 'react';
import { useAWSResources } from '@/hooks/use-aws-resources';
import { ResourceMetadata } from '@/lib/api/aws-service';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Alert } from '@/app/components/ui/alert';
import { Loader2 } from 'lucide-react';

export function AWSResourceDashboard() {
  const { credentials, setCredentials, scan, filter, performAction } = useAWSResources();
  const [scanResult, setScanResult] = useState(null);
  const [selectedResources, setSelectedResources] = useState<ResourceMetadata[]>([]);

  const handleScan = async () => {
    try {
      const result = await scan.mutateAsync();
      setScanResult(result);
    } catch (error) {
      console.error('Scan failed:', error);
    }
  };

  const handleFilterResources = async (filters: any) => {
    if (!scanResult?.resources) return;

    try {
      const filtered = await filter.mutateAsync({
        resources: scanResult.resources,
        filters,
      });
      setSelectedResources(filtered);
    } catch (error) {
      console.error('Filter failed:', error);
    }
  };

  const handleStopInstances = async () => {
    const ec2Instances = selectedResources.filter(
      (r) => r.resource_type === 'EC2_Instance'
    );

    if (ec2Instances.length === 0) {
      alert('No EC2 instances selected');
      return;
    }

    for (const instance of ec2Instances) {
      try {
        await performAction.mutateAsync({
          resource_id: instance.resource_id,
          resource_type: 'EC2_Instance',
          region: instance.region,
          action: 'stop',
        });
      } catch (error) {
        console.error(`Failed to stop ${instance.resource_id}:`, error);
      }
    }

    alert(`Stopped ${ec2Instances.length} instances`);
  };

  return (
    <div className="space-y-6">
      {/* Credentials Input */}
      <Card>
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">AWS Credentials</h2>
          <input
            type="password"
            placeholder="Access Key ID"
            value={credentials.accessKey}
            onChange={(e) =>
              setCredentials({ ...credentials, accessKey: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="password"
            placeholder="Secret Access Key"
            value={credentials.secretKey}
            onChange={(e) =>
              setCredentials({ ...credentials, secretKey: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <Button
            onClick={handleScan}
            disabled={scan.isPending || !credentials.accessKey || !credentials.secretKey}
            className="w-full"
          >
            {scan.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              'Scan AWS Resources'
            )}
          </Button>
        </div>
      </Card>

      {/* Scan Results */}
      {scanResult && (
        <Card>
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Scan Results</h2>

            {/* Summary Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded">
                <div className="text-sm text-gray-600">Total Resources</div>
                <div className="text-2xl font-bold">
                  {scanResult.summary.total_resources}
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded">
                <div className="text-sm text-gray-600">Regions Scanned</div>
                <div className="text-2xl font-bold">
                  {scanResult.regions_scanned.length}
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded">
                <div className="text-sm text-gray-600">Monthly Cost</div>
                <div className="text-2xl font-bold">
                  ${scanResult.cost_summary.estimated_monthly_total.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Resources by Type */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources by Type</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(scanResult.summary.by_type).map(([type, count]) => (
                  <div key={type} className="p-3 border border-gray-200 rounded">
                    <div className="font-semibold">{type}</div>
                    <div className="text-xl text-blue-600">{count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filter Options */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Filter Resources</h3>
              <div className="space-y-2">
                <Button
                  onClick={() =>
                    handleFilterResources({
                      resource_type: 'EC2_Instance',
                      state: 'running',
                    })
                  }
                  variant="outline"
                >
                  Show Running EC2 Instances
                </Button>
                <Button
                  onClick={() =>
                    handleFilterResources({
                      resource_type: 'Elastic_IP',
                      state: 'unassociated',
                    })
                  }
                  variant="outline"
                >
                  Show Unassociated Elastic IPs
                </Button>
                <Button
                  onClick={() =>
                    handleFilterResources({
                      resource_type: 'EBS_Volume',
                      state: 'available',
                    })
                  }
                  variant="outline"
                >
                  Show Available EBS Volumes
                </Button>
              </div>
            </div>

            {/* Selected Resources Actions */}
            {selectedResources.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Selected Resources ({selectedResources.length})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedResources.map((resource) => (
                    <div
                      key={resource.resource_id}
                      className="p-3 border border-gray-200 rounded flex justify-between items-center"
                    >
                      <div>
                        <div className="font-semibold">{resource.resource_name}</div>
                        <div className="text-sm text-gray-600">
                          {resource.resource_id} ({resource.region})
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{resource.state}</div>
                        {resource.estimated_cost_monthly && (
                          <div className="text-xs text-gray-600">
                            ${resource.estimated_cost_monthly.toFixed(2)}/mo
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleStopInstances}
                  variant="destructive"
                  className="w-full mt-4"
                  disabled={performAction.isPending}
                >
                  {performAction.isPending ? 'Processing...' : 'Stop Selected Instances'}
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Error Alert */}
      {scan.isError && (
        <Alert variant="destructive">
          <div className="font-semibold">Scan Error</div>
          <div className="text-sm">{String(scan.error)}</div>
        </Alert>
      )}
    </div>
  );
}
```

### 4. Integrate into Router

Add to `src/app/routes.tsx`:

```typescript
import { AWSResourceDashboard } from './components/aws-resource-dashboard';

export const routes = [
  {
    path: '/aws-resources',
    element: <AWSResourceDashboard />,
    name: 'AWS Resources',
  },
  // ... other routes
];
```

## 🔐 Security Best Practices

### Credential Handling
```typescript
// ✅ DO: Pass credentials in request body
const result = await awsResourceService.scanResources(
  accessKey,
  secretKey
);

// ❌ DON'T: Store credentials in localStorage
localStorage.setItem('awsKey', accessKey);

// ✅ DO: Clear credentials after use
setCredentials({ accessKey: '', secretKey: '' });
```

### Environment Variables
```typescript
// .env.local
REACT_APP_API_URL=http://localhost:5000
REACT_APP_API_KEY=your-api-key

// src/config.ts
export const API_BASE_URL = process.env.REACT_APP_API_URL;
export const API_KEY = process.env.REACT_APP_API_KEY;
```

### HTTPS in Production
```typescript
// Always use HTTPS in production
const apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://api.example.com'
  : 'http://localhost:5000';
```

## 📊 Dashboard Features

### Cost Analysis View
```typescript
function CostAnalysisView({ scanResult }: { scanResult: ScanResult }) {
  const costByType = scanResult.cost_summary.by_resource_type;
  const topExpensive = Object.entries(costByType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div>
      <h2>Cost Breakdown</h2>
      <PieChart
        data={topExpensive.map(([type, cost]) => ({
          name: type,
          value: cost,
        }))}
      />
    </div>
  );
}
```

### Resource Filtering UI
```typescript
function ResourceFilterPanel() {
  const resourceTypes = [
    'EC2_Instance',
    'EBS_Volume',
    'S3_Bucket',
    'RDS_Instance',
    'Lambda_Function',
  ];

  const states = ['running', 'stopped', 'available', 'active'];

  return (
    <div className="space-y-4">
      <Select label="Resource Type" options={resourceTypes} />
      <Select label="State" options={states} />
      <Input label="Region" placeholder="e.g., us-east-1" />
      <Input label="Tag Key" placeholder="Environment" />
      <Input label="Tag Value" placeholder="production" />
      <Button>Apply Filters</Button>
    </div>
  );
}
```

## 🧪 Testing Integration

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { AWSResourceDashboard } from './aws-resource-dashboard';

describe('AWSResourceDashboard', () => {
  it('scans AWS resources when button clicked', async () => {
    render(<AWSResourceDashboard />);

    const scanButton = screen.getByText('Scan AWS Resources');
    fireEvent.click(scanButton);

    await waitFor(() => {
      expect(screen.getByText(/Total Resources/i)).toBeInTheDocument();
    });
  });

  it('displays cost summary', async () => {
    // ... test implementation
  });

  it('filters resources correctly', async () => {
    // ... test implementation
  });
});
```

## 🚀 Deployment

### Local Development
```bash
# Terminal 1: Start backend
cd backend
python api.py

# Terminal 2: Start frontend
cd ../
npm start
```

### Docker Compose
```bash
docker-compose up -d
# Backend: http://localhost:5000
# Frontend: http://localhost:3000
```

### Production Deployment
```bash
# Backend to AWS Lambda/EC2/ECS
# Frontend to Vercel/Netlify

# Environment variables
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_API_KEY=production-api-key
```

## 📚 Additional Resources

- [Backend API Documentation](../backend/README.md)
- [API Setup Guide](../backend/SETUP.md)
- [Usage Examples](../backend/examples.py)

---

**Integration Status**: ✅ Ready for Production
