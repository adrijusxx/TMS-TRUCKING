import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  FileText,
  DollarSign,
  TrendingUp,
  BarChart3,
  Receipt,
  CreditCard,
  Calculator,
  Building2,
} from 'lucide-react';

export default function AccountingReportsPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Accounting', href: '/dashboard/accounting' },
        { label: 'Reports' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Accounting Reports</h1>
          <p className="text-muted-foreground mt-2">
            Access comprehensive financial reports and analytics for your accounting department.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Reports
              </CardTitle>
              <CardDescription>
                View invoice reports, payment tracking, and customer statements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/invoices/reports">
                <Button variant="outline" className="w-full">
                  View Invoice Reports
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Settlement Reports
              </CardTitle>
              <CardDescription>
                Analyze driver settlements and payment history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/settlements">
                <Button variant="outline" className="w-full">
                  View Settlements
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Net Profit Analysis
              </CardTitle>
              <CardDescription>
                Calculate and analyze net profit by load, customer, or period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/accounting/net-profit">
                <Button variant="outline" className="w-full">
                  View Net Profit
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                IFTA Reports
              </CardTitle>
              <CardDescription>
                Generate IFTA fuel tax reports and compliance documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/accounting/ifta">
                <Button variant="outline" className="w-full">
                  View IFTA Reports
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Financial Analytics
              </CardTitle>
              <CardDescription>
                Comprehensive financial analytics and KPI dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/analytics">
                <Button variant="outline" className="w-full">
                  View Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Expense Reports
              </CardTitle>
              <CardDescription>
                Track and analyze business expenses by category and period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/accounting/expenses">
                <Button variant="outline" className="w-full">
                  View Expenses
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Invoice Aging
              </CardTitle>
              <CardDescription>
                View accounts receivable aging and collection reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/invoices/aging">
                <Button variant="outline" className="w-full">
                  View Aging Report
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Factoring Reports
              </CardTitle>
              <CardDescription>
                Track factored invoices and factoring company performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/accounting/factoring">
                <Button variant="outline" className="w-full">
                  View Factoring
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

