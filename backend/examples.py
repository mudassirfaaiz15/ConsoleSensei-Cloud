"""
Example Usage Scripts for AWS Resource Tracker Backend
Demonstrates common operations and integration patterns
"""

import json
import requests
from typing import Dict, List, Any


class AWSResourceTrackerClient:
    """Python client for AWS Resource Tracker API"""

    def __init__(self, base_url: str = 'http://localhost:5000', api_key: str = None):
        """
        Initialize client
        
        Args:
            base_url: API base URL
            api_key: Optional API key for authentication
        """
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.session = requests.Session()

    def _get_headers(self) -> Dict[str, str]:
        """Get request headers"""
        headers = {'Content-Type': 'application/json'}
        if self.api_key:
            headers['X-API-Key'] = self.api_key
        return headers

    def health_check(self) -> Dict[str, Any]:
        """Check API health"""
        response = self.session.get(
            f'{self.base_url}/health',
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json()

    def scan_resources(
        self,
        access_key: str,
        secret_key: str,
        max_workers: int = 5
    ) -> Dict[str, Any]:
        """
        Scan AWS resources
        
        Args:
            access_key: AWS access key ID
            secret_key: AWS secret access key
            max_workers: Number of concurrent workers
            
        Returns:
            Scan result with resources and summary
        """
        response = self.session.post(
            f'{self.base_url}/api/v1/scan',
            headers=self._get_headers(),
            json={
                'access_key_id': access_key,
                'secret_access_key': secret_key,
                'max_workers': max_workers,
            }
        )
        response.raise_for_status()
        return response.json()

    def filter_resources(
        self,
        resources: List[Dict],
        resource_type: str = None,
        region: str = None,
        state: str = None,
        tags: Dict[str, str] = None
    ) -> List[Dict]:
        """
        Filter resources based on criteria
        
        Args:
            resources: List of resources from scan
            resource_type: Filter by resource type
            region: Filter by region
            state: Filter by state
            tags: Filter by tags
            
        Returns:
            Filtered resource list
        """
        filters = {}
        if resource_type:
            filters['resource_type'] = resource_type
        if region:
            filters['region'] = region
        if state:
            filters['state'] = state
        if tags:
            filters['tags'] = tags

        response = self.session.post(
            f'{self.base_url}/api/v1/resources/filter',
            headers=self._get_headers(),
            json={
                'resources': resources,
                'filters': filters,
            }
        )
        response.raise_for_status()
        result = response.json()
        return result.get('resources', [])

    def perform_action(
        self,
        access_key: str,
        secret_key: str,
        resource_id: str,
        resource_type: str,
        region: str,
        action: str  # 'stop' or 'delete'
    ) -> Dict[str, Any]:
        """
        Perform action on a resource
        
        Args:
            access_key: AWS access key ID
            secret_key: AWS secret access key
            resource_id: Resource ID
            resource_type: Resource type
            region: AWS region
            action: Action to perform ('stop' or 'delete')
            
        Returns:
            Action result
        """
        response = self.session.post(
            f'{self.base_url}/api/v1/resources/action',
            headers=self._get_headers(),
            json={
                'access_key_id': access_key,
                'secret_access_key': secret_key,
                'resource_id': resource_id,
                'resource_type': resource_type,
                'region': region,
                'action': action,
            }
        )
        response.raise_for_status()
        return response.json()

    def perform_bulk_action(
        self,
        access_key: str,
        secret_key: str,
        actions: List[Dict]
    ) -> Dict[str, Any]:
        """
        Perform actions on multiple resources
        
        Args:
            access_key: AWS access key ID
            secret_key: AWS secret access key
            actions: List of action objects
            
        Returns:
            Bulk action result
        """
        response = self.session.post(
            f'{self.base_url}/api/v1/resources/bulk-action',
            headers=self._get_headers(),
            json={
                'access_key_id': access_key,
                'secret_access_key': secret_key,
                'actions': actions,
            }
        )
        response.raise_for_status()
        return response.json()

    def get_api_docs(self) -> Dict[str, Any]:
        """Get API documentation"""
        response = self.session.get(
            f'{self.base_url}/api/v1/docs',
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json()


# ============================================================================
# EXAMPLE USAGE SCENARIOS
# ============================================================================

def example_1_basic_scan():
    """Example 1: Basic resource scan"""
    print("\n=== Example 1: Basic AWS Resource Scan ===\n")

    client = AWSResourceTrackerClient()

    # Check API health
    print("1. Checking API health...")
    health = client.health_check()
    print(f"   Status: {health['status']}")

    # Scan AWS resources
    print("\n2. Scanning AWS resources...")
    try:
        result = client.scan_resources(
            access_key='YOUR_ACCESS_KEY',
            secret_key='YOUR_SECRET_KEY',
            max_workers=5
        )

        if result['success']:
            data = result['data']
            print(f"   Total resources found: {data['summary']['total_resources']}")
            print(f"   Regions scanned: {len(data['regions_scanned'])}")
            print(f"   Scan completed: {data['timestamp']}")

            # Print resource counts by type
            print("\n   Resources by type:")
            for rtype, count in data['summary']['by_type'].items():
                print(f"     - {rtype}: {count}")

            # Print cost summary
            print(f"\n   Estimated monthly cost: ${data['cost_summary']['estimated_monthly_total']:.2f}")
            print("   Cost by resource type:")
            for rtype, cost in data['cost_summary']['by_resource_type'].items():
                if cost > 0:
                    print(f"     - {rtype}: ${cost:.2f}")
        else:
            print(f"   Error: {result['error']}")

    except Exception as e:
        print(f"   Error: {str(e)}")


def example_2_filter_resources():
    """Example 2: Filter resources from scan"""
    print("\n=== Example 2: Filter Resources ===\n")

    client = AWSResourceTrackerClient()

    # First, scan resources
    print("1. Scanning AWS resources...")
    try:
        result = client.scan_resources(
            access_key='YOUR_ACCESS_KEY',
            secret_key='YOUR_SECRET_KEY'
        )

        if not result['success']:
            print(f"   Scan failed: {result['error']}")
            return

        resources = result['data']['resources']
        print(f"   Found {len(resources)} total resources")

        # Filter for running EC2 instances in us-east-1
        print("\n2. Filtering for running EC2 instances in us-east-1...")
        filtered = client.filter_resources(
            resources=resources,
            resource_type='EC2_Instance',
            region='us-east-1',
            state='running'
        )
        print(f"   Found {len(filtered)} matching resources")

        # Display filtered resources
        if filtered:
            print("\n   Running EC2 instances in us-east-1:")
            for resource in filtered[:5]:  # Show first 5
                print(f"     - {resource['resource_name']} ({resource['resource_id']})")
                if resource.get('estimated_cost_monthly'):
                    print(f"       Cost: ${resource['estimated_cost_monthly']:.2f}/month")

    except Exception as e:
        print(f"   Error: {str(e)}")


def example_3_stop_instance():
    """Example 3: Stop an EC2 instance"""
    print("\n=== Example 3: Stop EC2 Instance ===\n")

    client = AWSResourceTrackerClient()

    print("1. Stopping EC2 instance...")
    try:
        result = client.perform_action(
            access_key='YOUR_ACCESS_KEY',
            secret_key='YOUR_SECRET_KEY',
            resource_id='i-1234567890abcdef0',
            resource_type='EC2_Instance',
            region='us-east-1',
            action='stop'
        )

        if result['success']:
            print(f"   ✓ Success: {result['message']}")
            print(f"   Status: {result['verification_status']}")
        else:
            print(f"   ✗ Failed: {result['message']}")
            if result.get('error'):
                print(f"   Error: {result['error']}")

    except Exception as e:
        print(f"   Error: {str(e)}")


def example_4_bulk_cleanup():
    """Example 4: Bulk cleanup of unassociated resources"""
    print("\n=== Example 4: Bulk Cleanup (Delete Unassociated Elastic IPs) ===\n")

    client = AWSResourceTrackerClient()

    print("1. Scanning resources...")
    try:
        result = client.scan_resources(
            access_key='YOUR_ACCESS_KEY',
            secret_key='YOUR_SECRET_KEY'
        )

        if not result['success']:
            print(f"   Scan failed: {result['error']}")
            return

        resources = result['data']['resources']

        # Filter for unassociated Elastic IPs
        print("\n2. Finding unassociated Elastic IPs...")
        unassociated_ips = client.filter_resources(
            resources=resources,
            resource_type='Elastic_IP',
            state='unassociated'
        )
        print(f"   Found {len(unassociated_ips)} unassociated Elastic IPs")

        if unassociated_ips:
            # Prepare bulk action
            print("\n3. Preparing bulk delete operation...")
            actions = [
                {
                    'resource_id': ip['resource_id'],
                    'resource_type': 'Elastic_IP',
                    'region': ip['region'],
                    'action': 'delete'
                }
                for ip in unassociated_ips[:5]  # Limit to 5 for example
            ]
            print(f"   Prepared {len(actions)} delete operations")

            # Execute bulk action
            print("\n4. Executing bulk delete...")
            bulk_result = client.perform_bulk_action(
                access_key='YOUR_ACCESS_KEY',
                secret_key='YOUR_SECRET_KEY',
                actions=actions
            )

            print(f"   Total actions: {bulk_result['total_actions']}")
            print(f"   Successful: {bulk_result['successful']}")
            print(f"   Failed: {bulk_result['failed']}")

            if bulk_result['results']:
                print("\n   Results:")
                for result in bulk_result['results']:
                    status = "✓" if result['success'] else "✗"
                    print(f"     {status} {result['resource_id']}: {result['message']}")

    except Exception as e:
        print(f"   Error: {str(e)}")


def example_5_cost_analysis():
    """Example 5: Cost analysis and recommendations"""
    print("\n=== Example 5: Cost Analysis & Recommendations ===\n")

    client = AWSResourceTrackerClient()

    print("1. Scanning AWS resources...")
    try:
        result = client.scan_resources(
            access_key='YOUR_ACCESS_KEY',
            secret_key='YOUR_SECRET_KEY'
        )

        if not result['success']:
            print(f"   Scan failed: {result['error']}")
            return

        data = result['data']
        resources = data['resources']
        cost_summary = data['cost_summary']

        print(f"\n2. Cost Summary:")
        print(f"   Estimated monthly cost: ${cost_summary['estimated_monthly_total']:.2f}")

        print("\n3. Potential Cost Savings:")

        # Find stopped instances (potential savings)
        stopped_instances = client.filter_resources(
            resources=resources,
            resource_type='EC2_Instance',
            state='stopped'
        )
        if stopped_instances:
            print(f"\n   - {len(stopped_instances)} Stopped EC2 Instances")
            print(f"     (Consider terminating if no longer needed)")

        # Find unassociated Elastic IPs (cost optimization)
        unassociated_ips = client.filter_resources(
            resources=resources,
            resource_type='Elastic_IP',
            state='unassociated'
        )
        if unassociated_ips:
            savings = len(unassociated_ips) * 3.6  # $3.6 per month per unassociated EIP
            print(f"\n   - {len(unassociated_ips)} Unassociated Elastic IPs")
            print(f"     Potential savings: ${savings:.2f}/month")
            print(f"     (Release these IPs if not needed)")

        # Find resources with high cost
        print(f"\n4. Most Expensive Resources:")
        expensive = sorted(
            [r for r in resources if r.get('estimated_cost_monthly', 0) > 0],
            key=lambda x: x.get('estimated_cost_monthly', 0),
            reverse=True
        )[:5]

        for i, resource in enumerate(expensive, 1):
            cost = resource.get('estimated_cost_monthly', 0)
            print(f"   {i}. {resource['resource_name']} ({resource['resource_type']})")
            print(f"      Cost: ${cost:.2f}/month")
            print(f"      State: {resource['state']}")

    except Exception as e:
        print(f"   Error: {str(e)}")


# ============================================================================
# CURL EXAMPLES (for testing without Python)
# ============================================================================

CURL_EXAMPLES = """
# CURL Examples for AWS Resource Tracker API

# 1. Health Check
curl http://localhost:5000/health

# 2. Scan AWS Resources
curl -X POST http://localhost:5000/api/v1/scan \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-api-key" \\
  -d '{
    "access_key_id": "YOUR_ACCESS_KEY",
    "secret_access_key": "YOUR_SECRET_KEY",
    "max_workers": 5
  }'

# 3. Stop EC2 Instance
curl -X POST http://localhost:5000/api/v1/resources/action \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-api-key" \\
  -d '{
    "access_key_id": "YOUR_ACCESS_KEY",
    "secret_access_key": "YOUR_SECRET_KEY",
    "resource_id": "i-1234567890abcdef0",
    "resource_type": "EC2_Instance",
    "region": "us-east-1",
    "action": "stop"
  }'

# 4. Delete NAT Gateway
curl -X POST http://localhost:5000/api/v1/resources/action \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-api-key" \\
  -d '{
    "access_key_id": "YOUR_ACCESS_KEY",
    "secret_access_key": "YOUR_SECRET_KEY",
    "resource_id": "nat-1234567890abcdef0",
    "resource_type": "NAT_Gateway",
    "region": "us-east-1",
    "action": "delete"
  }'

# 5. Get API Documentation
curl http://localhost:5000/api/v1/docs \\
  -H "X-API-Key: your-api-key"
"""


# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    import sys

    print("AWS Resource Tracker - Usage Examples")
    print("=" * 50)

    if len(sys.argv) > 1:
        example = sys.argv[1]
        if example == '1':
            example_1_basic_scan()
        elif example == '2':
            example_2_filter_resources()
        elif example == '3':
            example_3_stop_instance()
        elif example == '4':
            example_4_bulk_cleanup()
        elif example == '5':
            example_5_cost_analysis()
        else:
            print(f"Unknown example: {example}")
    else:
        print("\nUsage: python examples.py [example_number]")
        print("\nAvailable examples:")
        print("  1 - Basic resource scan")
        print("  2 - Filter resources")
        print("  3 - Stop EC2 instance")
        print("  4 - Bulk cleanup of unassociated resources")
        print("  5 - Cost analysis and recommendations")

    print("\n" + "=" * 50)
    print(CURL_EXAMPLES)
