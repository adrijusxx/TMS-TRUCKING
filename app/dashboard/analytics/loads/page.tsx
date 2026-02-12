import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Users, DollarSign, BarChart3, PieChart, TrendingDown } from 'lucide-react';
import { LoadProfitabilityChart } from '@/components/analytics/LoadProfitabilityChart';
import { DriverPerformanceTable } from '@/components/analytics/DriverPerformanceTable';
import { CustomerAnalysisReport } from '@/components/analytics/CustomerAnalysisReport';
import { ExpenseTrendChart } from '@/components/analytics/ExpenseTrendChart';
import RouteEfficiencyAnalysis from '@/components/analytics/RouteEfficiencyAnalysis';
import { SettlementForecastChart } from '@/components/analytics/SettlementForecastChart';

export default function LoadAnalyticsPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Analytics', href: '/dashboard/analytics' },
          { label: 'Load Profitability', href: '/dashboard/analytics/loads' },
        ]}
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Load Profitability Analytics</h1>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Profit Margin</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18.5%</div>
              <p className="text-xs text-muted-foreground">+2.3% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$485,320</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$395,410</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$89,910</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="profitability" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profitability">
              <TrendingUp className="h-4 w-4 mr-2" />
              Profitability
            </TabsTrigger>
            <TabsTrigger value="drivers">
              <Users className="h-4 w-4 mr-2" />
              Drivers
            </TabsTrigger>
            <TabsTrigger value="customers">
              <DollarSign className="h-4 w-4 mr-2" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="expenses">
              <PieChart className="h-4 w-4 mr-2" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="routes">
              <BarChart3 className="h-4 w-4 mr-2" />
              Routes
            </TabsTrigger>
            <TabsTrigger value="forecast">
              <TrendingUp className="h-4 w-4 mr-2" />
              Forecast
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profitability" className="space-y-4">
            <LoadProfitabilityChart />
          </TabsContent>

          <TabsContent value="drivers" className="space-y-4">
            <DriverPerformanceTable />
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <CustomerAnalysisReport />
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <ExpenseTrendChart />
          </TabsContent>

          <TabsContent value="routes" className="space-y-4">
            <RouteEfficiencyAnalysis />
          </TabsContent>

          <TabsContent value="forecast" className="space-y-4">
            <SettlementForecastChart />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

