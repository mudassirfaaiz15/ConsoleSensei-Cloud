/**
 * React Hook: useAWSResources
 * Manages AWS resource scanning, filtering, and operations
 */

import { useState, useCallback } from 'react';
import {
  useMutation,
} from '@tanstack/react-query';
import {
  awsResourceService,
  AWSResourceService,
  ScanResult,
  ResourceMetadata,
  ActionResult,
  BulkActionResult,
  FilterOptions,
} from '@/lib/api/aws-resources';

interface Credentials {
  accessKey: string;
  secretKey: string;
}

interface UseAWSResourcesReturn {
  // State
  credentials: Credentials;
  setCredentials: (creds: Credentials) => void;
  isScanning: boolean;
  isFiltering: boolean;
  isPerformingAction: boolean;

  // Data
  scanResult: ScanResult | null;
  filteredResources: ResourceMetadata[];
  selectedResources: ResourceMetadata[];

  // Methods
  scan: (maxWorkers?: number) => Promise<ScanResult>;
  filter: (filters: FilterOptions) => Promise<void>;
  clearFilters: () => void;
  selectResources: (resources: ResourceMetadata[]) => void;
  toggleResourceSelection: (resource: ResourceMetadata) => void;
  clearSelection: () => void;
  performAction: (
    resourceId: string,
    resourceType: string,
    region: string,
    action: 'stop' | 'delete'
  ) => Promise<ActionResult>;
  performBulkAction: (
    action: 'stop' | 'delete'
  ) => Promise<BulkActionResult>;

  // Statistics
  getTotalCost: () => number;
  getResourceCount: () => number;
  getRegionCount: () => number;
  getResourcesByType: () => Record<string, number>;
  getCostByType: () => Record<string, number>;
  getSavingsOpportunities: () => any;
}

export function useAWSResources(): UseAWSResourcesReturn {
  // State management
  const [credentials, setCredentials] = useState<Credentials>({
    accessKey: '',
    secretKey: '',
  });
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [filteredResources, setFilteredResources] = useState<ResourceMetadata[]>([]);
  const [selectedResources, setSelectedResources] = useState<ResourceMetadata[]>([]);

  // Scan mutation
  const scanMutation = useMutation({
    mutationFn: async (maxWorkers: number = 5) => {
      return await awsResourceService.scanResources(
        credentials.accessKey,
        credentials.secretKey,
        maxWorkers
      );
    },
    onSuccess: (data) => {
      setScanResult(data);
      setFilteredResources(data.resources);
      setSelectedResources([]);
    },
  });

  // Filter mutation
  const filterMutation = useMutation({
    mutationFn: async (filters: FilterOptions) => {
      if (!scanResult) throw new Error('No scan result available');
      return await awsResourceService.filterResources(
        scanResult.resources,
        filters
      );
    },
    onSuccess: (data) => {
      setFilteredResources(data);
    },
  });

  // Action mutation
  const actionMutation = useMutation({
    mutationFn: async (params: {
      resourceId: string;
      resourceType: string;
      region: string;
      action: 'stop' | 'delete';
    }) => {
      return await awsResourceService.performAction(
        credentials.accessKey,
        credentials.secretKey,
        params.resourceId,
        params.resourceType,
        params.region,
        params.action
      );
    },
  });

  // Bulk action mutation
  const bulkActionMutation = useMutation({
    mutationFn: async (params: { action: 'stop' | 'delete' }) => {
      const actions = selectedResources.map((resource) => ({
        resource_id: resource.resource_id,
        resource_type: resource.resource_type,
        region: resource.region,
        action: params.action,
      }));

      return await awsResourceService.performBulkAction(
        credentials.accessKey,
        credentials.secretKey,
        actions
      );
    },
    onSuccess: () => {
      setSelectedResources([]);
      // Optionally re-scan to refresh data
    },
  });

  // Helper functions
  const scan = useCallback(
    async (maxWorkers: number = 5) => {
      return await scanMutation.mutateAsync(maxWorkers);
    },
    [scanMutation]
  );

  const filter = useCallback(
    async (filters: FilterOptions) => {
      await filterMutation.mutateAsync(filters);
    },
    [filterMutation]
  );

  const clearFilters = useCallback(() => {
    if (scanResult) {
      setFilteredResources(scanResult.resources);
    }
  }, [scanResult]);

  const selectResources = useCallback((resources: ResourceMetadata[]) => {
    setSelectedResources(resources);
  }, []);

  const toggleResourceSelection = useCallback((resource: ResourceMetadata) => {
    setSelectedResources((prev) => {
      const isSelected = prev.some((r) => r.resource_id === resource.resource_id);
      if (isSelected) {
        return prev.filter((r) => r.resource_id !== resource.resource_id);
      } else {
        return [...prev, resource];
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedResources([]);
  }, []);

  const performAction = useCallback(
    async (
      resourceId: string,
      resourceType: string,
      region: string,
      action: 'stop' | 'delete'
    ) => {
      return await actionMutation.mutateAsync({
        resourceId,
        resourceType,
        region,
        action,
      });
    },
    [actionMutation]
  );

  const performBulkAction = useCallback(
    async (action: 'stop' | 'delete') => {
      return await bulkActionMutation.mutateAsync({ action });
    },
    [bulkActionMutation]
  );

  // Statistics helpers
  const getTotalCost = useCallback(() => {
    return scanResult?.cost_summary.estimated_monthly_total ?? 0;
  }, [scanResult]);

  const getResourceCount = useCallback(() => {
    return scanResult?.summary.total_resources ?? 0;
  }, [scanResult]);

  const getRegionCount = useCallback(() => {
    return scanResult?.regions_scanned.length ?? 0;
  }, [scanResult]);

  const getResourcesByType = useCallback(() => {
    return scanResult?.summary.by_type ?? {};
  }, [scanResult]);

  const getCostByType = useCallback(() => {
    return scanResult?.cost_summary.by_resource_type ?? {};
  }, [scanResult]);

  const getSavingsOpportunities = useCallback(() => {
    if (!scanResult) return null;
    return (awsResourceService.constructor as typeof AWSResourceService).findUnusedResources(
      scanResult.resources
    );
  }, [scanResult]);

  return {
    // State
    credentials,
    setCredentials,
    isScanning: scanMutation.isPending,
    isFiltering: filterMutation.isPending,
    isPerformingAction: actionMutation.isPending || bulkActionMutation.isPending,

    // Data
    scanResult,
    filteredResources,
    selectedResources,

    // Methods
    scan,
    filter,
    clearFilters,
    selectResources,
    toggleResourceSelection,
    clearSelection,
    performAction,
    performBulkAction,

    // Statistics
    getTotalCost,
    getResourceCount,
    getRegionCount,
    getResourcesByType,
    getCostByType,
    getSavingsOpportunities,
  };
}

export default useAWSResources;
