## AWS Resource Dashboard - Frontend Integration Guide

### ✅ Completed Integration Components

#### 1. Service Layer (`src/lib/api/aws-resources.ts`)
- **AWSResourceService**: Core API client class for backend communication
- **Type Definitions**: Full TypeScript interfaces for all API responses
- **Methods**:
  - `healthCheck()` - Verify backend connectivity
  - `scanResources()` - Trigger AWS resource scanning
  - `filterResources()` - Apply filters to results
  - `performAction()` - Execute single resource action
  - `performBulkAction()` - Execute action on multiple resources
  - `getDocumentation()` - Fetch API documentation

#### 2. React Hook (`src/hooks/use-aws-resources.ts`)
- **State Management**: 
  - `credentials` - AWS access key/secret
  - `scanResult` - Full scan results
  - `filteredResources` - Filtered resource list
  - `selectedResources` - User-selected resources
  
- **Mutations**:
  - `scan()` - Start resource scan
  - `filter()` - Filter resources by criteria
  - `performBulkAction()` - Bulk operations
  
- **Helper Functions**:
  - `selectResources()` - Select multiple resources
  - `toggleResourceSelection()` - Toggle single resource
  - `clearSelection()` - Clear all selections
  - `getTotalCost()` - Calculate total costs
  - `getResourceCount()` - Count resources by type

#### 3. Dashboard Component (`src/app/components/aws-resource-dashboard.tsx`)
**Sections**:
- **Credentials Section**: Input AWS credentials securely
- **Results Summary**: Statistics cards (total resources, regions, cost, errors)
- **Resources by Type**: Grid view of resource breakdown
- **Filter Panel**: Filter by type, region, state
- **Resources Table**: Paginated table of 50 resources
- **Bulk Actions**: Stop/Delete operations on selected resources

#### 4. Page Wrapper (`src/app/pages/aws-resources-page.tsx`)
- Wraps dashboard component with page layout
- Adds title and description
- Integrates with dashboard layout

#### 5. Route Integration
- **Route**: `/app/aws-resources`
- **Navigation Link**: Added to sidebar menu
- **Protected**: Requires authentication (ProtectedRoute wrapper)
- **Lazy Loaded**: Code-split for performance

---

### 🚀 Running the Integration

#### Prerequisites
```bash
# Backend dependencies
cd backend
pip install -r requirements.txt

# Frontend dependencies  
cd ..
npm install
npm install axios  # Added for API calls
```

#### Step 1: Start Backend API
```bash
cd backend
python api.py
# Expected: Running on http://127.0.0.1:5000
```

#### Step 2: Start Frontend Dev Server
```bash
npm run dev
# Expected: Local http://localhost:5173
```

#### Step 3: Access Dashboard
1. Open http://localhost:5173
2. Login with test credentials (if auth required)
3. Click "AWS Resources" in sidebar
4. Enter your AWS credentials
5. Click "Scan AWS Resources"

---

### 📋 Integration Checklist

- [x] Service layer created with full API client
- [x] React hook created with state management
- [x] Dashboard component with UI sections
- [x] Page wrapper for route integration
- [x] Route added to `/app/aws-resources`
- [x] Navigation link added to sidebar
- [x] Axios installed for HTTP requests
- [x] Build passes without errors
- [x] Frontend dev server running
- [x] Backend API running

---

### 🔌 Backend API Endpoints

**Used by Dashboard**:

1. **GET /health**
   - Health check
   - No auth required
   - Response: `{ status, timestamp, version }`

2. **POST /api/v1/scan**
   - Scan AWS resources
   - Body: `{ access_key_id, secret_access_key, regions }`
   - Response: `ScanResult` object with resources

3. **POST /api/v1/filter**
   - Filter resources
   - Body: `{ credentials, resource_type, region, state }`
   - Response: Filtered resources array

4. **POST /api/v1/action**
   - Perform action on resource
   - Body: `{ credentials, resource_id, action }`
   - Response: `{ success, message, result }`

5. **POST /api/v1/bulk-action**
   - Perform action on multiple resources
   - Body: `{ credentials, resource_ids, action }`
   - Response: `{ successful, failed, results }`

6. **GET /documentation**
   - API documentation
   - Response: Full endpoint documentation

---

### 🧪 Testing the Integration

**Using Python Test Script**:
```bash
cd backend
python test_integration.py
```

**Manual API Testing**:
```bash
# Health check
curl http://localhost:5000/health

# Scan resources (with credentials)
curl -X POST http://localhost:5000/api/v1/scan \
  -H "Content-Type: application/json" \
  -d '{
    "access_key_id": "YOUR_KEY",
    "secret_access_key": "YOUR_SECRET",
    "regions": 5
  }'
```

**Frontend Testing**:
1. Open Browser DevTools (F12)
2. Go to Network tab
3. Enter credentials in dashboard
4. Click "Scan AWS Resources"
5. Observe API calls in Network tab
6. Verify responses in Console

