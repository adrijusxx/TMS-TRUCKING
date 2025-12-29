import { Breadcrumb } from '@/components/ui/breadcrumb';
import { DriverPerformanceMetrics } from '@/components/hr/DriverPerformanceMetrics';
import { SettlementSummary } from '@/components/hr/SettlementSummary';
import { DriverRetention } from '@/components/hr/DriverRetention';
import { BonusCalculations } from '@/components/hr/BonusCalculations';
import { HRDashboardMetrics } from '@/components/hr/HRDashboardMetrics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, DollarSign, Award, Users } from 'lucide-react';

import { SubscriptionGate } from '@/components/saas/SubscriptionGate';

export default function HRDashboardPage() {
  return (
    <SubscriptionGate module={"HR" as any}>
      <Breadcrumb items={[{ label: 'HR Department', href: '/dashboard/hr' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Human Resources Dashboard</h1>
        </div>

        {/* Key Metrics */}
        <HRDashboardMetrics />

        {/* Tabs for different sections */}
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
        </Tabs>
      </div>
    </SubscriptionGate>
  );
}
