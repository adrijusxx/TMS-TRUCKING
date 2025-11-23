import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, DollarSign, Award } from 'lucide-react';
import { DriverPerformanceMetrics } from '@/components/hr/DriverPerformanceMetrics';
import { SettlementSummary } from '@/components/hr/SettlementSummary';
import { DriverRetention } from '@/components/hr/DriverRetention';
import { BonusCalculations } from '@/components/hr/BonusCalculations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function HRDashboardPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'HR Department', href: '/dashboard/hr' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Human Resources Dashboard</h1>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
              <p className="text-xs text-muted-foreground">+3 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Settlement</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$3,250</div>
              <p className="text-xs text-muted-foreground">Per week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">92%</div>
              <p className="text-xs text-muted-foreground">Last 12 months</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bonuses Paid</CardTitle>
              <Award className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$12,500</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

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
    </>
  );
}
