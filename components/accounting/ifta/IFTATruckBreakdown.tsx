'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download, Truck as TruckIcon, Route, DollarSign } from 'lucide-react';
import { exportToCSV } from '@/lib/export';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { IFTAEntitySection } from './IFTAEntitySection';

interface StateBreakdown {
  state: string;
  stateName: string;
  miles: number;
  taxableMiles: number;
  taxRate: number;
  taxDue: number;
  taxPaid: number;
  netTax: number;
}

interface TruckEntry {
  truckId: string;
  truckNumber: string;
  totalMiles: number;
  totalGallons: number;
  mpg: number;
  loadsIncluded: number;
  stateBreakdown: StateBreakdown[];
  totalTaxDue: number;
  totalTaxPaid: number;
  netTaxDue: number;
}

interface IFTATruckBreakdownProps {
  trucks: TruckEntry[];
  quarter: number;
  year: number;
}

export function IFTATruckBreakdown({ trucks, quarter, year }: IFTATruckBreakdownProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return trucks;
    const q = search.toLowerCase();
    return trucks.filter((t) => t.truckNumber.toLowerCase().includes(q));
  }, [trucks, search]);

  const fleetMiles = trucks.reduce((s, t) => s + t.totalMiles, 0);
  const fleetNetTax = trucks.reduce((s, t) => s + t.netTaxDue, 0);
  const isCredit = fleetNetTax < 0;

  const handleExportCSV = () => {
    const rows: Record<string, string | number>[] = [];
    for (const truck of trucks) {
      for (const st of truck.stateBreakdown) {
        rows.push({
          'Truck Number': truck.truckNumber,
          State: st.state,
          'State Name': st.stateName,
          Miles: st.miles,
          'Tax Rate': st.taxRate,
          'Tax Due': st.taxDue,
          'Tax Paid': st.taxPaid,
          'Net Tax': st.netTax,
        });
      }
    }
    const headers = ['Truck Number', 'State', 'State Name', 'Miles', 'Tax Rate', 'Tax Due', 'Tax Paid', 'Net Tax'];
    exportToCSV(rows, headers, `ifta-by-truck-Q${quarter}-${year}.csv`);
  };

  if (trucks.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center space-y-2">
        <TruckIcon className="h-10 w-10 text-muted-foreground mx-auto" />
        <h3 className="text-lg font-semibold">No Per-Truck IFTA Data</h3>
        <p className="text-sm text-muted-foreground">
          No calculated IFTA entries with truck assignments found for this quarter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar: search + export */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by truck number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Fleet summary bar */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
        <span className="flex items-center gap-1.5">
          <TruckIcon className="h-4 w-4 text-muted-foreground" />
          <strong>{trucks.length}</strong> trucks
        </span>
        <span className="flex items-center gap-1.5">
          <Route className="h-4 w-4 text-muted-foreground" />
          {fleetMiles.toLocaleString(undefined, { maximumFractionDigits: 1 })} total miles
        </span>
        <span className={cn('flex items-center gap-1.5 font-medium', isCredit ? 'text-green-600' : 'text-red-600')}>
          <DollarSign className="h-4 w-4" />
          {isCredit ? `Credit: ${formatCurrency(Math.abs(fleetNetTax))}` : `Net Tax: ${formatCurrency(fleetNetTax)}`}
        </span>
      </div>

      {/* Truck sections */}
      {filtered.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          No trucks match &quot;{search}&quot;
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((truck, idx) => (
            <IFTAEntitySection
              key={truck.truckId}
              title={`Truck ${truck.truckNumber}`}
              icon={<TruckIcon className="h-4 w-4" />}
              totalMiles={truck.totalMiles}
              loadsIncluded={truck.loadsIncluded}
              stateBreakdown={truck.stateBreakdown}
              totalTaxDue={truck.totalTaxDue}
              totalTaxPaid={truck.totalTaxPaid}
              netTaxDue={truck.netTaxDue}
              defaultOpen={idx === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
