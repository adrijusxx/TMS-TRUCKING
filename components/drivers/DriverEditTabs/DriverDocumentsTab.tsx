'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DriverDocumentsTabProps {
  driver: any;
}

export default function DriverDocumentsTab({ driver }: DriverDocumentsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>Manage driver documents</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Documents management coming soon...</p>
      </CardContent>
    </Card>
  );
}

