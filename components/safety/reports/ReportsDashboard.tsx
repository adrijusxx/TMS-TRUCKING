'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiUrl, formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Shield, DollarSign, Users } from 'lucide-react';

export default function ReportsDashboard() {
  const [reportType, setReportType] = useState('INCIDENT_TRENDS');
  const [months, setMonths] = useState('12');

  const { data, isLoading } = useQuery({
    queryKey: ['safety-reports', reportType, months],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/safety/reports?reportType=${reportType}&months=${months}`));
      if (!res.ok) throw new Error('Failed to fetch report');
      return res.json();
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={months} onValueChange={setMonths}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={reportType} onValueChange={setReportType}>
        <TabsList>
          <TabsTrigger value="INCIDENT_TRENDS"><BarChart3 className="h-4 w-4 mr-2" />Incidents</TabsTrigger>
          <TabsTrigger value="COMPLIANCE_STATUS"><Shield className="h-4 w-4 mr-2" />Compliance</TabsTrigger>
          <TabsTrigger value="COST_ANALYSIS"><DollarSign className="h-4 w-4 mr-2" />Costs</TabsTrigger>
          <TabsTrigger value="DRIVER_PERFORMANCE"><Users className="h-4 w-4 mr-2" />Drivers</TabsTrigger>
        </TabsList>

        <TabsContent value="INCIDENT_TRENDS" className="space-y-4">
          {isLoading ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">Loading...</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {(data?.data ?? []).map((item: { month: string; count: number; value: number }) => (
                <Card key={item.month}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">{item.month}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{item.count}</div>
                    <p className="text-xs text-muted-foreground">incidents | {formatCurrency(item.value)} cost</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="COMPLIANCE_STATUS" className="space-y-4">
          {isLoading ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">Loading...</CardContent></Card>
          ) : data?.data ? (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Drivers</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{data.data.totalDrivers}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Compliant</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-green-600">{data.data.compliantDrivers}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Compliance Rate</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{data.data.compliancePercentage}%</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Expired Docs</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-red-600">{data.data.expiredDocuments}</div></CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="COST_ANALYSIS" className="space-y-4">
          {isLoading ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">Loading...</CardContent></Card>
          ) : data?.data ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Incident Costs</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(data.data.incidentCosts?.total ?? 0)}</div>
                    <div className="mt-2 space-y-1">
                      {(data.data.incidentCosts?.items ?? []).map((item: { label: string; amount: number; count: number }) => (
                        <div key={item.label} className="flex justify-between text-sm">
                          <span>{item.label.replace(/_/g, ' ')}</span>
                          <span>{formatCurrency(item.amount)} ({item.count})</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Claim Costs</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(data.data.claimCosts?.total ?? 0)}</div>
                    <div className="mt-2 space-y-1">
                      {(data.data.claimCosts?.items ?? []).map((item: { label: string; amount: number; count: number }) => (
                        <div key={item.label} className="flex justify-between text-sm">
                          <span>{item.label.replace(/_/g, ' ')}</span>
                          <span>{formatCurrency(item.amount)} ({item.count})</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader><CardTitle>Monthly Cost Trends</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid gap-2 md:grid-cols-6">
                    {(data.data.costTrends ?? []).slice(-6).map((t: { month: string; value: number; count: number }) => (
                      <div key={t.month} className="text-center p-2 rounded border">
                        <div className="text-xs text-muted-foreground">{t.month}</div>
                        <div className="text-sm font-bold">{formatCurrency(t.value)}</div>
                        <div className="text-xs text-muted-foreground">{t.count} events</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="DRIVER_PERFORMANCE" className="space-y-4">
          {isLoading ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">Loading...</CardContent></Card>
          ) : (
            <Card>
              <CardHeader><CardTitle>Cost Per Driver</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(data?.data ?? []).map((d: { driverId: string; driverName: string; incidentCost: number; claimCost: number; citationCost: number; totalCost: number }) => (
                    <div key={d.driverId} className="flex items-center justify-between border-b pb-2">
                      <span className="font-medium">{d.driverName}</span>
                      <div className="flex gap-4 text-sm">
                        <span>Incidents: {formatCurrency(d.incidentCost)}</span>
                        <span>Claims: {formatCurrency(d.claimCost)}</span>
                        <span>Citations: {formatCurrency(d.citationCost)}</span>
                        <Badge variant="outline" className="font-bold">{formatCurrency(d.totalCost)}</Badge>
                      </div>
                    </div>
                  ))}
                  {(data?.data ?? []).length === 0 && <p className="text-center text-muted-foreground">No cost data found for this period</p>}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
