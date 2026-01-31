/**
 * AWS Resources Page
 * Main page wrapper for AWS Resource Dashboard
 */

import React from 'react';
import { AWSResourceDashboard } from '@/app/components/aws-resource-dashboard';

export function AWSResourcesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AWS Resources</h1>
        <p className="text-muted-foreground mt-2">
          Scan, view, filter, and manage your AWS resources across multiple
          regions
        </p>
      </div>
      <AWSResourceDashboard />
    </div>
  );
}

export default AWSResourcesPage;