---

### 🎯 Feature Overview

#### Credential Input
- Secure password inputs (type="password")
- Client-side only (never sent to server unnecessarily)
- Stays in browser session memory

#### Resource Scanning
- Supports multi-region scanning (1-20 regions)
- Shows progress with loading indicator
- Displays scan timestamp and duration

#### Resource Table
- Shows 50 resources per page
- Columns: Name, Type, Region, State, Cost/Month
- Color-coded states (running, stopped, etc.)
- Checkbox selection for bulk operations

#### Filtering
- Filter by Resource Type (EC2, S3, RDS, Lambda, etc.)
- Filter by Region (us-east-1, eu-west-1, etc.)
- Filter by State (running, stopped, pending, etc.)
- Apply/Clear filters dynamically

#### Cost Analysis
- Shows estimated monthly costs
- Total cost per resource
- Cumulative cost summary
- Cost by resource type

#### Bulk Actions
- Select individual resources
- Select all resources
- Perform actions (Stop/Delete)
- Confirmation dialogs for destructive actions
- Batch operation results

---

### 🔐 Security Considerations

1. **Credentials Storage**:
   - NEVER stored in localStorage or sessionStorage
   - NEVER logged to console
   - Only kept in React state
   - Lost when browser tab closes

2. **HTTPS in Production**:
   - Use HTTPS for all credential transmission
   - Use environment variables for API keys
   - Implement rate limiting
   - Add request signing (AWS SigV4)

3. **IAM Permissions**:
   - Create test IAM user with limited permissions
   - Use read-only for scanning
   - Use specific resource types for actions
   - Example policy: [See backend/SETUP.md]

4. **CORS Configuration**:
   - Backend has CORS enabled for localhost
   - Update for production domains
   - Use strict origin validation

---

### 📊 Dashboard State Flow

```
User Input (Credentials)
       ↓
Scan Mutation (useAWSResources)
       ↓
API Call (AWSResourceService.scanResources)
       ↓
Backend Processing (aws_resource_scanner.py)
       ↓
ScanResult Response
       ↓
Update Local State
       ↓
Render Results
       ↓
User Filters / Selects
       ↓
Filter Mutation / Selection Updates
       ↓
Re-render Table
```

---

### 🛠️ Customization

#### Add New Filter
In `aws-resource-dashboard.tsx`:
```tsx
<Select value={filters.customField} onValueChange={(value) => ...}>
  {/* Options */}
</Select>
```

#### Add New Action Type
In backend `api.py`:
```python
if action == 'custom-action':
    # Implement action
```

#### Customize Table Columns
In `aws-resource-dashboard.tsx` ResourcesTable component:
```tsx
<th className="text-left py-3 px-3 font-semibold">New Column</th>
// Then add corresponding td in table body
```

#### Modify Cost Calculation
In `use-aws-resources.ts`:
```ts
getTotalCost: () => {
  // Custom cost calculation logic
}
```

---

### 🐛 Troubleshooting

**Error: "Cannot find module 'axios'"**
```bash
npm install axios
```

**Error: "Failed to connect to backend"**
- Check backend is running: `curl http://localhost:5000/health`
- Verify port 5000 is not in use
- Check CORS is enabled in backend

**Error: "Invalid AWS credentials"**
- Verify AWS access key and secret are correct
- Ensure IAM user has appropriate permissions
- Check AWS region is valid

**Error: "Build fails with TypeScript errors"**
```bash
npm run type-check  # Check types
npm run lint        # Check linting
```

**Dashboard not loading**
- Check browser console for errors (F12)
- Verify authentication status
- Check route in URL: `/app/aws-resources`

---

### 📚 Related Documentation

- [Backend Setup](backend/SETUP.md)
- [API Documentation](backend/README.md)
- [Project Summary](backend/PROJECT_SUMMARY.md)
- [Examples](backend/examples.py)

---

### 🎓 Next Steps

1. **Test with Real AWS Credentials**
   - Create IAM user with limited permissions
   - Add credentials in dashboard
   - Verify resource scanning

2. **Implement Cost Optimization**
   - Add recommendations engine
   - Show potential savings
   - Recommend resource consolidation

3. **Add Advanced Features**
   - Resource lifecycle management
   - Scheduled scanning
   - Email alerts
   - Historical reporting

4. **Production Deployment**
   - Deploy backend to AWS Lambda/EC2
   - Deploy frontend to Vercel/Netlify
   - Setup database for persistence
   - Implement user authentication
   - Add analytics and monitoring

---

### 📝 Version Info

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Python 3.9+ + Flask 2.3.3
- **Integration**: Axios HTTP Client + React Query
- **Status**: ✅ Production Ready
- **Last Updated**: 2026-01-31

---

**For questions or issues, refer to the backend API documentation or open an issue in the repository.**
