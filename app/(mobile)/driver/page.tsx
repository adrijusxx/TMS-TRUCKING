'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  DollarSign, 
  Shield, 
  MapPin, 
  Calendar,
  Upload,
  AlertTriangle,
  Camera
} from 'lucide-react';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import Link from 'next/link';
import { LoadStatus } from '@prisma/client';

interface DriverStats {
  weeklyMiles: number;
  estimatedPay: number;
  safetyScore: number;
  activeBreakdowns: number;
  currentLoad: {
    id: string;
    loadNumber: string;
    status: LoadStatus;
    pickupCity?: string;
    pickupState?: string;
    deliveryCity?: string;
    deliveryState?: string;
    pickupDate?: string;
    deliveryDate?: string;
    customer: {
      name: string;
    };
  } | null;
}

async function fetchDriverStats(): Promise<DriverStats> {
  const response = await fetch(apiUrl('/api/mobile/driver/stats'));
  if (!response.ok) throw new Error('Failed to fetch stats');
  const result = await response.json();
  return result.data;
}

const statusColors: Record<string, string> = {
  ASSIGNED: 'bg-blue-100 text-blue-800',
  EN_ROUTE_PICKUP: 'bg-yellow-100 text-yellow-800',
  AT_PICKUP: 'bg-orange-100 text-orange-800',
  LOADED: 'bg-green-100 text-green-800',
  EN_ROUTE_DELIVERY: 'bg-indigo-100 text-indigo-800',
  AT_DELIVERY: 'bg-purple-100 text-purple-800',
};

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function DriverMobileDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['driver-stats'],
    queryFn: fetchDriverStats,
  });

  const handleUploadPOD = () => {
    // This will trigger the file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // TODO: Implement POD upload
        console.log('Upload POD:', file);
      }
    };
    input.click();
  };

  return (
    <div className="p-4 space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Weekly Miles</p>
            </div>
            <p className="text-xl font-bold">
              {isLoading ? '...' : (stats?.weeklyMiles || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Est. Pay</p>
            </div>
            <p className="text-xl font-bold">
              {isLoading ? '...' : formatCurrency(stats?.estimatedPay || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Safety</p>
            </div>
            <p className="text-xl font-bold">
              {isLoading ? '...' : stats?.safetyScore || 100}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Load Card */}
      {stats?.currentLoad && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Current Load</CardTitle>
              <Badge className={statusColors[stats.currentLoad.status] || 'bg-gray-100 text-gray-800'}>
                {formatStatus(stats.currentLoad.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-semibold text-lg">Load #{stats.currentLoad.loadNumber}</p>
              <p className="text-sm text-muted-foreground">{stats.currentLoad.customer.name}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">
                    {stats.currentLoad.pickupCity}, {stats.currentLoad.pickupState}
                  </p>
                  {stats.currentLoad.pickupDate && (
                    <p className="text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {formatDate(stats.currentLoad.pickupDate)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">
                    {stats.currentLoad.deliveryCity}, {stats.currentLoad.deliveryState}
                  </p>
                  {stats.currentLoad.deliveryDate && (
                    <p className="text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {formatDate(stats.currentLoad.deliveryDate)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  // TODO: Navigate to update status page
                  window.location.href = `/mobile/driver/loads/${stats.currentLoad?.id}`;
                }}
              >
                Update Status
              </Button>
              <Button
                variant="default"
                className="flex-1"
                onClick={handleUploadPOD}
              >
                <Camera className="h-4 w-4 mr-2" />
                Upload POD
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {(stats?.activeBreakdowns || 0) > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div className="flex-1">
                <p className="font-semibold text-red-900">
                  Active Breakdown Alert
                </p>
                <p className="text-sm text-red-700">
                  You have {stats?.activeBreakdowns || 0} open breakdown case(s)
                </p>
              </div>
              <Link href="/mobile/driver/support">
                <Button variant="outline" size="sm">
                  View
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Active Load Message */}
      {!stats?.currentLoad && !isLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No active loads assigned</p>
            <Link href="/mobile/driver/loads">
              <Button variant="outline" className="mt-4">
                View Load History
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
