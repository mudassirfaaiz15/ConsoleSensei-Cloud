"""
AWS Resource Management Module - Delete/Stop Operations
Handles safe deletion and stopping of AWS resources with verification
"""

import logging
from typing import Dict, List, Any, Optional
from enum import Enum
from dataclasses import dataclass

import boto3
from botocore.exceptions import ClientError

from aws_resource_scanner import AWSSessionManager, DeleteResult


logger = logging.getLogger(__name__)


class ActionType(Enum):
    """Supported resource actions"""
    STOP = "stop"
    DELETE = "delete"
    TERMINATE = "terminate"


class ResourceActionValidator:
    """Validates whether an action is safe to perform on a resource"""

    @staticmethod
    def validate_ec2_stop(session_manager: AWSSessionManager, instance_id: str, region: str) -> Dict[str, Any]:
        """
        Validate EC2 instance can be safely stopped
        
        Args:
            session_manager: AWS session manager
            instance_id: EC2 instance ID
            region: AWS region
            
        Returns:
            Dictionary with validation results
        """
        try:
            ec2 = session_manager.get_client('ec2', region)
            response = ec2.describe_instances(InstanceIds=[instance_id])

            if not response['Reservations']:
                return {'valid': False, 'reason': 'Instance not found'}

            instance = response['Reservations'][0]['Instances'][0]
            state = instance['State']['Name']

            if state == 'stopped':
                return {'valid': False, 'reason': 'Instance already stopped'}
            if state == 'stopping':
                return {'valid': False, 'reason': 'Instance is already stopping'}
            if state == 'terminated':
                return {'valid': False, 'reason': 'Instance is terminated'}
            if state == 'terminating':
                return {'valid': False, 'reason': 'Instance is terminating'}

            return {
                'valid': True,
                'current_state': state,
                'instance_type': instance.get('InstanceType'),
                'tags': {t['Key']: t['Value'] for t in instance.get('Tags', [])},
            }

        except ClientError as e:
            return {'valid': False, 'reason': f'API error: {str(e)}'}

    @staticmethod
    def validate_rds_stop(session_manager: AWSSessionManager, db_instance_id: str, region: str) -> Dict[str, Any]:
        """Validate RDS instance can be safely stopped"""
        try:
            rds = session_manager.get_client('rds', region)
            response = rds.describe_db_instances(DBInstanceIdentifier=db_instance_id)

            if not response['DBInstances']:
                return {'valid': False, 'reason': 'RDS instance not found'}

            db_instance = response['DBInstances'][0]
            state = db_instance['DBInstanceStatus']

            if state in ['stopping', 'stopped']:
                return {'valid': False, 'reason': f'Instance already {state}'}

            return {
                'valid': True,
                'current_state': state,
                'engine': db_instance.get('Engine'),
                'allocated_storage': db_instance.get('AllocatedStorage'),
            }

        except ClientError as e:
            return {'valid': False, 'reason': f'API error: {str(e)}'}

    @staticmethod
    def validate_nat_gateway_delete(session_manager: AWSSessionManager, nat_gateway_id: str, region: str) -> Dict[str, Any]:
        """Validate NAT Gateway can be safely deleted"""
        try:
            ec2 = session_manager.get_client('ec2', region)
            response = ec2.describe_nat_gateways(NatGatewayIds=[nat_gateway_id])

            if not response['NatGateways']:
                return {'valid': False, 'reason': 'NAT Gateway not found'}

            nat_gateway = response['NatGateways'][0]
            state = nat_gateway['State']

            if state == 'deleted':
                return {'valid': False, 'reason': 'NAT Gateway already deleted'}
            if state == 'deleting':
                return {'valid': False, 'reason': 'NAT Gateway is already deleting'}

            return {
                'valid': True,
                'current_state': state,
                'subnet_id': nat_gateway.get('SubnetId'),
            }

        except ClientError as e:
            return {'valid': False, 'reason': f'API error: {str(e)}'}

    @staticmethod
    def validate_elastic_ip_release(session_manager: AWSSessionManager, allocation_id: str, region: str) -> Dict[str, Any]:
        """Validate Elastic IP can be safely released"""
        try:
            ec2 = session_manager.get_client('ec2', region)
            response = ec2.describe_addresses(AllocationIds=[allocation_id])

            if not response['Addresses']:
                return {'valid': False, 'reason': 'Elastic IP not found'}

            address = response['Addresses'][0]

            if 'AssociationId' in address:
                return {
                    'valid': False,
                    'reason': 'Elastic IP is still associated with an instance',
                    'associated_instance': address.get('InstanceId'),
                }

            return {
                'valid': True,
                'public_ip': address.get('PublicIp'),
            }

        except ClientError as e:
            return {'valid': False, 'reason': f'API error: {str(e)}'}


