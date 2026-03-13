'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { DriverSchedule, WeeklyData } from './load-board-types';
import { STATUS_COLORS, LOAD_STATUS_COLORS } from './load-board-types';

interface LoadBoardWeekTableProps {
  drivers: DriverSchedule[];
  weekDays: Date[];
  stats?: WeeklyData['overallStats'];
}

export default function LoadBoardWeekTable({ drivers, weekDays, stats }: LoadBoardWeekTableProps) {
  const todayKey = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="border rounded overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="text-left py-1.5 px-2 font-medium sticky left-0 bg-muted/50 z-10 min-w-[140px]">Driver</th>
              <th className="text-left py-1.5 px-1.5 font-medium min-w-[70px]">Status</th>
              <th className="text-left py-1.5 px-1.5 font-medium min-w-[55px]">Truck</th>
              <th className="text-right py-1.5 px-1.5 font-medium min-w-[60px]">Gross</th>
              <th className="text-right py-1.5 px-1.5 font-medium min-w-[50px]">Miles</th>
              <th className="text-right py-1.5 px-1.5 font-medium min-w-[45px]">RPM</th>
              {weekDays.map((day) => {
                const dayKey = format(day, 'yyyy-MM-dd');
                return (
                  <th
                    key={dayKey}
                    className={cn(
                      'text-center py-1.5 px-1.5 font-medium min-w-[110px]',
                      dayKey === todayKey && 'bg-primary/10'
                    )}
                  >
                    <div className="text-[10px] text-muted-foreground">{format(day, 'EEE')}</div>
                    <div>{format(day, 'd')}</div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {drivers.map((schedule) => {
              const rpm = schedule.summary.totalMiles > 0
                ? schedule.summary.totalGross / schedule.summary.totalMiles : 0;

              return (
                <tr key={schedule.driver.id} className="border-b hover:bg-muted/30 even:bg-muted/10">
                  <td className="py-1.5 px-2 sticky left-0 bg-background z-10">
                    <Link href={`/dashboard/drivers/${schedule.driver.driverNumber || schedule.driver.id}`} prefetch={false} className="hover:underline font-medium">
                      {schedule.driver.firstName} {schedule.driver.lastName}
                    </Link>
                  </td>
                  <td className="py-1.5 px-1.5">
                    <Badge variant="secondary" className={cn('text-[10px] h-4 px-1', STATUS_COLORS[schedule.driver.status] || 'bg-gray-100')}>
                      {schedule.driver.status?.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="py-1.5 px-1.5 text-muted-foreground">
                    {schedule.driver.currentTruck?.truckNumber || '-'}
                  </td>
                  <td className="py-1.5 px-1.5 text-right font-medium">
                    {formatCurrency(schedule.summary.totalGross)}
                  </td>
                  <td className="py-1.5 px-1.5 text-right text-muted-foreground">
                    {schedule.summary.totalMiles.toLocaleString()}
                  </td>
                  <td className={cn(
                    'py-1.5 px-1.5 text-right font-medium',
                    rpm >= 3 ? 'text-green-600' : rpm >= 2 ? 'text-amber-600' : 'text-red-600'
                  )}>
                    ${rpm.toFixed(2)}
                  </td>

                  {weekDays.map((day) => {
                    const dayKey = format(day, 'yyyy-MM-dd');
                    const loads = schedule.loadsByDate[dayKey] || [];
                    const isToday = dayKey === todayKey;

                    return (
                      <td key={dayKey} className={cn('py-1.5 px-1.5 text-center', isToday && 'bg-primary/5')}>
                        {loads.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {loads.slice(0, 2).map((load) => (
                              <Link
                                key={load.id}
                                href={`/dashboard/loads/${load.loadNumber || load.id}`}
                                prefetch={false}
                                className={cn(
                                  'block px-1 py-1 rounded truncate hover:opacity-80',
                                  LOAD_STATUS_COLORS[load.status] || 'bg-gray-100'
                                )}
                                title={`${load.loadNumber}: ${load.pickupCity || ''}, ${load.pickupState || ''} → ${load.deliveryCity || ''}, ${load.deliveryState || ''}`}
                              >
                                <div className="text-[10px] font-semibold">
                                  {load.pickupState || '?'}→{load.deliveryState || '?'}
                                </div>
                                <div className="text-[9px] text-muted-foreground">{load.loadNumber}</div>
                                <div className="text-[9px] text-green-500 font-semibold">{formatCurrency(load.revenue)}</div>
                              </Link>
                            ))}
                            {loads.length > 2 && (
                              <span className="text-[9px] text-muted-foreground">+{loads.length - 2}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/20">&middot;</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {drivers.length === 0 && (
              <tr>
                <td colSpan={13} className="py-6 text-center text-muted-foreground text-xs">
                  No drivers found
                </td>
              </tr>
            )}
          </tbody>

          {stats && drivers.length > 0 && (
            <tfoot>
              <tr className="bg-muted/50 border-t font-medium">
                <td className="py-1.5 px-2 sticky left-0 bg-muted/50 z-10">
                  Total ({drivers.length})
                </td>
                <td className="py-1.5 px-1.5" />
                <td className="py-1.5 px-1.5" />
                <td className="py-1.5 px-1.5 text-right">{formatCurrency(stats.totalGross)}</td>
                <td className="py-1.5 px-1.5 text-right">{stats.totalMiles.toLocaleString()}</td>
                <td className="py-1.5 px-1.5 text-right">${stats.averageRate}</td>
                {weekDays.map((day) => <td key={format(day, 'yyyy-MM-dd')} className="py-1.5 px-1.5" />)}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
