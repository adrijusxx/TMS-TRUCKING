'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { MapPin, User, Truck } from 'lucide-react';

interface BreakdownOverviewTabProps {
  breakdown: any;
}

export default function BreakdownOverviewTab({ breakdown }: BreakdownOverviewTabProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Breakdown Information */}
      <Card>
        <CardHeader><CardTitle>Breakdown Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">Breakdown Type</Label>
            <div className="mt-1 font-medium">
              {breakdown.breakdownType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </div>
          </div>
          {breakdown.problem && (
            <div>
              <Label className="text-sm text-muted-foreground">Problem</Label>
              <div className="mt-1">{breakdown.problem}</div>
            </div>
          )}
          <div>
            <Label className="text-sm text-muted-foreground">Description</Label>
            <div className="mt-1 whitespace-pre-wrap">{breakdown.description}</div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Information */}
      <Card>
        <CardHeader><CardTitle>Vehicle</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-sm text-muted-foreground">Truck</Label>
            <div className="mt-1">
              <Link
                href={`/dashboard/trucks/${breakdown.truck.truckNumber || breakdown.truck.id}`}
                className="font-medium text-primary hover:underline flex items-center gap-2"
              >
                <Truck className="h-4 w-4" />
                {breakdown.truck.truckNumber}
              </Link>
              <div className="text-sm text-muted-foreground">
                {breakdown.truck.make} {breakdown.truck.model} ({breakdown.truck.year})
              </div>
            </div>
          </div>
          {breakdown.driver && (
            <div>
              <Label className="text-sm text-muted-foreground">Driver</Label>
              <div className="mt-1">
                <Link
                  href={`/dashboard/drivers/${breakdown.driver.driverNumber || breakdown.driver.id}`}
                  className="font-medium text-primary hover:underline flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  {breakdown.driver.user.firstName} {breakdown.driver.user.lastName}
                </Link>
                {breakdown.driver.user.phone && (
                  <div className="text-sm text-muted-foreground">{breakdown.driver.user.phone}</div>
                )}
              </div>
            </div>
          )}
          {breakdown.odometerReading && (
            <div>
              <Label className="text-sm text-muted-foreground">Odometer Reading</Label>
              <div className="mt-1 font-medium">{breakdown.odometerReading.toLocaleString()} miles</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader><CardTitle>Location</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <div className="font-medium">{breakdown.location}</div>
              {breakdown.address && (
                <div className="text-sm text-muted-foreground">{breakdown.address}</div>
              )}
              {(breakdown.city || breakdown.state) && (
                <div className="text-sm text-muted-foreground">
                  {breakdown.city && `${breakdown.city}, `}
                  {breakdown.state} {breakdown.zip}
                </div>
              )}
            </div>
          </div>
          {breakdown.latitude && breakdown.longitude && (
            <div className="text-xs text-muted-foreground">
              Coordinates: {breakdown.latitude.toFixed(4)}, {breakdown.longitude.toFixed(4)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Provider */}
      {breakdown.serviceProvider && (
        <Card>
          <CardHeader><CardTitle>Service Provider</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label className="text-sm text-muted-foreground">Provider</Label>
              <div className="mt-1 font-medium">{breakdown.serviceProvider}</div>
            </div>
            {breakdown.serviceContact && (
              <div>
                <Label className="text-sm text-muted-foreground">Contact</Label>
                <div className="mt-1">{breakdown.serviceContact}</div>
              </div>
            )}
            {breakdown.serviceAddress && (
              <div>
                <Label className="text-sm text-muted-foreground">Address</Label>
                <div className="mt-1">{breakdown.serviceAddress}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
