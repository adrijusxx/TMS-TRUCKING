'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download, User, Route, DollarSign } from 'lucide-react';
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

interface DriverEntry {
  driverId: string;
  driverName: string;
  totalMiles: number;
  totalGallons: number;
  mpg: number;
  loadsIncluded: number;
  stateBreakdown: StateBreakdown[];
  totalTaxDue: number;
  totalTaxPaid: number;
  netTaxDue: number;
}

interface IFTADriverBreakdownProps {
  drivers: DriverEntry[];
  quarter: number;
  year: number;
}

export function IFTADriverBreakdown({ drivers, quarter, year }: IFTADriverBreakdownProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return drivers;
    const q = search.toLowerCase();
    return drivers.filter((d) => d.driverName.toLowerCase().includes(q));
  }, [drivers, search]);

  const fleetMiles = drivers.reduce((s, d) => s + d.totalMiles, 0);
  const fleetNetTax = drivers.reduce((s, d) => s + d.netTaxDue, 0);
  const isCredit = fleetNetTax < 0;

  const handleExportCSV = () => {
    const rows: Record<string, string | number>[] = [];
    for (const driver of drivers) {
      for (const st of driver.stateBreakdown) {
        rows.push({
          Driver: driver.driverName,
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
    const headers = ['Driver', 'State', 'State Name', 'Miles', 'Tax Rate', 'Tax Due', 'Tax Paid', 'Net Tax'];
    exportToCSV(rows, headers, `ifta-by-driver-Q${quarter}-${year}.csv`);
  };

  if (drivers.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center space-y-2">
        <User className="h-10 w-10 text-muted-foreground mx-auto" />
        <h3 className="text-lg font-semibold">No Per-Driver IFTA Data</h3>
        <p className="text-sm text-muted-foreground">
          No calculated IFTA entries found for this quarter.
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
            placeholder="Search by driver name..."
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

      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
        <span className="flex items-center gap-1.5">
          <User className="h-4 w-4 text-muted-foreground" />
          <strong>{drivers.length}</strong> drivers
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

      {/* Driver sections */}
      {filtered.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          No drivers match &quot;{search}&quot;
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((driver, idx) => (
            <IFTAEntitySection
              key={driver.driverId}
              title={driver.driverName}
              icon={<User className="h-4 w-4" />}
              totalMiles={driver.totalMiles}
              loadsIncluded={driver.loadsIncluded}
              stateBreakdown={driver.stateBreakdown}
              totalTaxDue={driver.totalTaxDue}
              totalTaxPaid={driver.totalTaxPaid}
              netTaxDue={driver.netTaxDue}
              defaultOpen={idx === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
