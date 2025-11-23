'use client';

import { useState } from 'react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DriverSelector from '@/components/safety/DriverSelector';
import HOSDashboard from '@/components/safety/drivers/HOSDashboard';

export default function HOSPage() {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Hours of Service' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Hours of Service</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>HOS Monitoring</CardTitle>
            <CardDescription>Select a driver to view their HOS records and violations</CardDescription>
          </CardHeader>
        <CardContent className="space-y-4">
          <DriverSelector
            value={selectedDriverId}
            onValueChange={setSelectedDriverId}
            label="Select Driver"
            placeholder="Choose a driver to view their HOS records"
          />
          {selectedDriverId && (
            <div className="mt-6">
              <HOSDashboard driverId={selectedDriverId} />
            </div>
          )}
        </CardContent>
        </Card>
      </div>
    </>
  );
}

