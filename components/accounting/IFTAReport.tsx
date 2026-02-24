'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Download,
  FileSpreadsheet,
  Mail,
  Calculator,
  Loader2,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IFTASummaryCards } from './ifta/IFTASummaryCards';
import { IFTAStateTable } from './ifta/IFTAStateTable';
import { IFTACalculateDialog } from './ifta/IFTACalculateDialog';
import { IFTATruckBreakdown } from './ifta/IFTATruckBreakdown';
import { IFTADriverBreakdown } from './ifta/IFTADriverBreakdown';

interface IFTAReportData {
  companyId: string;
  quarter: number;
  year: number;
  periodStart: string;
  periodEnd: string;
  totalMiles: number;
  totalGallons: number;
  mpg: number;
  stateBreakdown: Array<{
    state: string;
    stateName: string;
    miles: number;
    taxableMiles: number;
    taxRate: number;
    taxDue: number;
    taxPaid: number;
    netTax: number;
  }>;
  totalTaxDue: number;
  totalTaxPaid: number;
  netTaxDue: number;
  loadsIncluded: number;
}

async function fetchIFTAReport(quarter: number, year: number) {
  const params = new URLSearchParams({ quarter: quarter.toString(), year: year.toString() });
  const response = await fetch(apiUrl(`/api/ifta/report?${params}`));
  if (!response.ok) throw new Error('Failed to fetch IFTA report');
  return response.json();
}

async function fetchIFTAByTruck(quarter: number, year: number) {
  const params = new URLSearchParams({ quarter: quarter.toString(), year: year.toString() });
  const response = await fetch(apiUrl(`/api/ifta/report/by-truck?${params}`));
  if (!response.ok) throw new Error('Failed to fetch IFTA by-truck report');
  return response.json();
}

async function fetchIFTAByDriver(quarter: number, year: number) {
  const params = new URLSearchParams({ quarter: quarter.toString(), year: year.toString() });
  const response = await fetch(apiUrl(`/api/ifta/report/by-driver?${params}`));
  if (!response.ok) throw new Error('Failed to fetch IFTA by-driver report');
  return response.json();
}

