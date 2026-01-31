/**
 * AWS Resource Dashboard Component
 * Main interface for scanning, viewing, filtering, and managing AWS resources
 */

import { useState } from 'react';
import { useAWSResources } from '@/hooks/use-aws-resources';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Alert } from '@/app/components/ui/alert';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { ResourceMetadata, ScanResult } from '@/lib/api/aws-resources';
import { Loader2, Cloud, DollarSign, Globe, AlertCircle } from 'lucide-react';

// ============================================================================
// CREDENTIALS SECTION
// ============================================================================

function CredentialsSection({
  credentials,
  setCredentials,
  onScan,
  isScanning,
}: {
  credentials: any;
  setCredentials: (c: any) => void;
  onScan: () => void;
  isScanning: boolean;
}) {
  return (
    <Card>
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            AWS Credentials
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Enter your AWS credentials to scan resources
          </p>
        </div>

        <div className="space-y-3">
          <Input
            type="password"
            placeholder="AWS Access Key ID"
            value={credentials.accessKey}
            onChange={(e) =>
              setCredentials({ ...credentials, accessKey: e.target.value })
            }
            className="font-mono text-sm"
          />
          <Input
            type="password"
            placeholder="AWS Secret Access Key"
            value={credentials.secretKey}
            onChange={(e) =>
              setCredentials({ ...credentials, secretKey: e.target.value })
            }
            className="font-mono text-sm"
          />
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <div className="ml-2 text-sm text-blue-800">
            Credentials are never stored. Used only during this session.
          </div>
        </Alert>

        <Button
          onClick={onScan}
          disabled={
            isScanning ||
            !credentials.accessKey ||
            !credentials.secretKey
          }
          className="w-full h-10 text-base"
          size="lg"
        >
          {isScanning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning AWS Resources...
            </>
          ) : (
            'Scan AWS Resources'
          )}
        </Button>
      </div>
    </Card>
  );
}

// ============================================================================
// SCAN RESULTS SUMMARY
// ============================================================================

