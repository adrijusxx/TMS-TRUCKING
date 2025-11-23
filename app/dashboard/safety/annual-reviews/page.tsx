'use client';

import { useState } from 'react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DriverSelector from '@/components/safety/DriverSelector';
import AnnualReviewForm from '@/components/safety/drivers/AnnualReviewForm';

export default function AnnualReviewsPage() {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Annual Reviews' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Annual Reviews</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Manage Annual Reviews</CardTitle>
            <CardDescription>Select a driver to view and manage their annual reviews</CardDescription>
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
    </>
  );
}

