'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency, apiUrl } from '@/lib/utils';
import { CheckCircle2, XCircle, Download, Mail, FileSpreadsheet } from 'lucide-react';

interface IFTAStateMileage {
  state: string;
  miles: number;
  tax: number;
  deduction: number;
}

interface IFTARow {
  driverId: string;
  driverName: string;
  truckId: string | null;
  truckNumber: string | null;
  stateMileages: IFTAStateMileage[];
  totalMiles: number;
  totalTax: number;
  totalDeduction: number;
  loads: Array<{ loadId: string; loadNumber: string }>;
}

interface IFTAConfig {
  stateRates: Record<string, number>;
}

async function fetchIFTAReport(params: {
  periodType: 'QUARTER' | 'MONTH';
  periodYear: number;
  periodQuarter?: number;
  periodMonth?: number;
  driverId?: string;
}) {
  const searchParams = new URLSearchParams({
    periodType: params.periodType,
    periodYear: params.periodYear.toString(),
  });
  if (params.periodQuarter) searchParams.set('periodQuarter', params.periodQuarter.toString());
  if (params.periodMonth) searchParams.set('periodMonth', params.periodMonth.toString());
  if (params.driverId) searchParams.set('driverId', params.driverId);

  const response = await fetch(apiUrl(`/api/ifta/report?${searchParams}`));
  if (!response.ok) throw new Error('Failed to fetch IFTA report');
  return response.json();
}

async function fetchIFTAConfig() {
  const response = await fetch(apiUrl('/api/ifta/config'));
  if (!response.ok) throw new Error('Failed to fetch IFTA config');
  return response.json();
}

async function updateIFTAConfig(stateRates: Record<string, number>) {
  const response = await fetch(apiUrl('/api/ifta/config'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stateRates }),
  });
  if (!response.ok) throw new Error('Failed to update IFTA config');
  return response.json();
}

