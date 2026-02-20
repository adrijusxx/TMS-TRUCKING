'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface IFTAStateBreakdown {
  state: string;
  stateName: string;
  miles: number;
  taxableMiles: number;
  taxRate: number;
  taxDue: number;
  taxPaid: number;
  netTax: number;
}

interface IFTAStateTableProps {
  stateBreakdown: IFTAStateBreakdown[];
  totalTaxDue: number;
  totalTaxPaid: number;
  netTaxDue: number;
}

export function IFTAStateTable({
  stateBreakdown,
  totalTaxDue,
  totalTaxPaid,
  netTaxDue,
}: IFTAStateTableProps) {
  if (stateBreakdown.length === 0) {
    return (
      <div className="border rounded-lg p-6 space-y-3">
        <p className="font-medium">No state mileage data for this quarter</p>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>This means no IFTA entries have been calculated yet. To generate data:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Make sure you have <strong>delivered loads</strong> with a driver assigned in this quarter</li>
            <li>Loads need <strong>pickup and delivery city/state</strong> filled in</li>
            <li>Click <strong>&quot;Calculate Quarter&quot;</strong> to process all qualifying loads</li>
          </ol>
          <p className="text-xs pt-1">
            IFTA entries are also auto-calculated when a load is marked as delivered (if Inngest is configured).
          </p>
        </div>
      </div>
    );
  }

  const totalMiles = stateBreakdown.reduce((sum, s) => sum + s.miles, 0);

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">State</TableHead>
            <TableHead>State Name</TableHead>
            <TableHead className="text-right">Miles</TableHead>
            <TableHead className="text-right">Tax Rate ($/gal)</TableHead>
            <TableHead className="text-right">Tax Due</TableHead>
            <TableHead className="text-right">Tax Paid</TableHead>
            <TableHead className="text-right">Net Tax</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stateBreakdown.map((row) => (
            <TableRow key={row.state}>
              <TableCell className="font-medium">{row.state}</TableCell>
              <TableCell>{row.stateName}</TableCell>
              <TableCell className="text-right">
                {row.miles.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </TableCell>
              <TableCell className="text-right">
                ${row.taxRate.toFixed(4)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(row.taxDue)}
              </TableCell>
              <TableCell className="text-right text-green-600">
                {row.taxPaid > 0 ? `-${formatCurrency(row.taxPaid)}` : formatCurrency(0)}
              </TableCell>
              <TableCell
                className={cn(
                  'text-right font-medium',
                  row.netTax < 0 ? 'text-green-600' : row.netTax > 0 ? 'text-red-600' : ''
                )}
              >
                {row.netTax < 0
                  ? `-${formatCurrency(Math.abs(row.netTax))}`
                  : formatCurrency(row.netTax)}
              </TableCell>
            </TableRow>
          ))}

          {/* Totals Row */}
          <TableRow className="bg-muted/50 font-semibold">
            <TableCell colSpan={2}>Totals</TableCell>
            <TableCell className="text-right">
              {totalMiles.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </TableCell>
            <TableCell />
            <TableCell className="text-right">{formatCurrency(totalTaxDue)}</TableCell>
            <TableCell className="text-right text-green-600">
              {totalTaxPaid > 0 ? `-${formatCurrency(totalTaxPaid)}` : formatCurrency(0)}
            </TableCell>
            <TableCell
              className={cn(
                'text-right',
                netTaxDue < 0 ? 'text-green-600' : netTaxDue > 0 ? 'text-red-600' : ''
              )}
            >
              {netTaxDue < 0
                ? `-${formatCurrency(Math.abs(netTaxDue))}`
                : formatCurrency(netTaxDue)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
