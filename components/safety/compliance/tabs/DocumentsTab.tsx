'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DocumentUpload from '@/components/documents/DocumentUpload';
import DocumentList from '@/components/documents/DocumentListNew';

interface DocumentsTabProps {
  driverId: string;
}

export default function DocumentsTab({ driverId }: DocumentsTabProps) {
  const queryClient = useQueryClient();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    queryClient.invalidateQueries({ queryKey: ['driver-compliance'] });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>
            Upload files to this driver's profile (e.g., medical certificates, CDL copies, MVR
            records, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentUpload driverId={driverId} onSuccess={handleUploadSuccess} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Driver Documents</CardTitle>
          <CardDescription>View and manage all documents for this driver</CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentList key={refreshKey} driverId={driverId} />
        </CardContent>
      </Card>
    </div>
  );
}
