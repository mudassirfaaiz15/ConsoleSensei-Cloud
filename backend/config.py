"""
Configuration file for AWS Resource Tracker Backend
Environment-specific settings and defaults
"""

import os
from datetime import timedelta


class Config:
    """Base configuration"""

    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')
    JSON_SORT_KEYS = False

    # AWS
    AWS_MAX_WORKERS = int(os.environ.get('AWS_MAX_WORKERS', 5))
    AWS_REQUEST_TIMEOUT = int(os.environ.get('AWS_REQUEST_TIMEOUT', 30))
    AWS_MAX_RETRIES = int(os.environ.get('AWS_MAX_RETRIES', 3))

    # Scanning
    SCAN_CACHE_TTL = timedelta(hours=int(os.environ.get('SCAN_CACHE_TTL_HOURS', 1)))
    SCAN_TIMEOUT = int(os.environ.get('SCAN_TIMEOUT_SECONDS', 600))  # 10 minutes

    # Logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FILE = os.environ.get('LOG_FILE', 'aws_resource_tracker.log')

    # API
    API_VERSION = '1.0.0'
    API_PREFIX = '/api/v1'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max request size

    # JWT
    JWT_ALGORITHM = 'HS256'
    JWT_EXPIRATION = timedelta(hours=int(os.environ.get('JWT_EXPIRATION_HOURS', 24)))

    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')

    # Supported AWS Services
    SUPPORTED_SERVICES = {
        'ec2': {
            'name': 'EC2',
            'scanners': ['instances', 'volumes', 'elastic_ips'],
            'region_specific': True,
        },
        's3': {
            'name': 'S3',
            'scanners': ['buckets'],
            'region_specific': False,
        },
        'rds': {
            'name': 'RDS',
            'scanners': ['instances'],
            'region_specific': True,
        },
        'lambda': {
            'name': 'Lambda',
            'scanners': ['functions'],
            'region_specific': True,
        },
        'elbv2': {
            'name': 'Elastic Load Balancing',
            'scanners': ['load_balancers'],
            'region_specific': True,
        },
        'logs': {
            'name': 'CloudWatch Logs',
            'scanners': ['log_groups'],
            'region_specific': True,
        },
        'iam': {
            'name': 'IAM',
            'scanners': ['users', 'roles'],
            'region_specific': False,
        },
    }

    # Resource Types
    RESOURCE_TYPES = {
        'EC2_Instance',
        'EBS_Volume',
        'Elastic_IP',
        'S3_Bucket',
        'RDS_Instance',
        'Lambda_Function',
        'Load_Balancer',
        'CloudWatch_LogGroup',
        'NAT_Gateway',
        'IAM_User',
        'IAM_Role',
    }

    # Resource States
    RESOURCE_STATES = {
        'running',
        'stopped',
        'stopping',
        'starting',
        'terminated',
        'terminating',
        'pending',
        'available',
        'in-use',
        'deleting',
        'deleted',
        'creating',
        'active',
        'associated',
        'unassociated',
    }

    # Cost Estimation Defaults (monthly)
    COST_ESTIMATES = {
        'EC2_Instance': {
            't3.micro': 0.0116,
            't3.small': 0.0232,
            't3.medium': 0.0464,
            't3.large': 0.0928,
            't3.xlarge': 0.1856,
            't3.2xlarge': 0.3712,
            't3a.micro': 0.0104,
            't3a.small': 0.0208,
            't3a.medium': 0.0416,
            't3a.large': 0.0832,
            'm5.large': 0.096,
            'm5.xlarge': 0.192,
            'm5.2xlarge': 0.384,
            'c5.large': 0.085,
            'c5.xlarge': 0.170,
            'r5.large': 0.126,
            'r5.xlarge': 0.252,
        },
        'EBS_Volume': {
            'gp2': 0.1 / 30,  # $0.10 per GB-month, convert to per 1GB
            'gp3': 0.08 / 30,
            'io1': 0.125 / 30,
            'st1': 0.045 / 30,
            'sc1': 0.015 / 30,
        },
        'RDS_Instance': {
            'db.t3.micro': 0.017,
            'db.t3.small': 0.034,
            'db.t3.medium': 0.068,
            'db.t3.large': 0.136,
            'db.t3.xlarge': 0.272,
            'db.m5.large': 0.215,
            'db.m5.xlarge': 0.43,
        },
        'Load_Balancer': {
            'application': 16.2,  # $16.2 per month
            'network': 32.4,  # $32.4 per month
            'classic': 9,  # $9 per month (Classic LB)
        },
        'NAT_Gateway': 32.0,  # $32 per month
        'Elastic_IP': 3.6,  # $3.6 per month if unassociated
        'Lambda_Function': 0.2,  # Varies by invocations and duration
    }

    # Error Messages
    ERROR_MESSAGES = {
        'MISSING_CREDENTIALS': 'AWS credentials are required',
        'INVALID_CREDENTIALS': 'Invalid AWS credentials provided',
        'MISSING_RESOURCE_ID': 'Resource ID is required',
        'INVALID_ACTION': 'Invalid action. Must be stop or delete',
        'RESOURCE_NOT_FOUND': 'Resource not found',
        'INSUFFICIENT_PERMISSIONS': 'Insufficient permissions to perform action',
        'SCAN_TIMEOUT': 'Scan operation timed out',
        'SCAN_IN_PROGRESS': 'Another scan is already in progress',
    }


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False
    LOG_LEVEL = 'DEBUG'
    AWS_MAX_WORKERS = 2  # Fewer workers in development


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    LOG_LEVEL = 'INFO'
    AWS_MAX_WORKERS = 10  # More workers in production


class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    LOG_LEVEL = 'DEBUG'
    AWS_MAX_WORKERS = 1


def get_config(env: str = None) -> Config:
    """Get configuration based on environment"""
    env = env or os.environ.get('FLASK_ENV', 'development')

    if env == 'production':
        return ProductionConfig()
    elif env == 'testing':
        return TestingConfig()
    else:
        return DevelopmentConfig()


# Export default config
config = get_config()
