'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocumentUpload from '@/components/documents/DocumentUpload';
import DocumentList from '@/components/documents/DocumentList';
import { FileText, Upload } from 'lucide-react';

interface DriverDocumentsProps {
  driverId: string;
}

export default function DriverDocuments({ driverId }: DriverDocumentsProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Card className="md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Driver Documents
        </CardTitle>
        <CardDescription>
          Upload and manage files associated with this driver profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="list" className="w-full">
          <TabsList>
            <TabsTrigger value="list">Documents</TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="mt-4">
            <DocumentList key={refreshKey} driverId={driverId} />
          </TabsContent>
          <TabsContent value="upload" className="mt-4">
            <DocumentUpload driverId={driverId} onSuccess={handleUploadSuccess} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

