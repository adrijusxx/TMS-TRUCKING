'use client';

import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import BreakdownsDataTable from '@/components/fleet/shared/BreakdownsDataTable';
import CreateCaseModal from '@/components/fleet/CreateCaseModal';

export default function FleetBreakdownsPage() {
  const { can } = usePermissions();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Fleet Department', href: '/dashboard/fleet' }, { label: 'Breakdowns', href: '/dashboard/fleet/breakdowns' }]} />

      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Active Breakdowns</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage all active breakdown cases
          </p>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex-1 w-full sm:max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cases by #, truck, driver, location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {can('breakdowns.create') && (
                <Button onClick={() => setCreateModalOpen(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Case
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <BreakdownsDataTable
          mode="full"
          searchQuery={searchQuery}
          showFilters={true}
        />
      </div>

      <CreateCaseModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </div>
  );
}
