'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Package,
  Users,
  Truck,
  FileText,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import type { Permission } from '@/lib/permissions';

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  permission?: Permission;
}

const quickActions: QuickAction[] = [
  {
    title: 'Create Load',
    description: 'Add a new load',
    href: '/dashboard/loads?action=new',
    icon: Package,
    color: 'bg-blue-500',
    permission: 'loads.create',
  },
  {
    title: 'Add Driver',
    description: 'Register new driver',
    href: '/dashboard/drivers?action=new',
    icon: Users,
    color: 'bg-green-500',
    permission: 'drivers.create',
  },
  {
    title: 'Add Truck',
    description: 'Register new truck',
    href: '/dashboard/trucks?action=new',
    icon: Truck,
    color: 'bg-purple-500',
    permission: 'trucks.create',
  },
  {
    title: 'Add Customer',
    description: 'Register new customer',
    href: '/dashboard/customers?action=new',
    icon: FileText,
    color: 'bg-orange-500',
    permission: 'customers.create',
  },
  {
    title: 'Generate Invoice',
    description: 'Create invoice from loads',
    href: '/dashboard/invoices/generate',
    icon: DollarSign,
    color: 'bg-emerald-500',
    permission: 'invoices.generate',
  },
  {
    title: 'Dispatch Board',
    description: 'View dispatch board',
    href: '/dashboard/dispatch',
    icon: Calendar,
    color: 'bg-indigo-500',
    permission: 'loads.assign',
  },
];

export default function QuickActions() {
  const { can } = usePermissions();

  // Filter actions based on permissions
  const visibleActions = quickActions.filter((action) => {
    if (!action.permission) return true;
    return can(action.permission);
  });

  // Always render the card, even if no actions are visible
  // This ensures the section is visible and provides feedback

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        {visibleActions.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No quick actions available. Check your permissions.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {visibleActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                  >
                    <div className={`${action.color} p-2 rounded-lg mr-3`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {action.description}
                      </div>
                    </div>
                  </Button>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