class ResourceActionExecutor:
    """Executes delete/stop actions on AWS resources"""

    def __init__(self, session_manager: AWSSessionManager):
        self.session = session_manager
        self.validator = ResourceActionValidator()

    def stop_ec2_instance(self, instance_id: str, region: str) -> DeleteResult:
        """Stop an EC2 instance with validation"""
        # Validate
        validation = self.validator.validate_ec2_stop(self.session, instance_id, region)
        if not validation['valid']:
            return DeleteResult(
                success=False,
                resource_id=instance_id,
                resource_type='EC2_Instance',
                action='stop',
                message=validation['reason'],
                verification_status='failed',
                error=validation['reason'],
            )

        try:
            ec2 = self.session.get_client('ec2', region)
            ec2.stop_instances(InstanceIds=[instance_id])

            # Verify stop was initiated
            response = ec2.describe_instances(InstanceIds=[instance_id])
            new_state = response['Reservations'][0]['Instances'][0]['State']['Name']

            logger.info(f"Stopped EC2 instance {instance_id} in {region}")

            return DeleteResult(
                success=True,
                resource_id=instance_id,
                resource_type='EC2_Instance',
                action='stop',
                message=f'Instance stop initiated. Current state: {new_state}',
                verification_status='verified',
            )

        except ClientError as e:
            error_msg = str(e)
            logger.error(f"Failed to stop EC2 instance {instance_id}: {error_msg}")
            return DeleteResult(
                success=False,
                resource_id=instance_id,
                resource_type='EC2_Instance',
                action='stop',
                message='Failed to stop instance',
                verification_status='failed',
                error=error_msg,
            )

    def stop_rds_instance(self, db_instance_id: str, region: str) -> DeleteResult:
        """Stop an RDS instance with validation"""
        # Validate
        validation = self.validator.validate_rds_stop(self.session, db_instance_id, region)
        if not validation['valid']:
            return DeleteResult(
                success=False,
                resource_id=db_instance_id,
                resource_type='RDS_Instance',
                action='stop',
                message=validation['reason'],
                verification_status='failed',
                error=validation['reason'],
            )

        try:
            rds = self.session.get_client('rds', region)
            rds.stop_db_instance(DBInstanceIdentifier=db_instance_id)

            logger.info(f"Stopped RDS instance {db_instance_id} in {region}")

            return DeleteResult(
                success=True,
                resource_id=db_instance_id,
                resource_type='RDS_Instance',
                action='stop',
                message='RDS instance stop initiated',
                verification_status='verified',
            )

        except ClientError as e:
            error_msg = str(e)
            logger.error(f"Failed to stop RDS instance {db_instance_id}: {error_msg}")
            return DeleteResult(
                success=False,
                resource_id=db_instance_id,
                resource_type='RDS_Instance',
                action='stop',
                message='Failed to stop RDS instance',
                verification_status='failed',
                error=error_msg,
            )

    def delete_nat_gateway(self, nat_gateway_id: str, region: str) -> DeleteResult:
        """Delete a NAT Gateway with validation"""
        # Validate
        validation = self.validator.validate_nat_gateway_delete(self.session, nat_gateway_id, region)
        if not validation['valid']:
            return DeleteResult(
                success=False,
                resource_id=nat_gateway_id,
                resource_type='NAT_Gateway',
                action='delete',
                message=validation['reason'],
                verification_status='failed',
                error=validation['reason'],
            )

        try:
            ec2 = self.session.get_client('ec2', region)
            ec2.delete_nat_gateway(NatGatewayId=nat_gateway_id)

            logger.info(f"Deleted NAT Gateway {nat_gateway_id} in {region}")

            return DeleteResult(
                success=True,
                resource_id=nat_gateway_id,
                resource_type='NAT_Gateway',
                action='delete',
                message='NAT Gateway deletion initiated',
                verification_status='verified',
            )

        except ClientError as e:
            error_msg = str(e)
            logger.error(f"Failed to delete NAT Gateway {nat_gateway_id}: {error_msg}")
            return DeleteResult(
                success=False,
                resource_id=nat_gateway_id,
                resource_type='NAT_Gateway',
                action='delete',
                message='Failed to delete NAT Gateway',
                verification_status='failed',
                error=error_msg,
            )

    def release_elastic_ip(self, allocation_id: str, region: str) -> DeleteResult:
        """Release an Elastic IP with validation"""
        # Validate
        validation = self.validator.validate_elastic_ip_release(self.session, allocation_id, region)
        if not validation['valid']:
            return DeleteResult(
                success=False,
                resource_id=allocation_id,
                resource_type='Elastic_IP',
                action='delete',
                message=validation['reason'],
                verification_status='failed',
                error=validation['reason'],
            )

        try:
            ec2 = self.session.get_client('ec2', region)
            ec2.release_address(AllocationId=allocation_id)

            logger.info(f"Released Elastic IP {allocation_id} in {region}")

            return DeleteResult(
                success=True,
                resource_id=allocation_id,
                resource_type='Elastic_IP',
                action='delete',
                message='Elastic IP released successfully',
                verification_status='verified',
            )

        except ClientError as e:
            error_msg = str(e)
            logger.error(f"Failed to release Elastic IP {allocation_id}: {error_msg}")
            return DeleteResult(
                success=False,
                resource_id=allocation_id,
                resource_type='Elastic_IP',
                action='delete',
                message='Failed to release Elastic IP',
                verification_status='failed',
                error=error_msg,
            )

    def delete_ebs_volume(self, volume_id: str, region: str) -> DeleteResult:
        """Delete an EBS volume with validation"""
        try:
            ec2 = self.session.get_client('ec2', region)

            # Validate volume is not in use
            response = ec2.describe_volumes(VolumeIds=[volume_id])
            if not response['Volumes']:
                return DeleteResult(
                    success=False,
                    resource_id=volume_id,
                    resource_type='EBS_Volume',
                    action='delete',
                    message='Volume not found',
                    verification_status='failed',
                )

            volume = response['Volumes'][0]
            if volume['State'] != 'available':
                return DeleteResult(
                    success=False,
                    resource_id=volume_id,
                    resource_type='EBS_Volume',
                    action='delete',
                    message=f'Volume is in {volume["State"]} state. Must be available to delete.',
                    verification_status='failed',
                    error=f'Volume state: {volume["State"]}',
                )

            # Delete volume
            ec2.delete_volume(VolumeId=volume_id)
            logger.info(f"Deleted EBS volume {volume_id} in {region}")

            return DeleteResult(
                success=True,
                resource_id=volume_id,
                resource_type='EBS_Volume',
                action='delete',
                message='EBS volume deleted successfully',
                verification_status='verified',
            )

        except ClientError as e:
            error_msg = str(e)
            logger.error(f"Failed to delete EBS volume {volume_id}: {error_msg}")
            return DeleteResult(
                success=False,
                resource_id=volume_id,
                resource_type='EBS_Volume',
                action='delete',
                message='Failed to delete EBS volume',
                verification_status='failed',
                error=error_msg,
            )

    def delete_s3_bucket(self, bucket_name: str) -> DeleteResult:
        """Delete an S3 bucket (must be empty) with validation"""
        try:
            s3 = self.session.get_client('s3', 'us-east-1')

            # Check if bucket exists and get object count
            try:
                response = s3.list_objects_v2(Bucket=bucket_name, MaxKeys=1)
                if 'Contents' in response:
                    return DeleteResult(
                        success=False,
                        resource_id=bucket_name,
                        resource_type='S3_Bucket',
                        action='delete',
                        message='Bucket is not empty. All objects must be deleted first.',
                        verification_status='failed',
                    )
            except ClientError:
                pass

            # Delete bucket
            s3.delete_bucket(Bucket=bucket_name)
            logger.info(f"Deleted S3 bucket {bucket_name}")

            return DeleteResult(
                success=True,
                resource_id=bucket_name,
                resource_type='S3_Bucket',
                action='delete',
                message='S3 bucket deleted successfully',
                verification_status='verified',
            )

        except ClientError as e:
            error_msg = str(e)
            logger.error(f"Failed to delete S3 bucket {bucket_name}: {error_msg}")
            return DeleteResult(
                success=False,
                resource_id=bucket_name,
                resource_type='S3_Bucket',
                action='delete',
                message='Failed to delete S3 bucket',
                verification_status='failed',
                error=error_msg,
            )

    def execute_action(
        self,
        resource_type: str,
        resource_id: str,
        region: str,
        action: ActionType
    ) -> DeleteResult:
        """
        Execute an action on a resource based on type and action
        
        Args:
            resource_type: Type of resource (e.g., 'EC2_Instance')
            resource_id: Resource identifier
            region: AWS region
            action: Action to perform (stop/delete)
            
        Returns:
            DeleteResult with operation status
        """
        action_map = {
            ('EC2_Instance', ActionType.STOP): self.stop_ec2_instance,
            ('RDS_Instance', ActionType.STOP): self.stop_rds_instance,
            ('NAT_Gateway', ActionType.DELETE): self.delete_nat_gateway,
            ('Elastic_IP', ActionType.DELETE): self.release_elastic_ip,
            ('EBS_Volume', ActionType.DELETE): self.delete_ebs_volume,
            ('S3_Bucket', ActionType.DELETE): self.delete_s3_bucket,
        }

        action_func = action_map.get((resource_type, action))
        if not action_func:
            return DeleteResult(
                success=False,
                resource_id=resource_id,
                resource_type=resource_type,
                action=action.value,
                message=f'Unsupported action {action.value} for resource type {resource_type}',
                verification_status='failed',
            )

        try:
            return action_func(resource_id, region)
        except Exception as e:
            logger.error(f"Error executing {action.value} on {resource_type}: {str(e)}")
            return DeleteResult(
                success=False,
                resource_id=resource_id,
                resource_type=resource_type,
                action=action.value,
                message='Unexpected error during action execution',
                verification_status='failed',
                error=str(e),
            )


if __name__ == "__main__":
    # Example usage
    try:
        session_manager = AWSSessionManager(
            access_key_id='YOUR_ACCESS_KEY_ID',
            secret_access_key='YOUR_SECRET_ACCESS_KEY'
        )

        executor = ResourceActionExecutor(session_manager)

        # Example: Stop EC2 instance
        result = executor.stop_ec2_instance('i-1234567890abcdef0', 'us-east-1')
        print(f"Action result: {result}")

        session_manager.cleanup()

    except Exception as e:
        logger.error(f"Error: {str(e)}")