export default function IFTAReport() {
  const [periodType, setPeriodType] = useState<'QUARTER' | 'MONTH'>('QUARTER');
  const [reportType, setReportType] = useState<'DRIVER' | 'TRUCK'>('DRIVER');
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [periodQuarter, setPeriodQuarter] = useState<number>(
    Math.floor(new Date().getMonth() / 3) + 1
  );
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('all');
  const [taxRates, setTaxRates] = useState<Record<string, string>>({
    KY: '0.0285',
    NM: '0.04378',
    OR: '0.237',
    NY: '0.0546',
    CT: '0.1',
  });

  const queryClient = useQueryClient();

  // Fetch IFTA config
  const { data: configData } = useQuery({
    queryKey: ['ifta-config'],
    queryFn: fetchIFTAConfig,
  });

  // Initialize tax rates from config
  React.useEffect(() => {
    if (configData?.data?.stateRates) {
      const rates: Record<string, string> = {};
      Object.entries(configData.data.stateRates).forEach(([state, rate]) => {
        rates[state] = (typeof rate === 'number' ? rate : parseFloat(String(rate)) || 0).toString();
      });
      setTaxRates(rates);
    }
  }, [configData]);

  // Fetch report
  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      'ifta-report',
      periodType,
      periodYear,
      periodQuarter,
      periodMonth,
      selectedDriverId,
    ],
    queryFn: () =>
      fetchIFTAReport({
        periodType,
        periodYear,
        periodQuarter: periodType === 'QUARTER' ? periodQuarter : undefined,
        periodMonth: periodType === 'MONTH' ? periodMonth : undefined,
        driverId: selectedDriverId !== 'all' ? selectedDriverId : undefined,
      }),
    enabled: false, // Don't auto-fetch, wait for "Run report" button
  });

  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: updateIFTAConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ifta-config'] });
    },
  });

  const handleRunReport = () => {
    // Update config with current tax rates
    const rates: Record<string, number> = {};
    Object.entries(taxRates).forEach(([state, rate]) => {
      const numRate = parseFloat(rate);
      if (!isNaN(numRate)) {
        rates[state] = numRate;
      }
    });

    updateConfigMutation.mutate(rates, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  const handleSetToDefault = () => {
    const defaultRates: Record<string, string> = {
      KY: '0.0285',
      NM: '0.04378',
      OR: '0.237',
      NY: '0.0546',
      CT: '0.1',
    };
    setTaxRates(defaultRates);
  };

  const entries: IFTARow[] = data?.data?.entries || [];
  const states = ['KY', 'NM', 'OR', 'NY', 'CT'];

  // Get all unique states from entries
  const allStates = new Set<string>();
  entries.forEach((entry) => {
    entry.stateMileages.forEach((sm) => allStates.add(sm.state));
  });
  const sortedStates = Array.from(allStates).sort();

  // Generate quarters
  const quarters = [
    { value: 1, label: '1Q' },
    { value: 2, label: '2Q' },
    { value: 3, label: '3Q' },
    { value: 4, label: '4Q' },
  ];

  // Generate months
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  // Calculate totals
  const totals = entries.reduce(
    (acc, entry) => {
      acc.totalMiles += entry.totalMiles;
      acc.totalTax += entry.totalTax;
      acc.totalDeduction += entry.totalDeduction;

      entry.stateMileages.forEach((sm) => {
        if (!acc.stateMileages[sm.state]) {
          acc.stateMileages[sm.state] = { miles: 0, tax: 0, deduction: 0 };
        }
        acc.stateMileages[sm.state].miles += sm.miles;
        acc.stateMileages[sm.state].tax += sm.tax;
        acc.stateMileages[sm.state].deduction += sm.deduction;
      });

      return acc;
    },
    {
      totalMiles: 0,
      totalTax: 0,
      totalDeduction: 0,
      stateMileages: {} as Record<string, { miles: number; tax: number; deduction: number }>,
    }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">KY, NM, OR, NY, CT</h1>
        <p className="text-muted-foreground">IFTA Tax Report</p>
      </div>

      {/* Report Controls */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Period Selection */}
          <div className="space-y-2">
            <Label>Period</Label>
            <RadioGroup value={periodType} onValueChange={(v) => setPeriodType(v as 'QUARTER' | 'MONTH')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="QUARTER" id="quarter" />
                <Label htmlFor="quarter">by quarter</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="MONTH" id="month" />
                <Label htmlFor="month">by month</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Report Type */}
          <div className="space-y-2">
            <Label>Report Type</Label>
            <RadioGroup
              value={reportType}
              onValueChange={(v) => setReportType(v as 'DRIVER' | 'TRUCK')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="DRIVER" id="driver" />
                <Label htmlFor="driver">by driver</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="TRUCK" id="truck" />
                <Label htmlFor="truck">by truck</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Period Selection */}
          {periodType === 'QUARTER' ? (
            <div className="space-y-2">
              <Label htmlFor="quarter">Select Quarter</Label>
              <Select
                value={periodQuarter.toString()}
                onValueChange={(v) => setPeriodQuarter(parseInt(v, 10))}
              >
                <SelectTrigger id="quarter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {quarters.map((q) => (
                    <SelectItem key={q.value} value={q.value.toString()}>
                      {q.label}{periodYear}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="month">Select Month</Label>
              <Select
                value={periodMonth.toString()}
                onValueChange={(v) => setPeriodMonth(parseInt(v, 10))}
              >
                <SelectTrigger id="month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label} {periodYear}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Driver Selection */}
          <div className="space-y-2">
            <Label htmlFor="driver">Driver</Label>
            <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
              <SelectTrigger id="driver">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All drivers</SelectItem>
                {/* TODO: Fetch and populate actual drivers */}
              </SelectContent>
            </Select>
          </div>

          {/* Year */}
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              value={periodYear}
              onChange={(e) => setPeriodYear(parseInt(e.target.value, 10))}
              min={2020}
              max={2100}
            />
          </div>
        </div>

        {/* Tax Rate Inputs */}
        <div className="space-y-2">
          <Label>Tax Rates (per mile)</Label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {states.map((state) => (
              <div key={state} className="space-y-1">
                <Label htmlFor={`rate-${state}`}>{state}</Label>
                <Input
                  id={`rate-${state}`}
                  type="number"
                  step="0.00001"
                  value={taxRates[state] || '0'}
                  onChange={(e) =>
                    setTaxRates({ ...taxRates, [state]: e.target.value })
                  }
                  placeholder="0.0000"
                />
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Enter your tax rate for KY, NM, OR, NY, CT or leave it blank
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={handleRunReport} className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Run report
          </Button>
          <Button onClick={handleSetToDefault} variant="outline" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Set to default
          </Button>
        </div>
      </div>

      {/* Export Options */}
      {entries.length > 0 && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
        </div>
      )}

      {/* Report Table */}
      {isLoading ? (
        <div className="text-center py-8">Loading report...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No data available. Click &quot;Run report&quot; to generate.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <input type="checkbox" className="rounded" />
                </TableHead>
                <TableHead>Driver/Truck</TableHead>
                {sortedStates.map((state) => (
                  <TableHead key={state} className="text-center">
                    {state}
                    <div className="text-xs font-normal">
                      (miles, tax $, deduction $)
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-right">Total tax, $</TableHead>
                <TableHead className="text-right">Total deduction, $</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Total Row */}
              <TableRow className="font-semibold">
                <TableCell>
                  <input type="checkbox" className="rounded" />
                </TableCell>
                <TableCell>-</TableCell>
                {sortedStates.map((state) => {
                  const stateData = totals.stateMileages[state] || {
                    miles: 0,
                    tax: 0,
                    deduction: 0,
                  };
                  return (
                    <TableCell key={state} className="text-center">
                      <div>miles {stateData.miles.toFixed(2)}</div>
                      <div>tax $ {stateData.tax.toFixed(2)}</div>
                      <div>deduction $ {stateData.deduction.toFixed(2)}</div>
                    </TableCell>
                  );
                })}
                <TableCell className="text-right font-medium">
                  {formatCurrency(totals.totalTax)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(totals.totalDeduction)}
                </TableCell>
              </TableRow>

              {/* Data Rows */}
              {entries.map((entry) => (
                <TableRow key={entry.driverId}>
                  <TableCell>
                    <input type="checkbox" className="rounded" />
                  </TableCell>
                  <TableCell className="font-medium">
                    {entry.driverName} {reportType === 'TRUCK' && entry.truckNumber && `[${entry.truckNumber}]`}
                  </TableCell>
                  {sortedStates.map((state) => {
                    const stateData =
                      entry.stateMileages.find((sm) => sm.state === state) || {
                        state,
                        miles: 0,
                        tax: 0,
                        deduction: 0,
                      };
                    return (
                      <TableCell key={state} className="text-center">
                        <div>miles {stateData.miles.toFixed(2)}</div>
                        <div>tax $ {stateData.tax.toFixed(2)}</div>
                        <div>deduction $ {stateData.deduction.toFixed(2)}</div>
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right">
                    {formatCurrency(entry.totalTax)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(entry.totalDeduction)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

