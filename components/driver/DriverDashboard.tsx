'use client';

/**
 * Driver Dashboard
 * 
 * Main dashboard component for the Driver PWA.
 * Shows current load, stats, and quick actions.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Home,
  Truck,
  DollarSign,
  Camera,
  MapPin,
  Calendar,
  AlertTriangle,
  LogOut,
  Phone,
  Navigation,
  CheckCircle,
  Clock,
  Package,
} from 'lucide-react';
import { formatCurrency, apiUrl } from '@/lib/utils';
import { useBackgroundSync, useOfflineStorage, usePWA } from '@/hooks/usePWA';
import { toast } from 'sonner';

interface DriverStats {
  weeklyMiles: number;
  estimatedPay: number;
  safetyScore: number;
  activeBreakdowns: number;
  pendingLoads: number;
  currentLoad: {
    id: string;
    loadNumber: string;
    status: string;
    pickupCity: string;
    pickupState: string;
    deliveryCity: string;
    deliveryState: string;
    pickupDate: string;
    deliveryDate: string;
    revenue: number;
    customer: { name: string };
  } | null;
}

const statusConfig: Record<string, { color: string; label: string; icon: typeof Clock }> = {
  ASSIGNED: { color: 'bg-blue-100 text-blue-800', label: 'Assigned', icon: Package },
  EN_ROUTE_PICKUP: { color: 'bg-yellow-100 text-yellow-800', label: 'En Route to Pickup', icon: Navigation },
  AT_PICKUP: { color: 'bg-orange-100 text-orange-800', label: 'At Pickup', icon: MapPin },
  LOADED: { color: 'bg-green-100 text-green-800', label: 'Loaded', icon: Truck },
  EN_ROUTE_DELIVERY: { color: 'bg-indigo-100 text-indigo-800', label: 'En Route to Delivery', icon: Navigation },
  AT_DELIVERY: { color: 'bg-purple-100 text-purple-800', label: 'At Delivery', icon: MapPin },
  DELIVERED: { color: 'bg-emerald-100 text-emerald-800', label: 'Delivered', icon: CheckCircle },
};

const nextStatusMap: Record<string, string> = {
  ASSIGNED: 'EN_ROUTE_PICKUP',
  EN_ROUTE_PICKUP: 'AT_PICKUP',
  AT_PICKUP: 'LOADED',
  LOADED: 'EN_ROUTE_DELIVERY',
  EN_ROUTE_DELIVERY: 'AT_DELIVERY',
  AT_DELIVERY: 'DELIVERED',
};

export function DriverDashboard() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { isOffline } = usePWA();
  const { requestSync } = useBackgroundSync();
  const { saveForSync } = useOfflineStorage();

  const { data: stats, isLoading } = useQuery<DriverStats>({
    queryKey: ['driver-stats'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/mobile/driver/stats'));
      if (!res.ok) throw new Error('Failed to fetch stats');
      const result = await res.json();
      return result.data;
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ loadId, status }: { loadId: string; status: string }) => {
      if (isOffline) {
        // Save for later sync
        await saveForSync('pending-status-updates', { loadId, status });
        await requestSync('sync-status-update');
        return { offline: true };
      }
      
      const res = await fetch(apiUrl(`/api/mobile/driver/loads/${loadId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: (data) => {
      if (data.offline) {
        toast.info('Status saved. Will sync when online.');
      } else {
        toast.success('Status updated');
      }
      queryClient.invalidateQueries({ queryKey: ['driver-stats'] });
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  const handleStatusUpdate = () => {
    if (!stats?.currentLoad) return;
    const nextStatus = nextStatusMap[stats.currentLoad.status];
    if (nextStatus) {
      updateStatusMutation.mutate({
        loadId: stats.currentLoad.id,
        status: nextStatus,
      });
    }
  };

  const handleUploadPOD = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && stats?.currentLoad) {
        toast.info('Uploading POD...');
        // TODO: Implement actual upload
        console.log('Upload POD:', file, stats.currentLoad.id);
      }
    };
    input.click();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold">
              {session?.user?.firstName || 'Driver'}
            </h1>
            <p className="text-xs text-muted-foreground">Driver Portal</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-24 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <Truck className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              {isLoading ? (
                <Skeleton className="h-6 w-16 mx-auto" />
              ) : (
                <p className="text-lg font-bold">{stats?.weeklyMiles?.toLocaleString() || 0}</p>
              )}
              <p className="text-xs text-muted-foreground">Weekly Miles</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 text-center">
              <DollarSign className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              {isLoading ? (
                <Skeleton className="h-6 w-16 mx-auto" />
              ) : (
                <p className="text-lg font-bold">{formatCurrency(stats?.estimatedPay || 0)}</p>
              )}
              <p className="text-xs text-muted-foreground">Est. Pay</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 text-center">
              <Package className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              {isLoading ? (
                <Skeleton className="h-6 w-16 mx-auto" />
              ) : (
                <p className="text-lg font-bold">{stats?.pendingLoads || 0}</p>
              )}
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Current Load */}
        {isLoading ? (
          <Card>
            <CardContent className="p-4">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ) : stats?.currentLoad ? (
          <Card className="border-2 border-primary overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Current Load</CardTitle>
                <Badge className={statusConfig[stats.currentLoad.status]?.color}>
                  {statusConfig[stats.currentLoad.status]?.label || stats.currentLoad.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-bold text-lg">#{stats.currentLoad.loadNumber}</p>
                <p className="text-sm text-muted-foreground">{stats.currentLoad.customer.name}</p>
              </div>

              {/* Route */}
              <div className="space-y-2 py-2 border-y">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {stats.currentLoad.pickupCity}, {stats.currentLoad.pickupState}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(stats.currentLoad.pickupDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {stats.currentLoad.deliveryCity}, {stats.currentLoad.deliveryState}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(stats.currentLoad.deliveryDate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                {nextStatusMap[stats.currentLoad.status] && (
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={updateStatusMutation.isPending}
                    className="col-span-2"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {updateStatusMutation.isPending
                      ? 'Updating...'
                      : `Mark ${statusConfig[nextStatusMap[stats.currentLoad.status]]?.label}`}
                  </Button>
                )}
                <Button variant="outline" onClick={handleUploadPOD}>
                  <Camera className="h-4 w-4 mr-2" />
                  Upload POD
                </Button>
                <Link href={`/driver/loads/${stats.currentLoad.id}`} className="contents">
                  <Button variant="outline">
                    <MapPin className="h-4 w-4 mr-2" />
                    Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No active load assigned</p>
              <Link href="/driver/loads">
                <Button variant="outline" className="mt-4">
                  View Available Loads
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Alerts */}
        {(stats?.activeBreakdowns || 0) > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900">Breakdown Alert</p>
                  <p className="text-sm text-red-700">
                    {stats?.activeBreakdowns || 0} open case(s)
                  </p>
                </div>
                <Link href="/driver/support">
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/driver/loads" className="contents">
            <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <Truck className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">My Loads</p>
                  <p className="text-xs text-muted-foreground">View all loads</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/driver/settlements" className="contents">
            <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Settlements</p>
                  <p className="text-xs text-muted-foreground">View pay</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-40 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          <Link href="/driver" className="flex flex-col items-center justify-center flex-1 h-full text-primary">
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link href="/driver/loads" className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground">
            <Truck className="h-5 w-5" />
            <span className="text-xs mt-1">Loads</span>
          </Link>
          <Link href="/driver/settlements" className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground">
            <DollarSign className="h-5 w-5" />
            <span className="text-xs mt-1">Pay</span>
          </Link>
          <Link href="/driver/support" className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground">
            <Phone className="h-5 w-5" />
            <span className="text-xs mt-1">Support</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}



