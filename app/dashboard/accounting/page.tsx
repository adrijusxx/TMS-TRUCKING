import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, FileText, CreditCard, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SettlementApprovalQueue } from '@/components/accounting/SettlementApprovalQueue';
import { AdvanceApprovalQueue } from '@/components/accounting/AdvanceApprovalQueue';
import { CashFlowProjection } from '@/components/accounting/CashFlowProjection';
import { AccountingMetrics } from '@/components/accounting/AccountingMetrics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AccountingDashboardPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Accounting Department', href: '/dashboard/accounting' }]} />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Accounting Department</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/accounting/deduction-rules">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Deduction Rules
              </Button>
            </Link>
            <Link href="/dashboard/accounting/reports">
              <Button>
                <TrendingUp className="h-4 w-4 mr-2" />
                Financial Reports
              </Button>
            </Link>
          </div>
        </div>

        {/* Real-time Metrics */}
        <AccountingMetrics />

        {/* Approval Queues */}
        <Tabs defaultValue="settlements" className="space-y-4">
          <TabsList>
            <TabsTrigger value="settlements">
              <AlertCircle className="h-4 w-4 mr-2" />
              Pending Settlements
            </TabsTrigger>
            <TabsTrigger value="advances">
              <DollarSign className="h-4 w-4 mr-2" />
              Advance Requests
            </TabsTrigger>
            <TabsTrigger value="cashflow">
              <TrendingUp className="h-4 w-4 mr-2" />
              Cash Flow
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settlements" className="space-y-4">
            <SettlementApprovalQueue />
          </TabsContent>

          <TabsContent value="advances" className="space-y-4">
            <AdvanceApprovalQueue />
          </TabsContent>

          <TabsContent value="cashflow" className="space-y-4">
            <CashFlowProjection />
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/settlements">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">All Settlements</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">View all driver settlements</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/accounting/expenses">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expenses</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Review load expenses</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/invoices">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Invoices</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Customer invoicing</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/analytics/loads">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profitability</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Load profitability analysis</p>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>
    </>
  );
}
