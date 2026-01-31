/**
 * AWS Resources Service Layer
 * TypeScript client for AWS Resource Tracker Backend API
 * Provides comprehensive resource scanning, filtering, and management
 */

import axios, { AxiosInstance } from 'axios';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ResourceMetadata {
  resource_id: string;
  resource_name: string | null;
  resource_type: string;
  region: string;
  state: string;
  creation_date: string | null;
  tags: Record<string, string>;
  estimated_cost_monthly: number | null;
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

export interface ActionResult {
  success: boolean;
  resource_id: string;
  resource_type: string;
  action: string;
  message: string;
  verification_status: string;
  error?: string;
}

export interface BulkActionResult {
  success: boolean;
  total_actions: number;
  successful: number;
  failed: number;
  results: Array<{
    resource_id: string;
    success: boolean;
    message: string;
  }>;
}

export interface FilterOptions {
  resource_type?: string;
  region?: string;
  state?: string;
  tags?: Record<string, string>;
}

// ============================================================================
// API SERVICE CLASS
// ============================================================================

class AWSResourceService {
  private client: AxiosInstance;

  constructor(baseURL: string = 'http://localhost:5000/api/v1', apiKey?: string) {

    this.client = axios.create({
      baseURL,
      timeout: 600000, // 10 minutes for scanning operations
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          throw new Error('Unauthorized - Invalid API key or credentials');
        }
        if (error.response?.status === 400) {
          throw new Error(error.response.data?.error || 'Invalid request');
        }
        if (error.response?.status === 500) {
          throw new Error('Server error - Please try again');
        }
        throw error;
      }
    );
  }

  /**
   * Check API health status
   */
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    service: string;
    version: string;
  }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  /**
   * Scan AWS resources across all regions
   */
  async scanResources(
    accessKey: string,
    secretKey: string,
    maxWorkers: number = 5
  ): Promise<ScanResult> {
    try {
      const response = await this.client.post<{
        success: boolean;
        data: ScanResult;
      }>('/scan', {
        access_key_id: accessKey,
        secret_access_key: secretKey,
        max_workers: maxWorkers,
      });

      if (!response.data.success) {
        throw new Error('Scan operation failed');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to scan AWS resources'
      );
    }
  }

  /**
   * Filter resources based on criteria
   */
  async filterResources(
    resources: ResourceMetadata[],
    filters: FilterOptions
  ): Promise<ResourceMetadata[]> {
    try {
      const response = await this.client.post<{
        success: boolean;
        total: number;
        resources: ResourceMetadata[];
      }>('/resources/filter', {
        resources,
        filters,
      });

      return response.data.resources;
    } catch (error) {
      throw new Error('Failed to filter resources');
    }
  }

  /**
   * Perform action on a single resource
   */
  async performAction(
    accessKey: string,
    secretKey: string,
    resourceId: string,
    resourceType: string,
    region: string,
    action: 'stop' | 'delete'
  ): Promise<ActionResult> {
    try {
      const response = await this.client.post<ActionResult>(
        '/resources/action',
        {
          access_key_id: accessKey,
          secret_access_key: secretKey,
          resource_id: resourceId,
          resource_type: resourceType,
          region,
          action,
        }
      );

      return response.data;
    } catch (error) {
      throw new Error('Failed to perform action on resource');
    }
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
  ): Promise<BulkActionResult> {
    try {
      const response = await this.client.post<BulkActionResult>(
        '/resources/bulk-action',
        {
          access_key_id: accessKey,
          secret_access_key: secretKey,
          actions,
        }
      );

      return response.data;
    } catch (error) {
      throw new Error('Failed to perform bulk actions');
    }
  }

  /**
   * Get API documentation
   */
  async getDocumentation(): Promise<any> {
    const response = await this.client.get('/docs');
    return response.data;
  }

  /**
   * Get resource statistics from scan result
   */
  static getResourceStats(result: ScanResult) {
    return {
      totalResources: result.summary.total_resources,
      totalCost: result.cost_summary.estimated_monthly_total,
      regionsScanned: result.regions_scanned.length,
      resourcesByType: result.summary.by_type,
      costByType: result.cost_summary.by_resource_type,
      errorCount: result.errors.length,
    };
  }

  /**
   * Find unused resources (potential cost savings)
   */
  static findUnusedResources(resources: ResourceMetadata[]) {
    return {
      stopped_instances: resources.filter(
        (r) =>
          r.resource_type === 'EC2_Instance' &&
          (r.state === 'stopped' || r.state === 'terminated')
      ),
      unassociated_ips: resources.filter(
        (r) => r.resource_type === 'Elastic_IP' && r.state === 'unassociated'
      ),
      available_volumes: resources.filter(
        (r) => r.resource_type === 'EBS_Volume' && r.state === 'available'
      ),
    };
  }

  /**
   * Calculate potential savings
   */
  static calculateSavings(resources: ResourceMetadata[]) {
    const unused = this.findUnusedResources(resources);
    let totalSavings = 0;

    unused.unassociated_ips.forEach(() => {
      totalSavings += 3.6; // $3.60 per month per unassociated EIP
    });

    unused.available_volumes.forEach(() => {
      totalSavings += 0.1; // ~$0.10 per GB-month, estimate $0.10 for small volumes
    });

    return {
      unassociatedIpSavings: unused.unassociated_ips.length * 3.6,
      unusedVolumeSavings: unused.available_volumes.length * 0.1,
      totalMonthly: totalSavings,
      totalAnnual: totalSavings * 12,
    };
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

const apiKey = import.meta.env.VITE_API_KEY;
const baseURL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const awsResourceService = new AWSResourceService(baseURL, apiKey);

export { AWSResourceService };
export default awsResourceService;
