'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DriverRecruitingTabProps {
  driver: any;
}

export default function DriverRecruitingTab({ driver }: DriverRecruitingTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recruiting</CardTitle>
        <CardDescription>Recruiting information and history</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Recruiting information coming soon...</p>
      </CardContent>
    </Card>
  );
}

