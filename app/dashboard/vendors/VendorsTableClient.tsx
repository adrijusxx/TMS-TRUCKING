'use client';

import React from 'react';
import { DataTable } from '@/components/data-table/DataTable';
import { createVendorColumns } from './columns';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface VendorData {
  id: string;
  vendorNumber: string;
  name: string;
  type: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  createdAt: Date;
  notes?: string | null;
}

interface VendorsTableClientProps {
  data: VendorData[];
}

export function VendorsTableClient({ data }: VendorsTableClientProps) {
  const queryClient = useQueryClient();
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  const handleUpdate = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['vendors'] });
  }, [queryClient]);

  const columns = React.useMemo(
    () => createVendorColumns(handleUpdate),
    [handleUpdate]
  );

  const rowActions = React.useCallback((row: VendorData) => {
    return (
      <div className="flex items-center gap-2">
        <Link href={`/dashboard/vendors/${row.id}`}>
          <Button variant="ghost" size="sm">
            View
          </Button>
        </Link>
      </div>
    );
  }, []);

  return (
    <DataTable
      columns={columns}
      data={data}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
      enableRowSelection={true}
      rowActions={rowActions}
      emptyMessage="No vendors found"
    />
  );
}




























