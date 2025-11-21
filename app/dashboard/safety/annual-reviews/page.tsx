'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DriverSelector from '@/components/safety/DriverSelector';
import AnnualReviewForm from '@/components/safety/drivers/AnnualReviewForm';

export default function AnnualReviewsPage() {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Annual Reviews</CardTitle>
          <CardDescription>Driver annual qualification reviews</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DriverSelector
            value={selectedDriverId}
            onValueChange={setSelectedDriverId}
            label="Select Driver"
            placeholder="Choose a driver to manage their annual reviews"
          />
          {selectedDriverId && (
            <div className="mt-6">
              <AnnualReviewForm driverId={selectedDriverId} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

