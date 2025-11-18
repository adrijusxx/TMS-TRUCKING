'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatDateTime } from '@/lib/utils';
import { DriverStatus, PayType } from '@prisma/client';
import HOSStatusCard from '@/components/hos/HOSStatusCard';
import {
  ArrowLeft,
  User,
  Truck,
  FileText,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  Package,
} from 'lucide-react';

interface DriverDetailProps {
  driver: any;
}

const statusColors: Record<DriverStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
  ON_DUTY: 'bg-blue-100 text-blue-800 border-blue-200',
  DRIVING: 'bg-purple-100 text-purple-800 border-purple-200',
  OFF_DUTY: 'bg-gray-100 text-gray-800 border-gray-200',
  SLEEPER_BERTH: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  ON_LEAVE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  INACTIVE: 'bg-red-100 text-red-800 border-red-200',
};

function formatStatus(status: DriverStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatPayType(payType: PayType): string {
  return payType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function DriverDetail({ driver }: DriverDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/drivers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {driver.user.firstName} {driver.user.lastName}
            </h1>
            <p className="text-muted-foreground">
              Driver #{driver.driverNumber}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={statusColors[driver.status]}>
          {formatStatus(driver.status)}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{driver.user.email}</p>
              </div>
            </div>
            {driver.user.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{driver.user.phone}</p>
                </div>
              </div>
            )}
            {driver.emergencyContact && (
              <div>
                <p className="text-sm text-muted-foreground">Emergency Contact</p>
                <p className="font-medium">{driver.emergencyContact}</p>
                {driver.emergencyPhone && (
                  <p className="text-sm">{driver.emergencyPhone}</p>
                )}
              </div>
            )}
            {driver.homeTerminal && (
              <div>
                <p className="text-sm text-muted-foreground">Home Terminal</p>
                <p className="font-medium">{driver.homeTerminal}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* License & Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              License & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">License Number</p>
              <p className="font-medium">
                {driver.licenseNumber} ({driver.licenseState})
              </p>
              <p className="text-sm text-muted-foreground">
                Expires: {formatDate(driver.licenseExpiry)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Medical Card</p>
              <p className="text-sm">
                Expires: {formatDate(driver.medicalCardExpiry)}
              </p>
            </div>
            {driver.drugTestDate && (
              <div>
                <p className="text-sm text-muted-foreground">Drug Test</p>
                <p className="text-sm">
                  Last test: {formatDate(driver.drugTestDate)}
                </p>
              </div>
            )}
            {driver.backgroundCheck && (
              <div>
                <p className="text-sm text-muted-foreground">Background Check</p>
                <p className="text-sm">
                  Completed: {formatDate(driver.backgroundCheck)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Current Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {driver.currentTruck ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Truck</p>
                <Link
                  href={`/dashboard/trucks/${driver.currentTruck.id}`}
                  className="text-primary hover:underline font-medium"
                >
                  {driver.currentTruck.truckNumber}
                </Link>
                <p className="text-sm">
                  {driver.currentTruck.year} {driver.currentTruck.make}{' '}
                  {driver.currentTruck.model}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">No truck assigned</p>
            )}
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Total Loads</p>
              <p className="text-2xl font-bold">{driver.totalLoads}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Miles</p>
              <p className="text-2xl font-bold">
                {driver.totalMiles.toLocaleString()} mi
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">On-Time Percentage</p>
              <p className="text-2xl font-bold">
                {driver.onTimePercentage.toFixed(1)}%
              </p>
            </div>
            {driver.rating && (
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <p className="text-2xl font-bold">
                  {driver.rating.toFixed(1)} / 5.0
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pay Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pay Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Pay Type</p>
              <p className="font-medium">{formatPayType(driver.payType)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pay Rate</p>
              <p className="text-xl font-bold">
                ${driver.payRate.toFixed(2)}
                {driver.payType === 'PER_MILE' && ' / mile'}
                {driver.payType === 'PER_LOAD' && ' / load'}
                {driver.payType === 'PERCENTAGE' && '%'}
                {driver.payType === 'HOURLY' && ' / hour'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* HOS Status */}
        <div className="md:col-span-2 lg:col-span-3">
          <HOSStatusCard driverId={driver.id} />
        </div>

        {/* Active Loads */}
        {driver.loads && driver.loads.length > 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Active Loads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {driver.loads.map((load: any) => (
                  <div
                    key={load.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <Link
                        href={`/dashboard/loads/${load.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {load.loadNumber}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {load.pickupCity}, {load.pickupState} → {load.deliveryCity},{' '}
                        {load.deliveryState}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{load.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

