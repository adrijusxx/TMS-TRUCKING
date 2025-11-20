'use client';

import GenericCRUDManager from '@/lib/components/GenericCRUDManager';
import { Badge } from '@/components/ui/badge';

const fields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true },
  { name: 'formula', label: 'Formula', type: 'textarea' as const, required: true },
  { name: 'description', label: 'Description', type: 'textarea' as const },
];

const columns = [
  { key: 'name', label: 'Name' },
  { 
    key: 'formula', 
    label: 'Formula', 
    render: (val: any) => (
      <code className="text-sm bg-muted p-1 rounded">{String(val).substring(0, 50)}...</code>
    )
  },
  { 
    key: 'isDefault', 
    label: 'Status',
    render: (val: any) => val ? <Badge>Default</Badge> : <Badge variant="secondary">Active</Badge>
  },
];

export default function NetProfitPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Net Profit Calculation</h1>
        <p className="text-muted-foreground">
          Configure net profit calculation formulas and rules
        </p>
      </div>
      <GenericCRUDManager
        endpoint="/api/net-profit-formulas"
        queryKey="net-profit-formulas"
        title="Net Profit Formulas"
        description="Manage net profit calculation formulas"
        searchable={true}
        fields={fields}
        columns={columns}
      />
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Formula syntax supports variables like {`{revenue}`}, {`{expenses}`}, {`{fuel_cost}`}, etc.
        </p>
      </div>
    </div>
  );
}

