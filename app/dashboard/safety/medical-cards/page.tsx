'use client';

import { useState } from 'react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DriverSelector from '@/components/safety/DriverSelector';
import MedicalCardManager from '@/components/safety/drivers/MedicalCardManager';

export default function MedicalCardsPage() {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Medical Cards' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Medical Cards</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Manage Medical Cards</CardTitle>
            <CardDescription>Select a driver to view and manage their medical card information</CardDescription>
          </CardHeader>
        <CardContent className="space-y-4">
          <DriverSelector
            value={selectedDriverId}
            onValueChange={setSelectedDriverId}
            label="Select Driver"
            placeholder="Choose a driver to manage their medical cards"
          />
          {selectedDriverId && (
            <div className="mt-6">
              <MedicalCardManager driverId={selectedDriverId} />
            </div>
          )}
        </CardContent>
        </Card>
      </div>
    </>
  );
}

