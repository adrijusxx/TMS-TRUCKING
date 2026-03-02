import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { getStatusBadgeColor } from '@/lib/utils/compliance-status';
import McBadge from '@/components/mc-numbers/McBadge';
import type { ExtendedColumnDef, FilterDefinition } from '@/components/data-table/types';

export function createDriverComplianceColumns(dispatcherMode = false): ExtendedColumnDef<any>[] {
  return [
    {
      id: 'driver',
      accessorKey: 'driverName',
      header: 'Driver',
      required: true,
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.driverName}</div>
          <div className="text-sm text-muted-foreground">{row.original.driverNumber}</div>
        </div>
      ),
    },
    {
      id: 'mcNumber',
      accessorKey: 'mcNumber',
      header: 'MC Number',
      defaultVisible: !dispatcherMode,
      cell: ({ row }) => <McBadge mcNumber={row.original.mcNumber} size="sm" />,
    },
    {
      id: 'dqf',
      accessorKey: 'statusSummary.dqf.status',
      header: 'DQF Status',
      defaultVisible: !dispatcherMode,
      cell: ({ row }) => (
        <Badge className={getStatusBadgeColor(row.original.statusSummary?.dqf?.status)}>
          {row.original.statusSummary?.dqf?.status}
        </Badge>
      ),
    },
    {
      id: 'medicalCard',
      accessorKey: 'statusSummary.medicalCard.status',
      header: 'Medical Card',
      defaultVisible: !dispatcherMode,
      cell: ({ row }) =>
        row.original.medicalCard ? (
          <div className="flex items-center gap-2">
            <Badge className={getStatusBadgeColor(row.original.statusSummary?.medicalCard?.status)}>
              {row.original.statusSummary?.medicalCard?.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {formatDate(row.original.medicalCard.expirationDate)}
            </span>
          </div>
        ) : (
          <Badge className={getStatusBadgeColor('MISSING')}>Missing</Badge>
        ),
    },
    {
      id: 'cdl',
      accessorKey: 'statusSummary.cdl.status',
      header: 'CDL',
      cell: ({ row }) =>
        row.original.cdl ? (
          <div className="flex items-center gap-2">
            <Badge className={getStatusBadgeColor(row.original.statusSummary?.cdl?.status)}>
              {row.original.statusSummary?.cdl?.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {formatDate(row.original.cdl.expirationDate)}
            </span>
          </div>
        ) : (
          <Badge className={getStatusBadgeColor('MISSING')}>Missing</Badge>
        ),
    },
    {
      id: 'mvr',
      accessorKey: 'statusSummary.mvr.status',
      header: 'MVR',
      defaultVisible: !dispatcherMode,
      cell: ({ row }) =>
        row.original.mvr ? (
          <div className="flex items-center gap-2">
            <Badge className={getStatusBadgeColor(row.original.statusSummary?.mvr?.status)}>
              {row.original.statusSummary?.mvr?.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {formatDate(row.original.mvr.pullDate)}
            </span>
          </div>
        ) : (
          <Badge className={getStatusBadgeColor('MISSING')}>Missing</Badge>
        ),
    },
    {
      id: 'drugTests',
      accessorKey: 'recentDrugTests',
      header: 'Drug Tests',
      defaultVisible: !dispatcherMode,
      cell: ({ row }) =>
        row.original.recentDrugTests?.length > 0 ? (
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800">
              {row.original.recentDrugTests.length} test(s)
            </Badge>
            <span className="text-sm text-muted-foreground">
              {formatDate(row.original.recentDrugTests[0].testDate)}
            </span>
          </div>
        ) : (
          <Badge className={getStatusBadgeColor('MISSING')}>Missing</Badge>
        ),
    },
    {
      id: 'hos',
      accessorKey: 'hos.compliancePercentage',
      header: 'HOS',
      defaultVisible: !dispatcherMode,
      cell: ({ row }) => (
        <div>
          <Badge className={getStatusBadgeColor(row.original.statusSummary?.hos?.status)}>
            {row.original.hos?.compliancePercentage}%
          </Badge>
          {row.original.hos?.violations?.length > 0 && (
            <div className="text-xs text-destructive mt-1">
              {row.original.hos.violations.length} violation(s)
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'hosStatus',
      accessorKey: 'statusSummary.hos.status',
      header: 'HOS Status',
      defaultVisible: !dispatcherMode,
      cell: ({ row }) => (
        <Badge className={getStatusBadgeColor(row.original.statusSummary?.hos?.status)}>
          {row.original.statusSummary?.hos?.status}
        </Badge>
      ),
    },
    {
      id: 'compliance',
      accessorKey: 'overallCompliance',
      header: 'Compliance',
      defaultVisible: !dispatcherMode,
      cell: ({ row }) => {
        const pct = row.original.overallCompliance ?? 0;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="text-sm font-medium">{pct}%</div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        );
      },
    },
  ];
}

export const driverComplianceFilterDefinitions: FilterDefinition[] = [
  {
    key: 'complianceStatus',
    label: 'Compliance Status',
    type: 'select',
    options: [
      { value: 'COMPLETE', label: 'Complete' },
      { value: 'INCOMPLETE', label: 'Incomplete' },
      { value: 'EXPIRING', label: 'Expiring' },
      { value: 'EXPIRED', label: 'Expired' },
    ],
  },
];
