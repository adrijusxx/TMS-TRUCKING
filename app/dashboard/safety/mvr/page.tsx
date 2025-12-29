'use client';

import { useState } from 'react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DriverSelector from '@/components/safety/DriverSelector';
import MVRManager from '@/components/safety/drivers/MVRManager';

export default function MVRPage() {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Motor Vehicle Records' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Motor Vehicle Records</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>MVR Tracking</CardTitle>
            <CardDescription>Select a driver to view their MVR records and violations</CardDescription>
          </CardHeader>
        <CardContent className="space-y-4">
          <DriverSelector
            value={selectedDriverId}
            onValueChange={setSelectedDriverId}
            label="Select Driver"
            placeholder="Choose a driver to view their MVR records"
          />
          {selectedDriverId && (
            <div className="mt-6">
              <MVRManager driverId={selectedDriverId} />
            </div>
          )}
        </CardContent>
        </Card>
      </div>
    </>
  );
}

