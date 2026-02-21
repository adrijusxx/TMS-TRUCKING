'use client';

import { DriverPerformanceMetrics } from '@/components/hr/DriverPerformanceMetrics';
import { SettlementSummary } from '@/components/hr/SettlementSummary';
import { DriverRetention } from '@/components/hr/DriverRetention';
import { BonusCalculations } from '@/components/hr/BonusCalculations';
import FleetMonitoringTab from '@/components/fleet/monitoring/FleetMonitoringTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, DollarSign, Award, Users, Activity } from 'lucide-react';

export default function HRDashboardTabs() {
  return (
    <Tabs defaultValue="performance" className="space-y-4">
      <TabsList>
        <TabsTrigger value="performance">
          <TrendingUp className="h-4 w-4 mr-2" />
          Performance
        </TabsTrigger>
        <TabsTrigger value="settlements">
          <DollarSign className="h-4 w-4 mr-2" />
          Settlements
        </TabsTrigger>
        <TabsTrigger value="retention">
          <Users className="h-4 w-4 mr-2" />
          Retention
        </TabsTrigger>
        <TabsTrigger value="bonuses">
          <Award className="h-4 w-4 mr-2" />
          Bonuses
        </TabsTrigger>
        <TabsTrigger value="monitoring">
          <Activity className="h-4 w-4 mr-2" />
          Monitoring
        </TabsTrigger>
      </TabsList>

      <TabsContent value="performance" className="space-y-4">
        <DriverPerformanceMetrics />
      </TabsContent>

      <TabsContent value="settlements" className="space-y-4">
        <SettlementSummary />
      </TabsContent>

      <TabsContent value="retention" className="space-y-4">
        <DriverRetention />
      </TabsContent>

      <TabsContent value="bonuses" className="space-y-4">
        <BonusCalculations />
      </TabsContent>

      <TabsContent value="monitoring" className="space-y-4">
        <FleetMonitoringTab />
      </TabsContent>
    </Tabs>
  );
}
