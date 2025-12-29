'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, Clock, MapPin, DollarSign, Menu, X, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import { DriverStatus } from '@prisma/client';
import Link from 'next/link';
import HOSStatusCard from '@/components/mobile/HOSStatusCard';

interface Driver {
  id: string;
  driverNumber: string;
  status: DriverStatus;
  user: {
    firstName: string;
    lastName: string;
  };
  currentTruck?: {
    id: string;
    truckNumber: string;
  };
}

interface Load {
  id: string;
  loadNumber: string;
  status: string;
  customer: {
    name: string;
  };
  pickup?: {
    city: string;
    state: string;
    date: Date | string;
  };
  delivery?: {
    city: string;
    state: string;
    date: Date | string;
  };
  pickupCity?: string;
  pickupState?: string;
  pickupDate?: Date | string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryDate?: Date | string;
  revenue: number;
}

const statusColors: Record<DriverStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  ON_DUTY: 'bg-blue-100 text-blue-800',
  DRIVING: 'bg-purple-100 text-purple-800',
  OFF_DUTY: 'bg-gray-100 text-gray-800',
  SLEEPER_BERTH: 'bg-indigo-100 text-indigo-800',
  ON_LEAVE: 'bg-yellow-100 text-yellow-800',
  INACTIVE: 'bg-red-100 text-red-800',
  IN_TRANSIT: 'bg-indigo-100 text-indigo-800',
  DISPATCHED: 'bg-cyan-100 text-cyan-800',
};

function formatStatus(status: DriverStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

async function fetchDriverLoads() {
  const response = await fetch(apiUrl('/api/mobile/loads'));
  if (!response.ok) throw new Error('Failed to fetch loads');
  return response.json();
}

interface DriverMobileDashboardProps {
  driver: Driver;
}

export default function DriverMobileDashboard({ driver }: DriverMobileDashboardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['driver-loads'],
    queryFn: fetchDriverLoads,
  });

  const loads: Load[] = data?.data?.loads || data?.data || [];
  const activeLoads = loads.filter((load) => 
    ['ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY'].includes(load.status)
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-xl font-bold">
              {driver.user.firstName} {driver.user.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Driver #{driver.driverNumber}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
        {menuOpen && (
          <div className="border-t p-4 space-y-2">
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full justify-start">
                Web Dashboard
              </Button>
            </Link>
            <Button variant="ghost" className="w-full justify-start">
              Settings
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              Logout
            </Button>
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* HOS Status */}
        <HOSStatusCard />

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge className={statusColors[driver.status]}>
                {formatStatus(driver.status)}
              </Badge>
              {driver.currentTruck && (
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Truck #{driver.currentTruck.truckNumber}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Loads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Active Loads ({activeLoads.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading loads...
              </div>
            ) : activeLoads.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No active loads
              </div>
            ) : (
              <div className="space-y-3">
                {activeLoads.map((load) => (
                  <Link
                    key={load.id}
                    href={`/mobile/loads/${load.id}`}
                    className="block"
                  >
                    <Card className="hover:bg-muted transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">Load #{load.loadNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {load.customer.name}
                            </p>
                          </div>
                          <Badge variant="outline">{load.status}</Badge>
                        </div>
                        <div className="space-y-2 mt-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {load.pickup?.city || load.pickupCity}, {load.pickup?.state || load.pickupState}
                      </span>
                      <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                      <span>{formatDate(load.pickup?.date || load.pickupDate!)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {load.delivery?.city || load.deliveryCity}, {load.delivery?.state || load.deliveryState}
                      </span>
                      <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                      <span>{formatDate(load.delivery?.date || load.deliveryDate!)}</span>
                    </div>
                          <div className="flex items-center gap-2 text-sm mt-2 pt-2 border-t">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-green-600">
                              {formatCurrency(load.revenue)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Loads */}
        {loads.length > activeLoads.length && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Loads</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/mobile/loads">
                <Button variant="outline" className="w-full">
                  View All Loads ({loads.length})
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Breakdown Reporting */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Breakdowns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/mobile/driver/breakdowns">
              <Button variant="outline" className="w-full">
                Report Breakdown
              </Button>
            </Link>
            <Link href="/mobile/driver/breakdowns">
              <Button variant="ghost" className="w-full text-sm">
                View My Breakdown Cases
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

