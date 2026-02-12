'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { formatCurrency, apiUrl } from '@/lib/utils';
import { formatCurrencyForExport } from '@/lib/export';
import { TrendingUp, Building2, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import ExportButton from './ExportButton';

async function fetchProfitability(groupBy: string, startDate: string, endDate: string) {
  const response = await fetch(
    apiUrl(`/api/analytics/profitability?groupBy=${groupBy}&startDate=${startDate}&endDate=${endDate}`)
  );
  if (!response.ok) throw new Error('Failed to fetch profitability data');
  return response.json();
}

export default function ProfitabilityAnalysis() {
  const [groupBy, setGroupBy] = useState<'customer' | 'lane'>('customer');
  const [startDate, setStartDate] = useState(
    format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data, isLoading } = useQuery({
    queryKey: ['profitability', groupBy, startDate, endDate],
    queryFn: () => fetchProfitability(groupBy, startDate, endDate),
  });

  const results = data?.data?.breakdown || [];
  const summary = data?.data?.summary;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Group By</Label>
              <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as 'customer' | 'lane')}>
                <TabsList className="w-full">
                  <TabsTrigger value="customer" className="flex-1">
                    Customer
                  </TabsTrigger>
                  <TabsTrigger value="lane" className="flex-1">
                    Lane
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalGrossProfit)}</div>
              <p className="text-xs text-muted-foreground">Before fixed expenses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Est. Fixed Costs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(summary.totalFixedCosts)}</div>
              <p className="text-xs text-muted-foreground">Trucks, Salaries, Insurance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.totalNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.totalNetProfit)}
              </div>
              <p className="text-xs text-muted-foreground">Actual Bottom Line</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Profitability by {groupBy === 'customer' ? 'Customer' : 'Lane'}
              </CardTitle>
              <CardDescription>
                Ranked by total profit
              </CardDescription>
            </div>
            {results.length > 0 && (
              <ExportButton
                data={results.map((item: any) => ({
                  [groupBy === 'customer' ? 'Customer' : 'Lane']: groupBy === 'customer' ? item.customerName : item.lane,
                  'Total Loads': item.totalLoads,
                  'Total Revenue': formatCurrencyForExport(item.totalRevenue),
                  'Total Driver Pay': formatCurrencyForExport(item.totalDriverPay),
                  'Total Expenses': formatCurrencyForExport(item.totalExpenses),
                  'Total Profit': formatCurrencyForExport(item.totalProfit),
                  'Avg Profit/Load': formatCurrencyForExport(item.averageProfitPerLoad),
                }))}
                filename={`profitability-${groupBy}-${startDate}-${endDate}`}
                headers={groupBy === 'customer'
                  ? ['Customer', 'Total Loads', 'Total Revenue', 'Total Driver Pay', 'Total Expenses', 'Total Profit', 'Avg Profit/Load']
                  : ['Lane', 'Total Loads', 'Total Revenue', 'Total Driver Pay', 'Total Expenses', 'Total Profit', 'Avg Profit/Load']}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading profitability data...</div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No data available for the selected period
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {groupBy === 'customer' ? (
                      <>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Loads</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Gross Profit</TableHead>
                        <TableHead className="text-right">Est. Fixed Costs</TableHead>
                        <TableHead className="text-right">Net Profit</TableHead>
                        <TableHead className="text-right">Net Margin</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead>Lane</TableHead>
                        <TableHead className="text-right">Loads</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Gross Profit</TableHead>
                        <TableHead className="text-right">Est. Fixed Costs</TableHead>
                        <TableHead className="text-right">Net Profit</TableHead>
                        <TableHead className="text-right">Net Margin</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((item: any, idx: number) => (
                    <TableRow key={idx}>
                      {groupBy === 'customer' ? (
                        <TableCell className="font-medium">
                          {item.customerName}
                        </TableCell>
                      ) : (
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.lane}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.origin} → {item.destination}
                            </div>
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="text-right">{item.loads}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                      <TableCell className="text-right text-blue-600">{formatCurrency(item.profit)}</TableCell>
                      <TableCell className="text-right text-orange-600">-{formatCurrency(item.allocatedFixedCost)}</TableCell>
                      <TableCell className={`text-right font-bold ${item.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(item.netProfit)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.netMargin >= 10 ? 'bg-green-100 text-green-800' :
                            item.netMargin >= 0 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                          }`}>
                          {item.netMargin?.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

