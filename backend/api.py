"""
REST API Layer - Flask implementation
Provides endpoints for AWS resource scanning and management
"""

import os
import json
import logging
from typing import Dict, Any, Tuple
from functools import wraps
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt

from aws_resource_scanner import AWSResourceScanner, ScanResult
from resource_manager import ResourceActionExecutor, ActionType


# ============================================================================
# CONFIGURATION
# ============================================================================

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['JWT_ALGORITHM'] = 'HS256'

logger = logging.getLogger(__name__)


# ============================================================================
# AUTHENTICATION & SECURITY
# ============================================================================

def require_api_key(f):
    """Decorator to require valid API key or JWT token"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None

        # Check for token in header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'error': 'Invalid authorization header'}), 401

        if not token:
            # Check for API key
            api_key = request.headers.get('X-API-Key')
            if not api_key:
                return jsonify({'error': 'Missing authentication'}), 401

            # Validate API key (implement your validation logic)
            if not validate_api_key(api_key):
                return jsonify({'error': 'Invalid API key'}), 401
        else:
            # Validate JWT token
            try:
                jwt.decode(token, app.config['SECRET_KEY'], algorithms=[app.config['JWT_ALGORITHM']])
            except jwt.InvalidTokenError:
                return jsonify({'error': 'Invalid token'}), 401

        return f(*args, **kwargs)

    return decorated_function


def validate_api_key(api_key: str) -> bool:
    """
    Validate API key
    Implement your API key validation logic here
    """
    valid_keys = os.environ.get('VALID_API_KEYS', '').split(',')
    return api_key in valid_keys


def extract_credentials_from_request() -> Tuple[str, str]:
    """Extract AWS credentials from request"""
    data = request.get_json() or {}

    access_key = data.get('access_key_id') or request.headers.get('X-AWS-Access-Key')
    secret_key = data.get('secret_access_key') or request.headers.get('X-AWS-Secret-Key')

    if not access_key or not secret_key:
        raise ValueError("AWS credentials missing from request")

    return access_key, secret_key


# ============================================================================
# ENDPOINTS
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'AWS Resource Tracker',
        'version': '1.0.0',
    }), 200


@app.route('/api/v1/scan', methods=['POST'])
@require_api_key
def scan_resources():
    """
    Scan AWS resources across all regions
    
    Request body:
    {
        "access_key_id": "YOUR_ACCESS_KEY",
        "secret_access_key": "YOUR_SECRET_KEY",
        "max_workers": 5  (optional, default 5)
    }
    
    Response:
    {
        "success": true,
        "timestamp": "2024-01-01T12:00:00",
        "regions_scanned": [...],
        "resources": [...],
        "summary": {...},
        "cost_summary": {...},
        "errors": [...]
    }
    """
    try:
        # Extract credentials
        access_key, secret_key = extract_credentials_from_request()

        # Get optional parameters
        data = request.get_json() or {}
        max_workers = int(data.get('max_workers', 5))

        # Initialize scanner
        scanner = AWSResourceScanner(access_key, secret_key)

        # Perform scan
        result = scanner.scan(max_workers=max_workers)

        # Cleanup
        scanner.cleanup()

        # Return result
        return jsonify({
            'success': True,
            'data': result.to_dict(),
        }), 200

    except ValueError as e:
        logger.warning(f"Invalid request: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
        }), 400

    except Exception as e:
        logger.error(f"Scan error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error during scan',
            'details': str(e) if os.environ.get('DEBUG') else None,
        }), 500


@app.route('/api/v1/resources', methods=['GET'])
@require_api_key
def get_resources():
    """
    Get scanned resources (requires previous scan result in cache)
    
    Query parameters:
    - resource_type: Filter by resource type
    - region: Filter by region
    - state: Filter by state
    """
    try:
        # This would typically retrieve from cache/database
        # For now, returning instruction to use /scan endpoint
        return jsonify({
            'message': 'Please use POST /api/v1/scan to scan resources',
            'docs': '/api/v1/docs',
        }), 200

    except Exception as e:
        logger.error(f"Error retrieving resources: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve resources',
        }), 500


@app.route('/api/v1/resources/filter', methods=['POST'])
@require_api_key
def filter_resources():
    """
    Filter resources from scan result
    
    Request body:
    {
        "resources": [...],  // Result from /scan endpoint
        "filters": {
            "resource_type": "EC2_Instance",
            "region": "us-east-1",
            "state": "running",
            "tags": {"Environment": "production"}
        }
    }
    """
    try:
        data = request.get_json() or {}
        resources = data.get('resources', [])
        filters = data.get('filters', {})

        filtered = resources

        # Apply filters
        if 'resource_type' in filters:
            filtered = [r for r in filtered if r.get('resource_type') == filters['resource_type']]

        if 'region' in filters:
            filtered = [r for r in filtered if r.get('region') == filters['region']]

        if 'state' in filters:
            filtered = [r for r in filtered if r.get('state') == filters['state']]

        if 'tags' in filters:
            tag_filters = filters['tags']
            filtered = [
                r for r in filtered
                if all(r.get('tags', {}).get(k) == v for k, v in tag_filters.items())
            ]

        return jsonify({
            'success': True,
            'total': len(filtered),
            'resources': filtered,
        }), 200

    except Exception as e:
        logger.error(f"Filtering error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to filter resources',
        }), 500


@app.route('/api/v1/resources/action', methods=['POST'])
@require_api_key
def perform_resource_action():
    """
    Perform action on resource (stop/delete)
    
    Request body:
    {
        "access_key_id": "YOUR_ACCESS_KEY",
        "secret_access_key": "YOUR_SECRET_KEY",
        "resource_id": "i-1234567890abcdef0",
        "resource_type": "EC2_Instance",
        "region": "us-east-1",
        "action": "stop"  // or "delete"
    }
    
    Response:
    {
        "success": true,
        "resource_id": "...",
        "action": "stop",
        "message": "...",
        "verification_status": "verified"
    }
    """
    try:
        # Extract credentials
        access_key, secret_key = extract_credentials_from_request()

        data = request.get_json() or {}
        resource_id = data.get('resource_id')
        resource_type = data.get('resource_type')
        region = data.get('region')
        action_str = data.get('action', '').lower()

        # Validate request
        if not all([resource_id, resource_type, region, action_str]):
            return jsonify({
                'success': False,
                'error': 'Missing required fields: resource_id, resource_type, region, action',
            }), 400

        # Convert action string to enum
        try:
            action = ActionType[action_str.upper()]
        except KeyError:
            return jsonify({
                'success': False,
                'error': f'Invalid action. Supported: {", ".join([a.value for a in ActionType])}',
            }), 400

        # Import session manager here to avoid circular imports
        from aws_resource_scanner import AWSSessionManager

        # Initialize session and executor
        session_manager = AWSSessionManager(access_key, secret_key)
        executor = ResourceActionExecutor(session_manager)

        # Execute action
        result = executor.execute_action(resource_type, resource_id, region, action)

        # Cleanup
        session_manager.cleanup()

        # Return result
        return jsonify({
            'success': result.success,
            'resource_id': result.resource_id,
            'resource_type': result.resource_type,
            'action': result.action,
            'message': result.message,
            'verification_status': result.verification_status,
            'error': result.error,
        }), 200 if result.success else 400

    except ValueError as e:
        logger.warning(f"Invalid request: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
        }), 400

    except Exception as e:
        logger.error(f"Action execution error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'details': str(e) if os.environ.get('DEBUG') else None,
        }), 500


@app.route('/api/v1/resources/bulk-action', methods=['POST'])
@require_api_key
def perform_bulk_action():
    """
    Perform action on multiple resources
    
    Request body:
    {
        "access_key_id": "YOUR_ACCESS_KEY",
        "secret_access_key": "YOUR_SECRET_KEY",
        "actions": [
            {
                "resource_id": "i-xxx",
                "resource_type": "EC2_Instance",
                "region": "us-east-1",
                "action": "stop"
            },
            ...
        ]
    }
    """
    try:
        from aws_resource_scanner import AWSSessionManager

        # Extract credentials
        access_key, secret_key = extract_credentials_from_request()

        data = request.get_json() or {}
        actions_list = data.get('actions', [])

        if not actions_list:
            return jsonify({
                'success': False,
                'error': 'No actions provided',
            }), 400

        # Initialize session and executor
        session_manager = AWSSessionManager(access_key, secret_key)
        executor = ResourceActionExecutor(session_manager)

        results = []
        for action_data in actions_list:
            try:
                resource_id = action_data.get('resource_id')
                resource_type = action_data.get('resource_type')
                region = action_data.get('region')
                action_str = action_data.get('action', '').lower()

                action = ActionType[action_str.upper()]

                result = executor.execute_action(resource_type, resource_id, region, action)
                results.append({
                    'resource_id': result.resource_id,
                    'success': result.success,
                    'message': result.message,
                })
            except Exception as e:
                logger.error(f"Error in bulk action: {str(e)}")
                results.append({
                    'resource_id': action_data.get('resource_id'),
                    'success': False,
                    'message': str(e),
                })

        # Cleanup
        session_manager.cleanup()

        return jsonify({
            'success': True,
            'total_actions': len(results),
            'successful': sum(1 for r in results if r['success']),
            'failed': sum(1 for r in results if not r['success']),
            'results': results,
        }), 200

    except ValueError as e:
        logger.warning(f"Invalid request: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
        }), 400

    except Exception as e:
        logger.error(f"Bulk action error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
        }), 500


@app.route('/api/v1/docs', methods=['GET'])
def api_documentation():
    """API documentation"""
    return jsonify({
        'service': 'AWS Resource Tracker API',
        'version': '1.0.0',
        'endpoints': {
            'health': {
                'method': 'GET',
                'path': '/health',
                'description': 'Health check',
            },
            'scan': {
                'method': 'POST',
                'path': '/api/v1/scan',
                'description': 'Scan AWS resources',
                'requires_auth': True,
            },
            'filter': {
                'method': 'POST',
                'path': '/api/v1/resources/filter',
                'description': 'Filter scanned resources',
                'requires_auth': True,
            },
            'action': {
                'method': 'POST',
                'path': '/api/v1/resources/action',
                'description': 'Perform action on resource',
                'requires_auth': True,
            },
            'bulk_action': {
                'method': 'POST',
                'path': '/api/v1/resources/bulk-action',
                'description': 'Perform action on multiple resources',
                'requires_auth': True,
            },
        },
        'authentication': {
            'api_key': 'X-API-Key header',
            'jwt': 'Authorization: Bearer <token>',
        },
    }), 200


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found',
        'docs': '/api/v1/docs',
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        'success': False,
        'error': 'Internal server error',
    }), 500


# ============================================================================
# APPLICATION INITIALIZATION
# ============================================================================

def create_app():
    """Application factory"""
    return app


if __name__ == '__main__':
    # Configuration
    debug = os.environ.get('FLASK_ENV') == 'development'
    port = int(os.environ.get('PORT', 5000))

    # Run server
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug,
    )
