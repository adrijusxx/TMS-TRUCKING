'use client';

import { useQuery } from '@tanstack/react-query';
import { apiUrl, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Cake, Gavel, Users, ShieldCheck, FileWarning, FileCheck, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface OverviewData {
  birthdays: Array<{ id: string; firstName: string | null; lastName: string | null; birthDate: string }>;
  courtDates: Array<{
    id: string; citationNumber: string; courtDate: string; courtLocation?: string;
    driver?: { id: string; user: { firstName: string; lastName: string } } | null;
  }>;
  tasksPerDriver: Array<{ driverId: string; firstName: string | null; lastName: string | null; count: number }>;
  complianceReport: { totalSafetyTasks: number; openInsuranceClaims: number; recentInspections: number };
  documentExpiry: { expired: number; dueSoon: number; upcoming: number };
  accidentHistory: { total: number; dotReportable: number; nonReportable: number; periodYears: number };
}

export default function SafetyOverviewTab() {
  const { data, isLoading } = useQuery<OverviewData>({
    queryKey: ['safety-overview'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/safety/overview'));
      if (!res.ok) throw new Error('Failed to fetch overview');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground">No data available</p>;

  const totalTasks = data.tasksPerDriver.reduce((acc, d) => acc + d.count, 0);

  return (
    <div className="space-y-6">
      {/* Row 1: Birthdays, Court Dates, Tasks per Driver */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Cake className="h-4 w-4 text-primary" />
              Driver Birthdays in the Next 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.birthdays.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming birthdays</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Driver</TableHead><TableHead>Birthday date</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {data.birthdays.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="text-primary">{b.firstName} {b.lastName}</TableCell>
                      <TableCell>{formatDate(b.birthDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gavel className="h-4 w-4 text-primary" />
              Ticket Court Dates in the Next 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.courtDates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming court dates</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Driver</TableHead><TableHead>Court date</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {data.courtDates.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-primary">
                        {c.driver ? `${c.driver.user.firstName} ${c.driver.user.lastName}` : '-'}
                      </TableCell>
                      <TableCell>{formatDate(c.courtDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Number of safety tasks per driver
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.tasksPerDriver.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Driver</TableHead><TableHead className="text-right">Tasks</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.tasksPerDriver.slice(0, 10).map((d) => (
                      <TableRow key={d.driverId}>
                        <TableCell className="text-primary">{d.firstName} {d.lastName}</TableCell>
                        <TableCell className="text-right">{d.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-between mt-2 font-bold text-sm">
                  <span>TOTAL</span>
                  <span>{totalTasks}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Compliance Report, Document Expiry, Accident History */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Compliance Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-2xl font-bold">{data.complianceReport.totalSafetyTasks}</span>
              <span className="text-sm text-muted-foreground">Number of safety tasks</span>
            </div>
            <div className="flex justify-between">
              <span className="text-2xl font-bold">{data.complianceReport.openInsuranceClaims}</span>
              <span className="text-sm text-muted-foreground">Number of open claims</span>
            </div>
            <div className="flex justify-between">
              <span className="text-2xl font-bold">{data.complianceReport.recentInspections}</span>
              <span className="text-sm text-muted-foreground">Number of open inspections</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileWarning className="h-4 w-4 text-primary" />
              Documents expiry date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Expired</span>
                <span className="text-xl font-bold text-red-500">{data.documentExpiry.expired}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Due soon (30 days)</span>
                <span className="text-xl font-bold text-yellow-500">{data.documentExpiry.dueSoon}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Upcoming (90 days)</span>
                <span className="text-xl font-bold text-green-500">{data.documentExpiry.upcoming}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              Accident within the last {data.accidentHistory.periodYears} years
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total accidents</span>
                <span className="text-xl font-bold">{data.accidentHistory.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-blue-500 inline-block" /> Reportable
                </span>
                <span className="text-xl font-bold">{data.accidentHistory.dotReportable}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500 inline-block" /> Non-reportable
                </span>
                <span className="text-xl font-bold">{data.accidentHistory.nonReportable}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
