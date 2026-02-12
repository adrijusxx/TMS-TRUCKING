import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CreditCard, Receipt, Fuel, Building2, Sliders, Users } from 'lucide-react';
import Link from 'next/link';

const accountingPages = [
  {
    name: 'Invoices',
    href: '/dashboard/invoices',
    icon: FileText,
    description: 'Customer billing, aging, and reconciliation',
    color: 'text-blue-600',
  },
  {
    name: 'Customers',
    href: '/dashboard/customers',
    icon: Users,
    description: 'Manage customers, contacts, and terms',
    color: 'text-indigo-600',
  },
  {
    name: 'Settlements',
    href: '/dashboard/settlements',
    icon: CreditCard,
    description: 'Driver settlements, batches, and reports',
    color: 'text-green-600',
  },
  {
    name: 'Expenses',
    href: '/dashboard/accounting/expenses',
    icon: Receipt,
    description: 'Load expenses and operating costs',
    color: 'text-orange-600',
  },
  {
    name: 'IFTA',
    href: '/dashboard/accounting/ifta',
    icon: Fuel,
    description: 'Fuel tax reporting and compliance',
    color: 'text-purple-600',
  },
  {
    name: 'Factoring',
    href: '/dashboard/accounting/factoring',
    icon: Building2,
    description: 'Invoice factoring and companies',
    color: 'text-yellow-600',
  },
  {
    name: 'Settings',
    href: '/dashboard/accounting/settings',
    icon: Sliders,
    description: 'Deduction rules, rates, and configuration',
    color: 'text-slate-600',
  },
];

export default function AccountingDashboardPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Accounting', href: '/dashboard/accounting' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accounting</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage invoicing, settlements, expenses, and compliance
          </p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accountingPages.map((page) => {
            const Icon = page.icon;
            return (
              <Link key={page.href} href={page.href}>
                <Card className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-muted ${page.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-base">{page.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{page.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