function ResultsSummary({ scanResult }: { scanResult: ScanResult | null }) {
  if (!scanResult) return null;

  const stats = [
    {
      label: 'Total Resources',
      value: scanResult.summary.total_resources,
      icon: Cloud,
      color: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Regions Scanned',
      value: scanResult.regions_scanned.length,
      icon: Globe,
      color: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      label: 'Monthly Cost',
      value: `$${scanResult.cost_summary.estimated_monthly_total.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      label: 'Errors',
      value: scanResult.errors.length,
      icon: AlertCircle,
      color: scanResult.errors.length > 0 ? 'bg-red-50' : 'bg-gray-50',
      textColor: scanResult.errors.length > 0 ? 'text-red-600' : 'text-gray-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <div className={`p-6 ${stat.color} rounded-lg`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    {stat.label}
                  </p>
                  <p className={`text-2xl font-bold ${stat.textColor} mt-2`}>
                    {stat.value}
                  </p>
                </div>
                <Icon className={`w-8 h-8 ${stat.textColor} opacity-20`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ============================================================================
// RESOURCES BY TYPE
// ============================================================================

function ResourcesByType({ scanResult }: { scanResult: ScanResult | null }) {
  if (!scanResult || Object.keys(scanResult.summary.by_type).length === 0) {
    return null;
  }

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Resources by Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(scanResult.summary.by_type).map(([type, count]) => (
            <div
              key={type}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition"
            >
              <p className="text-sm font-medium text-gray-600">{type}</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{count}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// FILTER PANEL
// ============================================================================

function FilterPanel({
  scanResult,
  onFilter,
  onClearFilters,
  isFiltering,
}: {
  scanResult: ScanResult | null;
  onFilter: (filters: any) => void;
  onClearFilters: () => void;
  isFiltering: boolean;
}) {
  const [filters, setFilters] = useState({
    resourceType: '',
    region: '',
    state: '',
  });

  if (!scanResult) return null;

  const resourceTypes = Array.from(
    new Set(scanResult.resources.map((r) => r.resource_type))
  ).sort();
  const regions = Array.from(
    new Set(scanResult.resources.map((r) => r.region))
  ).sort();
  const states = Array.from(
    new Set(scanResult.resources.map((r) => r.state))
  ).sort();

  const handleFilter = () => {
    const activeFilters = Object.entries(filters).reduce(
      (acc, [key, value]) => {
        if (value)
          acc[key === 'resourceType' ? 'resource_type' : key] = value;
        return acc;
      },
      {} as any
    );
    onFilter(activeFilters);
  };

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Filter Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Resource Type</label>
            <Select
              value={filters.resourceType}
              onValueChange={(value) =>
                setFilters({ ...filters, resourceType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                {resourceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Region</label>
            <Select
              value={filters.region}
              onValueChange={(value) =>
                setFilters({ ...filters, region: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All regions</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">State</label>
            <Select
              value={filters.state}
              onValueChange={(value) =>
                setFilters({ ...filters, state: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All states" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All states</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button
            onClick={handleFilter}
            disabled={isFiltering}
            className="flex-1"
          >
            {isFiltering ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Filtering...
              </>
            ) : (
              'Apply Filters'
            )}
          </Button>
          <Button onClick={onClearFilters} variant="outline" className="flex-1">
            Clear Filters
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// RESOURCES TABLE
// ============================================================================

function ResourcesTable({
  resources,
  selectedResources,
  onToggleSelection,
  onSelectAll,
}: {
  resources: ResourceMetadata[];
  selectedResources: ResourceMetadata[];
  onToggleSelection: (resource: ResourceMetadata) => void;
  onSelectAll: (select: boolean) => void;
}) {
  if (resources.length === 0) return null;

  const allSelected =
    resources.length > 0 && selectedResources.length === resources.length;

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Resources ({resources.length})
          </h3>
          {resources.length > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <label className="text-sm text-gray-600 cursor-pointer">
                Select All
              </label>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="text-left py-3 px-3 font-semibold">Name</th>
                <th className="text-left py-3 px-3 font-semibold">Type</th>
                <th className="text-left py-3 px-3 font-semibold">Region</th>
                <th className="text-left py-3 px-3 font-semibold">State</th>
                <th className="text-right py-3 px-3 font-semibold">Cost/Month</th>
              </tr>
            </thead>
            <tbody>
              {resources.slice(0, 50).map((resource) => {
                const isSelected = selectedResources.some(
                  (r) => r.resource_id === resource.resource_id
                );
                return (
                  <tr
                    key={resource.resource_id}
                    className={`border-b hover:bg-gray-50 transition ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelection(resource)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 font-medium">
                      {resource.resource_name || resource.resource_id}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {resource.resource_type}
                      </span>
                    </td>
                    <td className="py-3 px-3">{resource.region}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          resource.state === 'running' ||
                          resource.state === 'active'
                            ? 'bg-green-100 text-green-800'
                            : resource.state === 'stopped' ||
                              resource.state === 'available'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {resource.state}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {resource.estimated_cost_monthly ? (
                        `$${resource.estimated_cost_monthly.toFixed(2)}`
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {resources.length > 50 && (
            <div className="p-4 text-center text-sm text-gray-600">
              Showing 50 of {resources.length} resources
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// BULK ACTIONS
// ============================================================================

function BulkActionsPanel({
  selectedCount,
  onPerformAction,
  isPerforming,
}: {
  selectedCount: number;
  onPerformAction: (action: 'stop' | 'delete') => void;
  isPerforming: boolean;
}) {
  if (selectedCount === 0) return null;

  return (
    <Card>
      <div className="p-6 bg-blue-50 border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Bulk Actions</h3>
            <p className="text-sm text-gray-600 mt-1">
              {selectedCount} resource{selectedCount !== 1 ? 's' : ''} selected
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => onPerformAction('stop')}
              disabled={isPerforming}
              variant="outline"
            >
              {isPerforming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                'Stop'
              )}
            </Button>
            <Button
              onClick={() => onPerformAction('delete')}
              disabled={isPerforming}
              variant="destructive"
            >
              {isPerforming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export function AWSResourceDashboard() {
  const {
    credentials,
    setCredentials,
    scanResult,
    filteredResources,
    selectedResources,
    isScanning,
    isFiltering,
    isPerformingAction,
    scan,
    filter,
    clearFilters,
    toggleResourceSelection,
    selectResources,
    performBulkAction,
  } = useAWSResources();

  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    try {
      setError(null);
      await scan(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    }
  };

  const handleFilter = async (filters: any) => {
    try {
      setError(null);
      await filter(filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Filter failed');
    }
  };

  const handleBulkAction = async (action: 'stop' | 'delete') => {
    try {
      if (selectedResources.length === 0) {
        setError('No resources selected');
        return;
      }
      const result = await performBulkAction(action);
      if (result.successful > 0) {
        alert(
          `Successfully ${action}ped ${result.successful} resource${result.successful !== 1 ? 's' : ''}`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <div className="ml-2">{error}</div>
        </Alert>
      )}

      {/* Credentials */}
      <CredentialsSection
        credentials={credentials}
        setCredentials={setCredentials}
        onScan={handleScan}
        isScanning={isScanning}
      />

      {/* Results */}
      {scanResult && (
        <>
          <ResultsSummary scanResult={scanResult} />
          <ResourcesByType scanResult={scanResult} />
          <FilterPanel
            scanResult={scanResult}
            onFilter={handleFilter}
            onClearFilters={clearFilters}
            isFiltering={isFiltering}
          />
          <ResourcesTable
            resources={filteredResources}
            selectedResources={selectedResources}
            onToggleSelection={toggleResourceSelection}
            onSelectAll={(select) => {
              if (select) {
                selectResources(filteredResources);
              } else {
                selectResources([]);
              }
            }}
          />
          <BulkActionsPanel
            selectedCount={selectedResources.length}
            onPerformAction={handleBulkAction}
            isPerforming={isPerformingAction}
          />
        </>
      )}
    </div>
  );
}

export default AWSResourceDashboard;
