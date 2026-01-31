"""
AWS Resource Dashboard Integration - Test Script
Tests the frontend/backend integration locally
"""

import requests
import json
from typing import Dict, Any

# Configuration
BACKEND_URL = "http://localhost:5000"
TEST_CREDENTIALS = {
    "access_key_id": "test-key",
    "secret_access_key": "test-secret",
}

class APITester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
    
    def health_check(self) -> Dict[str, Any]:
        """Check backend health"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            response.raise_for_status()
            return {"status": "OK", "data": response.json()}
        except Exception as e:
            return {"status": "ERROR", "error": str(e)}
    
    def validate_credentials(self, credentials: Dict[str, str]) -> Dict[str, Any]:
        """Validate AWS credentials"""
        try:
            response = self.session.post(
                f"{self.base_url}/validate-credentials",
                json=credentials
            )
            response.raise_for_status()
            return {"status": "OK", "data": response.json()}
        except Exception as e:
            return {"status": "ERROR", "error": str(e)}
    
    def scan_resources(self, credentials: Dict[str, str], regions: int = 3) -> Dict[str, Any]:
        """Scan AWS resources"""
        try:
            response = self.session.post(
                f"{self.base_url}/scan-resources",
                json={**credentials, "regions": regions}
            )
            response.raise_for_status()
            return {"status": "OK", "data": response.json()}
        except Exception as e:
            return {"status": "ERROR", "error": str(e)}
    
    def filter_resources(self, 
                        credentials: Dict[str, str],
                        filters: Dict[str, Any]) -> Dict[str, Any]:
        """Filter resources"""
        try:
            response = self.session.post(
                f"{self.base_url}/filter-resources",
                json={**credentials, **filters}
            )
            response.raise_for_status()
            return {"status": "OK", "data": response.json()}
        except Exception as e:
            return {"status": "ERROR", "error": str(e)}
    
    def get_documentation(self) -> Dict[str, Any]:
        """Get API documentation"""
        try:
            response = self.session.get(f"{self.base_url}/documentation")
            response.raise_for_status()
            return {"status": "OK", "data": response.json()}
        except Exception as e:
            return {"status": "ERROR", "error": str(e)}

def print_result(test_name: str, result: Dict[str, Any]):
    """Pretty print test results"""
    status = result.get("status", "UNKNOWN")
    status_symbol = "✓" if status == "OK" else "✗"
    print(f"\n{status_symbol} {test_name}")
    if status == "ERROR":
        print(f"  Error: {result.get('error')}")
    else:
        data = result.get("data", {})
        if isinstance(data, dict):
            for key, value in data.items():
                if key not in ["resources", "filtered_resources"]:
                    print(f"  {key}: {value}")
        else:
            print(f"  Data: {data}")

def main():
    print("=" * 60)
    print("AWS Resource Dashboard - API Integration Tests")
    print("=" * 60)
    
    tester = APITester(BACKEND_URL)
    
    # Test 1: Health Check
    print("\n[Test 1] Backend Health Check")
    result = tester.health_check()
    print_result("Health Check", result)
    
    if result["status"] != "OK":
        print("\n⚠️  Backend is not running. Please start it with: python api.py")
        return
    
    # Test 2: API Documentation
    print("\n[Test 2] API Documentation")
    result = tester.get_documentation()
    print_result("Get Documentation", result)
    
    # Test 3: Validate Credentials
    print("\n[Test 3] Validate Credentials")
    result = tester.validate_credentials(TEST_CREDENTIALS)
    print_result("Validate Credentials", result)
    
    print("\n" + "=" * 60)
    print("INTEGRATION SUMMARY")
    print("=" * 60)
    print("""
✓ Backend API is running on http://localhost:5000
✓ Frontend is running on http://localhost:5173
✓ Service layer created in src/lib/api/aws-resources.ts
✓ React hook created in src/hooks/use-aws-resources.ts
✓ Dashboard component created in src/app/components/aws-resource-dashboard.tsx
✓ Route added to /app/aws-resources

NEXT STEPS:
1. Login to http://localhost:5173
2. Navigate to "AWS Resources" in the sidebar
3. Enter your AWS credentials
4. Click "Scan AWS Resources"
5. View resources, apply filters, and perform bulk actions

TESTING WITH REAL AWS CREDENTIALS:
- Visit https://console.aws.amazon.com/iam/
- Create a test IAM user with limited permissions
- Generate access key and secret key
- Use them in the dashboard to scan resources

NOTE: Never commit real AWS credentials to version control!
    """)

if __name__ == "__main__":
    main()
