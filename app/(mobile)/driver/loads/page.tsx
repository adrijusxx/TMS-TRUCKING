'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, DollarSign, FileText } from 'lucide-react';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import Link from 'next/link';
import { LoadStatus } from '@prisma/client';

interface Load {
  id: string;
  loadNumber: string;
  status: LoadStatus;
  pickup: {
    city: string | null;
    state: string | null;
    date: string | null;
  };
  delivery: {
    city: string | null;
    state: string | null;
    date: string | null;
  };
  customer: {
    name: string;
  };
  revenue: number;
  createdAt: string;
}

async function fetchLoads(status?: string): Promise<Load[]> {
  const url = status 
    ? apiUrl(`/api/mobile/loads?status=${status}`)
    : apiUrl('/api/mobile/loads');
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch loads');
  const result = await response.json();
  return result.data?.loads || [];
}

const statusColors: Record<string, string> = {
  ASSIGNED: 'bg-blue-100 text-blue-800',
  EN_ROUTE_PICKUP: 'bg-yellow-100 text-yellow-800',
  AT_PICKUP: 'bg-orange-100 text-orange-800',
  LOADED: 'bg-green-100 text-green-800',
  EN_ROUTE_DELIVERY: 'bg-indigo-100 text-indigo-800',
  AT_DELIVERY: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function LoadCard({ load }: { load: Load }) {
  return (
    <Link href={`/mobile/driver/loads/${load.id}`}>
      <Card className="mb-3 hover:bg-muted transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-semibold text-lg">Load #{load.loadNumber}</p>
              <p className="text-sm text-muted-foreground">{load.customer.name}</p>
            </div>
            <Badge className={statusColors[load.status] || 'bg-gray-100 text-gray-800'}>
              {formatStatus(load.status)}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>
                {load.pickup.city || 'N/A'}, {load.pickup.state || 'N/A'}
              </span>
              {load.pickup.date && (
                <>
                  <Calendar className="h-3 w-3 text-muted-foreground ml-2" />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(load.pickup.date)}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>
                {load.delivery.city || 'N/A'}, {load.delivery.state || 'N/A'}
              </span>
              {load.delivery.date && (
                <>
                  <Calendar className="h-3 w-3 text-muted-foreground ml-2" />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(load.delivery.date)}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-600">
                  {formatCurrency(load.revenue)}
                </span>
              </div>
              <Link
                href={`/mobile/driver/loads/${load.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <FileText className="h-3 w-3" />
                View POD
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DriverLoadsPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'cancelled'>('active');

  const { data: allLoads, isLoading } = useQuery({
    queryKey: ['driver-loads'],
    queryFn: () => fetchLoads(),
  });

  // Filter loads based on active tab
  const activeStatuses = ['ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY'];
  const completedStatuses = ['DELIVERED', 'INVOICED', 'PAID'];
  const cancelledStatuses = ['CANCELLED'];

  const filteredLoads = allLoads?.filter((load) => {
    if (activeTab === 'active') {
      return activeStatuses.includes(load.status);
    } else if (activeTab === 'completed') {
      return completedStatuses.includes(load.status);
    } else {
      return cancelledStatuses.includes(load.status);
    }
  }) || [];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">My Loads</h1>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-0">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading loads...</div>
          ) : filteredLoads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No active loads</div>
          ) : (
            <div>
              {filteredLoads.map((load) => (
                <LoadCard key={load.id} load={load} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading loads...</div>
          ) : filteredLoads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No completed loads</div>
          ) : (
            <div>
              {filteredLoads.map((load) => (
                <LoadCard key={load.id} load={load} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-0">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading loads...</div>
          ) : filteredLoads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No cancelled loads</div>
          ) : (
            <div>
              {filteredLoads.map((load) => (
                <LoadCard key={load.id} load={load} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