async function downloadPDF(quarter: number, year: number) {
  const response = await fetch(apiUrl(`/api/ifta/report/pdf?quarter=${quarter}&year=${year}`));
  if (!response.ok) throw new Error('Failed to download PDF');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ifta-report-Q${quarter}-${year}.pdf`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export default function IFTAReport() {
  const now = new Date();
  const [quarter, setQuarter] = useState(Math.ceil((now.getMonth() + 1) / 3));
  const [year, setYear] = useState(now.getFullYear());
  const [pdfLoading, setPdfLoading] = useState(false);
  const [calcDialogOpen, setCalcDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('fleet');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ifta-report', quarter, year],
    queryFn: () => fetchIFTAReport(quarter, year),
  });

  const { data: byTruckData, isLoading: byTruckLoading, refetch: refetchByTruck } = useQuery({
    queryKey: ['ifta-by-truck', quarter, year],
    queryFn: () => fetchIFTAByTruck(quarter, year),
    enabled: activeTab === 'by-truck',
  });

  const { data: byDriverData, isLoading: byDriverLoading, refetch: refetchByDriver } = useQuery({
    queryKey: ['ifta-by-driver', quarter, year],
    queryFn: () => fetchIFTAByDriver(quarter, year),
    enabled: activeTab === 'by-driver',
  });

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      await downloadPDF(quarter, year);
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to download PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const report: IFTAReportData | null = data?.data || null;

  const quarters = [
    { value: '1', label: 'Q1 (Jan-Mar)' },
    { value: '2', label: 'Q2 (Apr-Jun)' },
    { value: '3', label: 'Q3 (Jul-Sep)' },
    { value: '4', label: 'Q4 (Oct-Dec)' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">IFTA Report</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-sm text-sm leading-relaxed">
                <p className="font-semibold mb-1">How IFTA Works</p>
                <p className="mb-2">
                  IFTA (International Fuel Tax Agreement) requires motor carriers to report
                  miles driven and fuel purchased in each US/Canadian jurisdiction quarterly.
                </p>
                <p className="font-semibold mb-1">Steps:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li><strong>Calculate Quarter</strong> — processes delivered loads using
                    Google Maps routing to determine miles driven in each state.</li>
                  <li><strong>Run Report</strong> — aggregates state mileages and fuel
                    purchases to compute tax owed vs. tax paid per state.</li>
                  <li><strong>Download PDF</strong> — exports the report for filing.</li>
                </ol>
                <p className="mt-2 text-xs text-muted-foreground">
                  Fuel purchases are sourced from the Fuel Entries module.
                  Loads must have a driver assigned to be included.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-muted-foreground">Quarterly fuel tax reporting and state mileage breakdown</p>
      </div>

      {/* Controls */}
      <div className="border rounded-lg p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label>Quarter</Label>
            <Select value={quarter.toString()} onValueChange={(v) => setQuarter(parseInt(v, 10))}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {quarters.map((q) => (
                  <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Year</Label>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              min={2020}
              max={2100}
              className="w-[100px]"
            />
          </div>

          <Button onClick={() => { refetch(); refetchByTruck(); refetchByDriver(); }} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Run Report
          </Button>

          <Button variant="outline" onClick={() => setCalcDialogOpen(true)}>
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Quarter
          </Button>

          {report && report.stateBreakdown.length > 0 && (
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={pdfLoading}>
                {pdfLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                PDF
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" disabled>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />Excel
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Coming soon</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" disabled>
                      <Mail className="h-4 w-4 mr-2" />Email
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Coming soon</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>

      {/* Report Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="fleet">Fleet Overview</TabsTrigger>
          <TabsTrigger value="by-truck">By Truck</TabsTrigger>
          <TabsTrigger value="by-driver">By Driver</TabsTrigger>
        </TabsList>

        <TabsContent value="fleet" className="space-y-6 mt-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading report...</div>
          ) : report ? (
            report.loadsIncluded === 0 && report.stateBreakdown.length === 0 ? (
              <div className="border rounded-lg p-8 text-center space-y-3">
                <Calculator className="h-10 w-10 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-semibold">No IFTA Data for Q{report.quarter} {report.year}</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  No calculated loads found for this quarter. To generate IFTA data:
                </p>
                <ol className="text-sm text-muted-foreground text-left max-w-md mx-auto list-decimal pl-6 space-y-1">
                  <li>Ensure loads have a <strong>driver assigned</strong> and a <strong>delivery date</strong></li>
                  <li>Click <strong>Calculate Quarter</strong> to process state mileage</li>
                  <li>Click <strong>Run Report</strong> to view the results</li>
                </ol>
              </div>
            ) : (
              <>
                <IFTASummaryCards
                  totalMiles={report.totalMiles}
                  totalGallons={report.totalGallons}
                  mpg={report.mpg}
                  loadsIncluded={report.loadsIncluded}
                  totalTaxDue={report.totalTaxDue}
                  totalTaxPaid={report.totalTaxPaid}
                  netTaxDue={report.netTaxDue}
                />
                <IFTAStateTable
                  stateBreakdown={report.stateBreakdown}
                  totalTaxDue={report.totalTaxDue}
                  totalTaxPaid={report.totalTaxPaid}
                  netTaxDue={report.netTaxDue}
                />
              </>
            )
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Select a quarter and click &quot;Run Report&quot; to generate.
            </div>
          )}
        </TabsContent>

        <TabsContent value="by-truck" className="mt-4">
          {byTruckLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading per-truck data...</div>
          ) : byTruckData?.data?.trucks ? (
            <IFTATruckBreakdown
              trucks={byTruckData.data.trucks}
              quarter={quarter}
              year={year}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Select a quarter and click &quot;Run Report&quot; to generate.
            </div>
          )}
        </TabsContent>

        <TabsContent value="by-driver" className="mt-4">
          {byDriverLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading per-driver data...</div>
          ) : byDriverData?.data?.drivers ? (
            <IFTADriverBreakdown
              drivers={byDriverData.data.drivers}
              quarter={quarter}
              year={year}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Select a quarter and click &quot;Run Report&quot; to generate.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Calculate Dialog */}
      <IFTACalculateDialog
        open={calcDialogOpen}
        onOpenChange={setCalcDialogOpen}
        quarter={quarter}
        year={year}
        onComplete={() => { refetch(); refetchByTruck(); refetchByDriver(); }}
      />
    </div>
  );
}
