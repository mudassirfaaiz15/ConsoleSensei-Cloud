"""
AWS Resource Tracker & Management Application - Backend
Production-grade Python implementation with boto3

Architecture:
- Core session management for AWS credentials
- Multi-region resource scanning
- Cost estimation integration
- Resource management (stop/delete)
- Comprehensive error handling
- Structured JSON output
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

import boto3
from botocore.exceptions import ClientError, BotoCoreError, NoCredentialsError


# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

handler = logging.StreamHandler()
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
handler.setFormatter(formatter)
logger.addHandler(handler)


# ============================================================================
# DATA CLASSES & MODELS
# ============================================================================

@dataclass
class ResourceMetadata:
    """Standard metadata for any AWS resource"""
    resource_id: str
    resource_name: Optional[str]
    resource_type: str
    region: str
    state: str
    creation_date: Optional[str]
    tags: Dict[str, str]
    estimated_cost_monthly: Optional[float] = None
    additional_metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.additional_metadata is None:
            self.additional_metadata = {}

    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        return {
            'resource_id': self.resource_id,
            'resource_name': self.resource_name,
            'resource_type': self.resource_type,
            'region': self.region,
            'state': self.state,
            'creation_date': self.creation_date,
            'tags': self.tags,
            'estimated_cost_monthly': self.estimated_cost_monthly,
            'metadata': self.additional_metadata,
        }


@dataclass
class ScanResult:
    """Result of scanning all AWS resources"""
    timestamp: str
    regions_scanned: List[str]
    resources: List[ResourceMetadata]
    errors: List[Dict[str, str]]
    summary: Dict[str, Any]
    cost_summary: Dict[str, Any]

    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        return {
            'timestamp': self.timestamp,
            'regions_scanned': self.regions_scanned,
            'resources': [r.to_dict() for r in self.resources],
            'errors': self.errors,
            'summary': self.summary,
            'cost_summary': self.cost_summary,
        }


@dataclass
class DeleteResult:
    """Result of delete/stop operation"""
    success: bool
    resource_id: str
    resource_type: str
    action: str  # 'delete' or 'stop'
    message: str
    verification_status: str  # 'verified', 'pending', 'failed'
    error: Optional[str] = None


# ============================================================================
# AWS SESSION MANAGEMENT
# ============================================================================

class AWSSessionManager:
    """
    Manages AWS credentials securely without permanent storage
    Uses in-memory session management only
    """

    def __init__(self, access_key_id: str, secret_access_key: str, region: str = 'us-east-1'):
        """
        Initialize AWS session with credentials
        
        Args:
            access_key_id: AWS Access Key ID
            secret_access_key: AWS Secret Access Key
            region: Default region
        
        Note: Credentials are never logged or written to disk
        """
        if not access_key_id or not secret_access_key:
            raise ValueError("AWS credentials cannot be empty")

        self.region = region
        self._access_key = access_key_id
        self._secret_key = secret_access_key
        self._session = None
        self._clients = {}  # Cache for clients by region
        self._lock = threading.Lock()

        self._initialize_session()

    def _initialize_session(self):
        """Initialize boto3 session with credentials"""
        try:
            self._session = boto3.Session(
                aws_access_key_id=self._access_key,
                aws_secret_access_key=self._secret_key,
                region_name=self.region
            )
            logger.info("AWS session initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize AWS session: {str(e)}")
            raise ValueError("Invalid AWS credentials")

    def get_client(self, service: str, region: str = None) -> boto3.client:
        """
        Get or create boto3 client for a service
        
        Args:
            service: AWS service name (ec2, s3, rds, etc.)
            region: AWS region (uses default if not provided)
        
        Returns:
            boto3 client instance
        """
        region = region or self.region
        cache_key = f"{service}_{region}"

        if cache_key not in self._clients:
            with self._lock:
                if cache_key not in self._clients:
                    self._clients[cache_key] = self._session.client(
                        service,
                        region_name=region
                    )

        return self._clients[cache_key]

    def get_regions(self) -> List[str]:
        """
        Get list of available AWS regions
        Fetches dynamically using EC2 DescribeRegions API
        
        Returns:
            List of region names
        """
        try:
            ec2 = self.get_client('ec2', self.region)
            response = ec2.describe_regions(AllRegions=False)
            regions = [r['RegionName'] for r in response['Regions']]
            logger.info(f"Found {len(regions)} available regions")
            return sorted(regions)
        except ClientError as e:
            logger.error(f"Failed to fetch regions: {str(e)}")
            # Fallback to common regions if API fails
            return [
                'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
                'eu-west-1', 'eu-central-1', 'ap-southeast-1', 'ap-northeast-1'
            ]

    def cleanup(self):
        """
        Cleanup session and clear credentials from memory
        Call this when done with AWS operations
        """
        self._clients.clear()
        self._session = None
        self._access_key = None
        self._secret_key = None
        logger.info("AWS session cleaned up")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.cleanup()


# ============================================================================
# AWS SERVICE SCANNERS
# ============================================================================

class EC2Scanner:
    """Scanner for EC2 instances and related resources"""

    def __init__(self, session_manager: AWSSessionManager):
        self.session = session_manager

    def scan_instances(self, region: str) -> List[ResourceMetadata]:
        """Scan EC2 instances in a region"""
        resources = []
        try:
            ec2 = self.session.get_client('ec2', region)
            response = ec2.describe_instances()

            for reservation in response.get('Reservations', []):
                for instance in reservation.get('Instances', []):
                    tags = {t['Key']: t['Value'] for t in instance.get('Tags', [])}
                    
                    resource = ResourceMetadata(
                        resource_id=instance['InstanceId'],
                        resource_name=tags.get('Name', 'Unnamed'),
                        resource_type='EC2_Instance',
                        region=region,
                        state=instance['State']['Name'],
                        creation_date=instance['LaunchTime'].isoformat(),
                        tags=tags,
                        additional_metadata={
                            'instance_type': instance.get('InstanceType'),
                            'vpc_id': instance.get('VpcId'),
                            'subnet_id': instance.get('SubnetId'),
                            'public_ip': instance.get('PublicIpAddress'),
                            'private_ip': instance.get('PrivateIpAddress'),
                        }
                    )
                    resources.append(resource)

            logger.info(f"Found {len(resources)} EC2 instances in {region}")
        except ClientError as e:
            logger.warning(f"Failed to scan EC2 in {region}: {str(e)}")

        return resources

    def scan_volumes(self, region: str) -> List[ResourceMetadata]:
        """Scan EBS volumes in a region"""
        resources = []
        try:
            ec2 = self.session.get_client('ec2', region)
            response = ec2.describe_volumes()

            for volume in response.get('Volumes', []):
                tags = {t['Key']: t['Value'] for t in volume.get('Tags', [])}
                
                resource = ResourceMetadata(
                    resource_id=volume['VolumeId'],
                    resource_name=tags.get('Name', 'Unnamed'),
                    resource_type='EBS_Volume',
                    region=region,
                    state=volume['State'],
                    creation_date=volume['CreateTime'].isoformat(),
                    tags=tags,
                    additional_metadata={
                        'size_gb': volume['Size'],
                        'volume_type': volume['VolumeType'],
                        'iops': volume.get('Iops'),
                        'attached_to': [a['InstanceId'] for a in volume.get('Attachments', [])],
                    }
                )
                resources.append(resource)

            logger.info(f"Found {len(resources)} EBS volumes in {region}")
        except ClientError as e:
            logger.warning(f"Failed to scan EBS volumes in {region}: {str(e)}")

        return resources

    def scan_elastic_ips(self, region: str) -> List[ResourceMetadata]:
        """Scan Elastic IPs in a region"""
        resources = []
        try:
            ec2 = self.session.get_client('ec2', region)
            response = ec2.describe_addresses()

            for address in response.get('Addresses', []):
                tags = {t['Key']: t['Value'] for t in address.get('Tags', [])}
                
                resource = ResourceMetadata(
                    resource_id=address['AllocationId'],
                    resource_name=tags.get('Name', address['PublicIp']),
                    resource_type='Elastic_IP',
                    region=region,
                    state='associated' if 'AssociationId' in address else 'unassociated',
                    creation_date=address['PublicIpOwnerId'],
                    tags=tags,
                    additional_metadata={
                        'public_ip': address['PublicIp'],
                        'associated_instance': address.get('InstanceId'),
                        'associated_eni': address.get('NetworkInterfaceId'),
                    }
                )
                resources.append(resource)

            logger.info(f"Found {len(resources)} Elastic IPs in {region}")
        except ClientError as e:
            logger.warning(f"Failed to scan Elastic IPs in {region}: {str(e)}")

        return resources


class S3Scanner:
    """Scanner for S3 buckets (global service)"""

    def __init__(self, session_manager: AWSSessionManager):
        self.session = session_manager

    def scan_buckets(self) -> List[ResourceMetadata]:
        """Scan S3 buckets (global, not region-specific)"""
        resources = []
        try:
            s3 = self.session.get_client('s3', 'us-east-1')
            response = s3.list_buckets()

            for bucket in response.get('Buckets', []):
                # Get bucket region
                try:
                    region_resp = s3.get_bucket_location(Bucket=bucket['Name'])
                    bucket_region = region_resp['LocationConstraint'] or 'us-east-1'
                except ClientError:
                    bucket_region = 'unknown'

                # Get bucket tags
                try:
                    tags_resp = s3.get_bucket_tagging(Bucket=bucket['Name'])
                    tags = {t['Key']: t['Value'] for t in tags_resp.get('TagSet', [])}
                except ClientError:
                    tags = {}

                # Get bucket size
                try:
                    cloudwatch = self.session.get_client('cloudwatch', 'us-east-1')
                    metric_resp = cloudwatch.get_metric_statistics(
                        Namespace='AWS/S3',
                        MetricName='BucketSizeBytes',
                        Dimensions=[
                            {'Name': 'BucketName', 'Value': bucket['Name']},
                            {'Name': 'StorageType', 'Value': 'StandardStorage'}
                        ],
                        StartTime=datetime.utcnow() - timedelta(days=1),
                        EndTime=datetime.utcnow(),
                        Period=86400,
                        Statistics=['Average']
                    )
                    size_bytes = metric_resp['Datapoints'][0]['Average'] if metric_resp['Datapoints'] else 0
                except ClientError:
                    size_bytes = 0

                resource = ResourceMetadata(
                    resource_id=bucket['Name'],
                    resource_name=bucket['Name'],
                    resource_type='S3_Bucket',
                    region=bucket_region,
                    state='active',
                    creation_date=bucket['CreationDate'].isoformat(),
                    tags=tags,
                    additional_metadata={
                        'size_bytes': size_bytes,
                        'size_gb': round(size_bytes / (1024**3), 2),
                    }
                )
                resources.append(resource)

            logger.info(f"Found {len(resources)} S3 buckets")
        except ClientError as e:
            logger.warning(f"Failed to scan S3 buckets: {str(e)}")

        return resources


class RDSScanner:
    """Scanner for RDS database instances"""

    def __init__(self, session_manager: AWSSessionManager):
        self.session = session_manager

    def scan_instances(self, region: str) -> List[ResourceMetadata]:
        """Scan RDS instances in a region"""
        resources = []
        try:
            rds = self.session.get_client('rds', region)
            response = rds.describe_db_instances()

            for instance in response.get('DBInstances', []):
                tags_resp = rds.list_tags_for_resource(
                    ResourceName=instance['DBInstanceArn']
                )
                tags = {t['Key']: t['Value'] for t in tags_resp.get('TagList', [])}

                resource = ResourceMetadata(
                    resource_id=instance['DBInstanceIdentifier'],
                    resource_name=instance['DBInstanceIdentifier'],
                    resource_type='RDS_Instance',
                    region=region,
                    state=instance['DBInstanceStatus'],
                    creation_date=instance['InstanceCreateTime'].isoformat(),
                    tags=tags,
                    additional_metadata={
                        'engine': instance.get('Engine'),
                        'instance_class': instance.get('DBInstanceClass'),
                        'allocated_storage_gb': instance.get('AllocatedStorage'),
                        'multi_az': instance.get('MultiAZ'),
                    }
                )
                resources.append(resource)

            logger.info(f"Found {len(resources)} RDS instances in {region}")
        except ClientError as e:
            logger.warning(f"Failed to scan RDS in {region}: {str(e)}")

        return resources


class LambdaScanner:
    """Scanner for Lambda functions"""

    def __init__(self, session_manager: AWSSessionManager):
        self.session = session_manager

    def scan_functions(self, region: str) -> List[ResourceMetadata]:
        """Scan Lambda functions in a region"""
        resources = []
        try:
            lambda_client = self.session.get_client('lambda', region)
            paginator = lambda_client.get_paginator('list_functions')

            for page in paginator.paginate():
                for function in page.get('Functions', []):
                    # Get function tags
                    try:
                        tags_resp = lambda_client.list_tags(
                            Resource=function['FunctionArn']
                        )
                        tags = tags_resp.get('Tags', {})
                    except ClientError:
                        tags = {}

                    resource = ResourceMetadata(
                        resource_id=function['FunctionArn'],
                        resource_name=function['FunctionName'],
                        resource_type='Lambda_Function',
                        region=region,
                        state='active',
                        creation_date=function['LastModified'],
                        tags=tags,
                        additional_metadata={
                            'runtime': function.get('Runtime'),
                            'handler': function.get('Handler'),
                            'memory_mb': function.get('MemorySize'),
                            'timeout_sec': function.get('Timeout'),
                            'code_size_bytes': function.get('CodeSize'),
                        }
                    )
                    resources.append(resource)

            logger.info(f"Found {len(resources)} Lambda functions in {region}")
        except ClientError as e:
            logger.warning(f"Failed to scan Lambda in {region}: {str(e)}")

        return resources


class ELBScanner:
    """Scanner for Elastic Load Balancers (ALB/NLB)"""

    def __init__(self, session_manager: AWSSessionManager):
        self.session = session_manager

    def scan_load_balancers(self, region: str) -> List[ResourceMetadata]:
        """Scan load balancers in a region"""
        resources = []
        try:
            elbv2 = self.session.get_client('elbv2', region)
            response = elbv2.describe_load_balancers()

            for lb in response.get('LoadBalancers', []):
                # Get tags
                try:
                    tags_resp = elbv2.describe_tags(
                        ResourceArns=[lb['LoadBalancerArn']]
                    )
                    tags = {}
                    for tag_desc in tags_resp.get('TagDescriptions', []):
                        tags = {t['Key']: t['Value'] for t in tag_desc.get('Tags', [])}
                except ClientError:
                    tags = {}

                resource = ResourceMetadata(
                    resource_id=lb['LoadBalancerArn'],
                    resource_name=lb['LoadBalancerName'],
                    resource_type='Load_Balancer',
                    region=region,
                    state=lb['State']['Code'],
                    creation_date=lb['CreatedTime'].isoformat(),
                    tags=tags,
                    additional_metadata={
                        'type': lb.get('Type'),
                        'scheme': lb.get('Scheme'),
                        'dns_name': lb.get('DNSName'),
                        'vpc_id': lb.get('VpcId'),
                    }
                )
                resources.append(resource)

            logger.info(f"Found {len(resources)} load balancers in {region}")
        except ClientError as e:
            logger.warning(f"Failed to scan load balancers in {region}: {str(e)}")

        return resources


class CloudWatchLogsScanner:
    """Scanner for CloudWatch log groups"""

    def __init__(self, session_manager: AWSSessionManager):
        self.session = session_manager

    def scan_log_groups(self, region: str) -> List[ResourceMetadata]:
        """Scan CloudWatch log groups in a region"""
        resources = []
        try:
            logs = self.session.get_client('logs', region)
            paginator = logs.get_paginator('describe_log_groups')

            for page in paginator.paginate():
                for log_group in page.get('logGroups', []):
                    # Get log group retention
                    retention_days = log_group.get('retentionInDays', 'Never expire')

                    resource = ResourceMetadata(
                        resource_id=log_group['logGroupName'],
                        resource_name=log_group['logGroupName'],
                        resource_type='CloudWatch_LogGroup',
                        region=region,
                        state='active',
                        creation_date=datetime.fromtimestamp(
                            log_group['creationTime'] / 1000
                        ).isoformat(),
                        tags=log_group.get('tags', {}),
                        additional_metadata={
                            'stored_bytes': log_group.get('storedBytes', 0),
                            'retention_days': retention_days,
                        }
                    )
                    resources.append(resource)

            logger.info(f"Found {len(resources)} log groups in {region}")
        except ClientError as e:
            logger.warning(f"Failed to scan CloudWatch logs in {region}: {str(e)}")

        return resources


class NATGatewayScanner:
    """Scanner for NAT Gateways"""

    def __init__(self, session_manager: AWSSessionManager):
        self.session = session_manager

    def scan_nat_gateways(self, region: str) -> List[ResourceMetadata]:
        """Scan NAT Gateways in a region"""
        resources = []
        try:
            ec2 = self.session.get_client('ec2', region)
            response = ec2.describe_nat_gateways()

            for nat in response.get('NatGateways', []):
                tags = {t['Key']: t['Value'] for t in nat.get('Tags', [])}

                resource = ResourceMetadata(
                    resource_id=nat['NatGatewayId'],
                    resource_name=tags.get('Name', nat['NatGatewayId']),
                    resource_type='NAT_Gateway',
                    region=region,
                    state=nat['State'],
                    creation_date=nat['CreateTime'].isoformat(),
                    tags=tags,
                    additional_metadata={
                        'subnet_id': nat.get('SubnetId'),
                        'allocation_id': nat.get('NatGatewayAddresses', [{}])[0].get('AllocationId'),
                        'public_ip': nat.get('NatGatewayAddresses', [{}])[0].get('PublicIp'),
                    }
                )
                resources.append(resource)

            logger.info(f"Found {len(resources)} NAT Gateways in {region}")
        except ClientError as e:
            logger.warning(f"Failed to scan NAT Gateways in {region}: {str(e)}")

        return resources


class IAMScanner:
    """Scanner for IAM users and roles (read-only, global service)"""

    def __init__(self, session_manager: AWSSessionManager):
        self.session = session_manager

    def scan_users(self) -> List[ResourceMetadata]:
        """Scan IAM users (global, not region-specific)"""
        resources = []
        try:
            iam = self.session.get_client('iam', 'us-east-1')
            paginator = iam.get_paginator('list_users')

            for page in paginator.paginate():
                for user in page.get('Users', []):
                    # Get user tags
                    try:
                        tags_resp = iam.list_user_tags(UserName=user['UserName'])
                        tags = {t['Key']: t['Value'] for t in tags_resp.get('Tags', [])}
                    except ClientError:
                        tags = {}

                    resource = ResourceMetadata(
                        resource_id=user['UserId'],
                        resource_name=user['UserName'],
                        resource_type='IAM_User',
                        region='global',
                        state='active',
                        creation_date=user['CreateDate'].isoformat(),
                        tags=tags,
                        additional_metadata={
                            'arn': user['Arn'],
                        }
                    )
                    resources.append(resource)

            logger.info(f"Found {len(resources)} IAM users")
        except ClientError as e:
            logger.warning(f"Failed to scan IAM users: {str(e)}")

        return resources

    def scan_roles(self) -> List[ResourceMetadata]:
        """Scan IAM roles (global, not region-specific)"""
        resources = []
        try:
            iam = self.session.get_client('iam', 'us-east-1')
            paginator = iam.get_paginator('list_roles')

            for page in paginator.paginate():
                for role in page.get('Roles', []):
                    # Get role tags
                    try:
                        tags_resp = iam.list_role_tags(RoleName=role['RoleName'])
                        tags = {t['Key']: t['Value'] for t in tags_resp.get('Tags', [])}
                    except ClientError:
                        tags = {}

                    resource = ResourceMetadata(
                        resource_id=role['RoleId'],
                        resource_name=role['RoleName'],
                        resource_type='IAM_Role',
                        region='global',
                        state='active',
                        creation_date=role['CreateDate'].isoformat(),
                        tags=tags,
                        additional_metadata={
                            'arn': role['Arn'],
                        }
                    )
                    resources.append(resource)

            logger.info(f"Found {len(resources)} IAM roles")
        except ClientError as e:
            logger.warning(f"Failed to scan IAM roles: {str(e)}")

        return resources


# ============================================================================
# MAIN RESOURCE SCANNER ORCHESTRATOR
# ============================================================================

class AWSResourceScanner:
    """
    Main orchestrator for scanning all AWS resources
    Handles multi-region scanning with proper error handling and concurrency
    """

    def __init__(self, access_key_id: str, secret_access_key: str):
        """
        Initialize the scanner
        
        Args:
            access_key_id: AWS Access Key ID
            secret_access_key: AWS Secret Access Key
        """
        self.session_manager = AWSSessionManager(access_key_id, secret_access_key)
        self.errors = []

    def scan(self, max_workers: int = 5) -> ScanResult:
        """
        Scan entire AWS account across all regions
        
        Args:
            max_workers: Number of concurrent threads for multi-region scanning
        
        Returns:
            ScanResult with all resources grouped by region/type
        """
        logger.info("Starting AWS resource scan...")
        start_time = datetime.utcnow()

        # Get all regions
        regions = self.session_manager.get_regions()
        all_resources = []

        # Regional scanners (non-global services)
        regional_scanners = [
            EC2Scanner(self.session_manager),
            RDSScanner(self.session_manager),
            LambdaScanner(self.session_manager),
            ELBScanner(self.session_manager),
            CloudWatchLogsScanner(self.session_manager),
            NATGatewayScanner(self.session_manager),
        ]

        # Global scanners
        s3_scanner = S3Scanner(self.session_manager)
        iam_scanner = IAMScanner(self.session_manager)

        # Scan regional resources with concurrency
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = []

            for region in regions:
                # EC2 resources
                futures.append(
                    executor.submit(EC2Scanner(self.session_manager).scan_instances, region)
                )
                futures.append(
                    executor.submit(EC2Scanner(self.session_manager).scan_volumes, region)
                )
                futures.append(
                    executor.submit(EC2Scanner(self.session_manager).scan_elastic_ips, region)
                )

                # Other regional services
                futures.append(
                    executor.submit(RDSScanner(self.session_manager).scan_instances, region)
                )
                futures.append(
                    executor.submit(LambdaScanner(self.session_manager).scan_functions, region)
                )
                futures.append(
                    executor.submit(ELBScanner(self.session_manager).scan_load_balancers, region)
                )
                futures.append(
                    executor.submit(CloudWatchLogsScanner(self.session_manager).scan_log_groups, region)
                )
                futures.append(
                    executor.submit(NATGatewayScanner(self.session_manager).scan_nat_gateways, region)
                )

            # Collect results
            for future in as_completed(futures):
                try:
                    result = future.result()
                    if result:
                        all_resources.extend(result)
                except Exception as e:
                    logger.error(f"Error in concurrent scan: {str(e)}")
                    self.errors.append({
                        'type': 'scan_error',
                        'message': str(e)
                    })

        # Scan global services (outside thread pool)
        try:
            all_resources.extend(s3_scanner.scan_buckets())
        except Exception as e:
            logger.error(f"Error scanning S3: {str(e)}")
            self.errors.append({'type': 'S3_scan_error', 'message': str(e)})

        try:
            all_resources.extend(iam_scanner.scan_users())
            all_resources.extend(iam_scanner.scan_roles())
        except Exception as e:
            logger.error(f"Error scanning IAM: {str(e)}")
            self.errors.append({'type': 'IAM_scan_error', 'message': str(e)})

        # Build summary
        summary = self._build_summary(all_resources)
        cost_summary = self._build_cost_summary(all_resources)

        scan_result = ScanResult(
            timestamp=datetime.utcnow().isoformat(),
            regions_scanned=regions,
            resources=all_resources,
            errors=self.errors,
            summary=summary,
            cost_summary=cost_summary,
        )

        logger.info(f"Scan completed in {(datetime.utcnow() - start_time).total_seconds():.2f}s")
        return scan_result

    def _build_summary(self, resources: List[ResourceMetadata]) -> Dict[str, Any]:
        """Build summary statistics from resources"""
        resource_type_count = {}
        region_count = {}
        state_count = {}

        for resource in resources:
            resource_type_count[resource.resource_type] = resource_type_count.get(resource.resource_type, 0) + 1
            region_count[resource.region] = region_count.get(resource.region, 0) + 1
            state_count[resource.state] = state_count.get(resource.state, 0) + 1

        return {
            'total_resources': len(resources),
            'by_type': resource_type_count,
            'by_region': region_count,
            'by_state': state_count,
        }

    def _build_cost_summary(self, resources: List[ResourceMetadata]) -> Dict[str, Any]:
        """Build cost summary from resources"""
        total_monthly = sum(
            r.estimated_cost_monthly or 0 for r in resources
        )

        by_type = {}
        for resource in resources:
            if resource.resource_type not in by_type:
                by_type[resource.resource_type] = 0
            by_type[resource.resource_type] += resource.estimated_cost_monthly or 0

        return {
            'estimated_monthly_total': round(total_monthly, 2),
            'by_resource_type': {k: round(v, 2) for k, v in by_type.items()},
        }

    def cleanup(self):
        """Cleanup resources"""
        self.session_manager.cleanup()


# ============================================================================
# USAGE EXAMPLE
# ============================================================================

if __name__ == "__main__":
    # Example usage
    try:
        # Initialize scanner with AWS credentials
        scanner = AWSResourceScanner(
            access_key_id='YOUR_ACCESS_KEY_ID',
            secret_access_key='YOUR_SECRET_ACCESS_KEY'
        )

        # Perform scan
        result = scanner.scan()

        # Output as JSON
        output = json.dumps(result.to_dict(), indent=2, default=str)
        print(output)

        # Cleanup
        scanner.cleanup()

    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        raise
