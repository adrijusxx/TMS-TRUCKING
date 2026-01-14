'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Clock, MessageSquare, Activity, Loader2 } from 'lucide-react';
import { apiUrl } from '@/lib/utils';

interface FleetMetrics {
  breakdowns: { active: number; totalCost: number };
  trucks: { total: number; available: number; maintenance: number; outOfService: number };
  maintenance: { overdue: number; dueSoon: number };
  inspections: { overdue: number; due: number };
}

interface CommunicationsData {
  conversations: Array<{ unreadCount: number }>;
}

async function fetchFleetMetrics() {
  const response = await fetch(apiUrl('/api/fleet/metrics'));
  if (!response.ok) throw new Error('Failed to fetch fleet metrics');
  return response.json();
}

async function fetchCommunications() {
  const response = await fetch(apiUrl('/api/fleet/communications'));
  if (!response.ok) throw new Error('Failed to fetch communications');
  return response.json();
}

export default function FleetAnalyticsSummary() {
  const { data: metricsData, isLoading: metricsLoading } = useQuery<{ data: FleetMetrics }>({
    queryKey: ['fleet-metrics-summary'],
    queryFn: fetchFleetMetrics,
    refetchInterval: 60000,
  });

  const { data: commsData, isLoading: commsLoading } = useQuery<{ data: CommunicationsData }>({
    queryKey: ['communications-summary'],
    queryFn: fetchCommunications,
    refetchInterval: 30000,
  });

  const metrics = metricsData?.data;
  const unreadMessages = commsData?.data?.conversations?.reduce((sum, c) => sum + c.unreadCount, 0) || 0;
  
  // Calculate fleet health score (simple algorithm)
  const calculateHealthScore = () => {
    if (!metrics) return 0;
    const total = metrics.trucks.total || 1;
    const healthy = metrics.trucks.available;
    const issues = metrics.maintenance.overdue + metrics.inspections.overdue + metrics.trucks.outOfService;
    const score = Math.max(0, Math.min(100, Math.round(((healthy / total) * 100) - (issues * 5))));
    return score;
  };

  const healthScore = calculateHealthScore();

  if (metricsLoading || commsLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
              <div className="h-6 bg-muted rounded w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Open Cases */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">Open Cases</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {metrics?.breakdowns.active || 0}
          </div>
        </CardContent>
      </Card>

      {/* Avg Resolution Time - placeholder for now */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Avg Resolution</span>
          </div>
          <div className="text-2xl font-bold">4.2h</div>
        </CardContent>
      </Card>

      {/* Unread Messages */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs font-medium">Unread Messages</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{unreadMessages}</div>
        </CardContent>
      </Card>

      {/* Fleet Health Score */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="h-4 w-4" />
            <span className="text-xs font-medium">Fleet Health</span>
          </div>
          <div className={`text-2xl font-bold ${
            healthScore >= 80 ? 'text-green-600' : 
            healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {healthScore}%
          </div>
        </CardContent>
      </Card>
    </div>
  );
}











