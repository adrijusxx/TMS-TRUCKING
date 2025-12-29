'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Clock, TrendingUp, Calendar } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

interface HOSRecord {
  id: string;
  date: string;
  drivingHours: number;
  onDutyHours: number;
  offDutyHours: number;
  sleeperBerthHours: number;
  totalHours: number;
  violations: Array<{
    id: string;
    violationType: string;
    violationDescription: string;
    violationDate: string;
    hoursExceeded: number | null;
  }>;
}

interface HOSViolation {
  id: string;
  violationDate: string;
  violationType: string;
  violationDescription: string;
  hoursExceeded: number | null;
}

interface HOSDashboardProps {
  driverId: string;
}

async function fetchHOSRecords(driverId: string, startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  params.set('includeViolations', 'true');

  const response = await fetch(apiUrl(`/api/safety/drivers/${driverId}/hos?${params}`));
  if (!response.ok) throw new Error('Failed to fetch HOS records');
  return response.json() as Promise<{ hosRecords: HOSRecord[] }>;
}

async function fetchHOSViolations(driverId: string, startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  const response = await fetch(
    apiUrl(`/api/safety/drivers/${driverId}/hos/violations?${params}`)
  );
  if (!response.ok) throw new Error('Failed to fetch HOS violations');
  return response.json() as Promise<{ violations: HOSViolation[] }>;
}

export default function HOSDashboard({ driverId }: HOSDashboardProps) {
  const [dateRange, setDateRange] = useState('7'); // Last 7 days
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const calculateDateRange = (days: string) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - parseInt(days));
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  useEffect(() => {
    calculateDateRange(dateRange);
  }, [dateRange]);

  const { data: hosData, isLoading: hosLoading } = useQuery({
    queryKey: ['hos-records', driverId, startDate, endDate],
    queryFn: () => fetchHOSRecords(driverId, startDate, endDate),
    enabled: !!startDate && !!endDate
  });

  const { data: violationsData, isLoading: violationsLoading } = useQuery({
    queryKey: ['hos-violations', driverId, startDate, endDate],
    queryFn: () => fetchHOSViolations(driverId, startDate, endDate),
    enabled: !!startDate && !!endDate
  });

  if (hosLoading || violationsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading HOS data...</div>
      </div>
    );
  }

  const hosRecords = hosData?.hosRecords || [];
  const violations = violationsData?.violations || [];

  // Calculate statistics
  const totalDrivingHours = hosRecords.reduce((sum, record) => sum + record.drivingHours, 0);
  const totalOnDutyHours = hosRecords.reduce((sum, record) => sum + record.onDutyHours, 0);
  const averageDrivingHours =
    hosRecords.length > 0 ? totalDrivingHours / hosRecords.length : 0;
  const violationCount = violations.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hours of Service</h2>
          <p className="text-muted-foreground">HOS records and violation tracking</p>
        </div>
        <div className="flex gap-4">
          <Select
            value={dateRange}
            onValueChange={(value) => {
              setDateRange(value);
              calculateDateRange(value);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Driving Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDrivingHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {hosRecords.length} day(s) tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total On-Duty Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOnDutyHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">On-duty time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Driving Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageDrivingHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">Per day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${violationCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {violationCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">In selected period</p>
          </CardContent>
        </Card>
      </div>

      {/* Violations Alert */}
      {violations.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              HOS Violations ({violations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {violations.map((violation) => (
                <div
                  key={violation.id}
                  className="p-3 bg-white dark:bg-gray-900 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{violation.violationType}</div>
                      <div className="text-sm text-muted-foreground">
                        {violation.violationDescription}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDate(violation.violationDate)}
                        {violation.hoursExceeded && ` • ${violation.hoursExceeded} hours exceeded`}
                      </div>
                    </div>
                    <Badge className="bg-red-100 text-red-800">Violation</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* HOS Records */}
      <Card>
        <CardHeader>
          <CardTitle>HOS Records</CardTitle>
          <CardDescription>Daily hours of service records</CardDescription>
        </CardHeader>
        <CardContent>
          {hosRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No HOS records for selected period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {hosRecords.map((record) => (
                <div key={record.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium">{formatDate(record.date)}</div>
                    {record.violations.length > 0 && (
                      <Badge className="bg-red-100 text-red-800">
                        {record.violations.length} Violation(s)
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-5 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Driving</div>
                      <div className="font-medium">{record.drivingHours.toFixed(1)}h</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">On-Duty</div>
                      <div className="font-medium">{record.onDutyHours.toFixed(1)}h</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Off-Duty</div>
                      <div className="font-medium">{record.offDutyHours.toFixed(1)}h</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Sleeper</div>
                      <div className="font-medium">{record.sleeperBerthHours.toFixed(1)}h</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total</div>
                      <div className="font-medium">{record.totalHours.toFixed(1)}h</div>
                    </div>
                  </div>
                  {record.violations.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm font-medium text-red-600 mb-2">Violations:</div>
                      {record.violations.map((violation) => (
                        <div key={violation.id} className="text-sm text-muted-foreground">
                          • {violation.violationDescription}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

