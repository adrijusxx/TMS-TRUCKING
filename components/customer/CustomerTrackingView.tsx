'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils';
import { LoadStatus } from '@prisma/client';
import {
  Package,
  MapPin,
  Calendar,
  Truck,
  User,
  FileText,
  Download,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface CustomerTrackingViewProps {
  load: any;
}

const statusColors: Record<LoadStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ASSIGNED: 'bg-blue-100 text-blue-800 border-blue-200',
  EN_ROUTE_PICKUP: 'bg-purple-100 text-purple-800 border-purple-200',
  AT_PICKUP: 'bg-orange-100 text-orange-800 border-orange-200',
  LOADED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  EN_ROUTE_DELIVERY: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  AT_DELIVERY: 'bg-pink-100 text-pink-800 border-pink-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  BILLING_HOLD: 'bg-amber-100 text-amber-800 border-amber-200',
  READY_TO_BILL: 'bg-lime-100 text-lime-800 border-lime-200',
  INVOICED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  PAID: 'bg-teal-100 text-teal-800 border-teal-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

function formatStatus(status: LoadStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function CustomerTrackingView({ load }: CustomerTrackingViewProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Load Tracking</h1>
          </div>
          <Badge variant="outline" className={statusColors[load.status as LoadStatus]}>
            {formatStatus(load.status)}
          </Badge>
        </div>

        {/* Load Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Load Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Load Number</p>
                <p className="font-medium text-lg">{load.loadNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{load.customer.name}</p>
              </div>
            </div>

            {load.commodity && (
              <div>
                <p className="text-sm text-muted-foreground">Commodity</p>
                <p className="font-medium">{load.commodity}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Weight</p>
                <p className="font-medium">
                  {load.weight.toLocaleString()} lbs
                </p>
              </div>
              {load.revenue && (
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="font-medium text-green-600">
                    {formatCurrency(load.revenue)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Route Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Route Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Pickup Location
                </p>
                <p className="font-medium">{load.pickupLocation}</p>
                <p className="text-sm">
                  {load.pickupAddress}, {load.pickupCity}, {load.pickupState}{' '}
                  {load.pickupZip}
                </p>
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                  <p className="text-sm">
                    {formatDateTime(load.pickupDate)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Delivery Location
                </p>
                <p className="font-medium">{load.deliveryLocation}</p>
                <p className="text-sm">
                  {load.deliveryAddress}, {load.deliveryCity},{' '}
                  {load.deliveryState} {load.deliveryZip}
                </p>
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                  <p className="text-sm">
                    {formatDateTime(load.deliveryDate)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignment Information */}
        {(load.driver || load.truck) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {load.driver && (
                  <div>
                    <p className="text-sm text-muted-foreground">Driver</p>
                    <p className="font-medium">
                      {load.driver.user.firstName} {load.driver.user.lastName}
                    </p>
                    <p className="text-sm">{load.driver.driverNumber}</p>
                  </div>
                )}
                {load.truck && (
                  <div>
                    <p className="text-sm text-muted-foreground">Truck</p>
                    <p className="font-medium">{load.truck.truckNumber}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status History */}
        {load.statusHistory && load.statusHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Status History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {load.statusHistory.map((history: any) => (
                  <div
                    key={history.id}
                    className="flex items-start gap-4 pb-3 border-b last:border-0"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={statusColors[history.status as LoadStatus]}
                        >
                          {formatStatus(history.status)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDateTime(history.createdAt)}
                        </span>
                      </div>
                      {history.notes && (
                        <p className="text-sm mt-1">{history.notes}</p>
                      )}
                      {history.location && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Location: {history.location}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents */}
        {load.documents && load.documents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {load.documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{doc.fileName}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.type} • {formatDate(doc.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.fileUrl, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
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

