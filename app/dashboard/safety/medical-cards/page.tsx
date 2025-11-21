'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DriverSelector from '@/components/safety/DriverSelector';
import MedicalCardManager from '@/components/safety/drivers/MedicalCardManager';

export default function MedicalCardsPage() {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Medical Cards</CardTitle>
          <CardDescription>Manage driver medical card records</CardDescription>
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
  );
}

