'use client';

import { useState } from 'react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DriverSelector from '@/components/safety/DriverSelector';
import DrugTestManager from '@/components/safety/drivers/DrugTestManager';

export default function DrugTestsPage() {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Drug & Alcohol Tests' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Drug & Alcohol Tests</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Manage Drug Tests</CardTitle>
            <CardDescription>Select a driver to view and manage their drug test records</CardDescription>
          </CardHeader>
        <CardContent className="space-y-4">
          <DriverSelector
            value={selectedDriverId}
            onValueChange={setSelectedDriverId}
            label="Select Driver"
            placeholder="Choose a driver to manage their drug test records"
          />
          {selectedDriverId && (
            <div className="mt-6">
              <DrugTestManager driverId={selectedDriverId} />
            </div>
          )}
        </CardContent>
        </Card>
      </div>
    </>
  );
}

