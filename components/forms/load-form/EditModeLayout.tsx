'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadFormBasicStep } from './LoadFormBasicStep';
import { LoadFormRouteStep } from './LoadFormRouteStep';
import { LoadFormDetailsStep } from './LoadFormDetailsStep';

interface EditModeLayoutProps {
  basicStepProps: any;
  routeStepProps: any;
  detailsStepProps: any;
  isMultiStop: boolean;
}

export default function EditModeLayout({ basicStepProps, routeStepProps, detailsStepProps, isMultiStop }: EditModeLayoutProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Card className="shadow-sm">
        <CardHeader><CardTitle>Basic Information</CardTitle><CardDescription>Load number and customer</CardDescription></CardHeader>
        <CardContent className="space-y-4"><LoadFormBasicStep {...basicStepProps} /></CardContent>
      </Card>
      {!isMultiStop && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Route Information</CardTitle><CardDescription>Pickup and delivery details</CardDescription></CardHeader>
          <CardContent className="space-y-4"><LoadFormRouteStep {...routeStepProps} /></CardContent>
        </Card>
      )}
      <Card className="shadow-sm">
        <CardHeader><CardTitle>Load Details & Financial</CardTitle><CardDescription>Specifications and pricing</CardDescription></CardHeader>
        <CardContent className="space-y-4"><LoadFormDetailsStep {...detailsStepProps} /></CardContent>
      </Card>
    </div>
  );
}
