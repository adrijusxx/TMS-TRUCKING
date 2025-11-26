'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown, ChevronUp, Search, Filter, Settings2, Columns } from 'lucide-react';
import { apiUrl, formatDate } from '@/lib/utils';
import { DriverComplianceData } from '@/types/compliance';
import { getStatusBadgeColor, formatDaysUntilExpiration } from '@/lib/utils/compliance-status';
import McBadge from '@/components/mc-numbers/McBadge';
import DriverComplianceEditor from './DriverComplianceEditor';
import { getMcContext } from '@/lib/utils/query-keys';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQueryClient } from '@tanstack/react-query';

interface DriverComplianceTableProps {
  onRefresh?: () => void;
}

async function fetchDriverCompliance(params: {
  page?: number;
  limit?: number;
  search?: string;
  complianceStatus?: string;
  mcNumberId?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.search) queryParams.set('search', params.search);
  if (params.complianceStatus) queryParams.set('complianceStatus', params.complianceStatus);
  if (params.mcNumberId) queryParams.set('mcNumberId', params.mcNumberId);

  const response = await fetch(apiUrl(`/api/safety/driver-compliance?${queryParams}`));
  if (!response.ok) throw new Error('Failed to fetch driver compliance data');
  return response.json();
}

export default function DriverComplianceTable({ onRefresh }: DriverComplianceTableProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [complianceStatusFilter, setComplianceStatusFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const mcContext = getMcContext();
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    expand: true,
    driver: true,
    mcNumber: true,
    dqf: true,
    dqfStatus: true,
    medicalCard: true,
    medicalCardExp: true,
    medicalCardStatus: true,
    cdl: true,
    cdlExp: true,
    cdlStatus: true,
    mvr: true,
    mvrDate: true,
    mvrStatus: true,
    drugTests: true,
    drugTestDate: true,
    hos: true,
    hosStatus: true,
    compliance: true,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['driver-compliance', page, search, complianceStatusFilter, mcContext],
    queryFn: () =>
      fetchDriverCompliance({
        page,
        limit: 50,
        search: search || undefined,
        complianceStatus: complianceStatusFilter !== 'all' ? complianceStatusFilter : undefined,
      }),
  });

  const toggleRow = (driverId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(driverId)) {
        newSet.delete(driverId);
      } else {
        newSet.add(driverId);
      }
      return newSet;
    });
  };

  const handleRefresh = async () => {
    // Invalidate all driver-compliance queries regardless of parameters
    await queryClient.invalidateQueries({ 
      queryKey: ['driver-compliance'],
      exact: false // Match all queries starting with this key
    });
    // Force refetch the current query
    await refetch();
    onRefresh?.();
  };

  const drivers: DriverComplianceData[] = data?.data?.drivers || [];
  const pagination = data?.data?.pagination;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading driver compliance data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading compliance data</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Column Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search drivers..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={complianceStatusFilter}
          onValueChange={(value) => {
            setComplianceStatusFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="COMPLETE">Complete</SelectItem>
            <SelectItem value="INCOMPLETE">Incomplete</SelectItem>
            <SelectItem value="EXPIRING">Expiring</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings2 className="h-4 w-4 mr-2" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 max-h-[400px] overflow-y-auto">
            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={visibleColumns.driver}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, driver: checked })
              }
            >
              Driver
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.mcNumber}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, mcNumber: checked })
              }
            >
              MC Number
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={visibleColumns.dqf}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, dqf: checked })
              }
            >
              DQF Status
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={visibleColumns.medicalCard}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, medicalCard: checked })
              }
            >
              Medical Card
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.medicalCardExp}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, medicalCardExp: checked })
              }
            >
              Medical Card Expiration
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.medicalCardStatus}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, medicalCardStatus: checked })
              }
            >
              Medical Card Status
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={visibleColumns.cdl}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, cdl: checked })
              }
            >
              CDL
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.cdlExp}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, cdlExp: checked })
              }
            >
              CDL Expiration
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.cdlStatus}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, cdlStatus: checked })
              }
            >
              CDL Status
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={visibleColumns.mvr}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, mvr: checked })
              }
            >
              MVR
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.mvrDate}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, mvrDate: checked })
              }
            >
              MVR Pull Date
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.mvrStatus}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, mvrStatus: checked })
              }
            >
              MVR Status
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={visibleColumns.drugTests}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, drugTests: checked })
              }
            >
              Drug Tests
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.drugTestDate}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, drugTestDate: checked })
              }
            >
              Last Drug Test Date
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={visibleColumns.hos}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, hos: checked })
              }
            >
              HOS
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.hosStatus}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, hosStatus: checked })
              }
            >
              HOS Status
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={visibleColumns.compliance}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, compliance: checked })
              }
            >
              Overall Compliance
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.expand && <TableHead className="w-12"></TableHead>}
              {visibleColumns.driver && <TableHead>Driver</TableHead>}
              {visibleColumns.mcNumber && <TableHead>MC Number</TableHead>}
              {visibleColumns.dqf && <TableHead>DQF Status</TableHead>}
              {visibleColumns.medicalCard && <TableHead>Medical Card</TableHead>}
              {visibleColumns.medicalCardExp && <TableHead>Medical Card Exp</TableHead>}
              {visibleColumns.medicalCardStatus && <TableHead>Medical Status</TableHead>}
              {visibleColumns.cdl && <TableHead>CDL</TableHead>}
              {visibleColumns.cdlExp && <TableHead>CDL Expiration</TableHead>}
              {visibleColumns.cdlStatus && <TableHead>CDL Status</TableHead>}
              {visibleColumns.mvr && <TableHead>MVR</TableHead>}
              {visibleColumns.mvrDate && <TableHead>MVR Pull Date</TableHead>}
              {visibleColumns.mvrStatus && <TableHead>MVR Status</TableHead>}
              {visibleColumns.drugTests && <TableHead>Drug Tests</TableHead>}
              {visibleColumns.drugTestDate && <TableHead>Last Drug Test</TableHead>}
              {visibleColumns.hos && <TableHead>HOS</TableHead>}
              {visibleColumns.hosStatus && <TableHead>HOS Status</TableHead>}
              {visibleColumns.compliance && <TableHead>Compliance</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={
                    Object.values(visibleColumns).filter(Boolean).length
                  } 
                  className="text-center py-8 text-muted-foreground"
                >
                  No drivers found
                </TableCell>
              </TableRow>
            ) : (
              drivers.map((driver) => {
                const isExpanded = expandedRows.has(driver.driverId);
                const colSpan = Object.values(visibleColumns).filter(Boolean).length;
                return (
                  <React.Fragment key={driver.driverId}>
                    <TableRow className="hover:bg-muted/50">
                      {visibleColumns.expand && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRow(driver.driverId)}
                            type="button"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      )}
                      {visibleColumns.driver && (
                        <TableCell>
                          <div>
                            <div className="font-medium">{driver.driverName}</div>
                            <div className="text-sm text-muted-foreground">{driver.driverNumber}</div>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.mcNumber && (
                        <TableCell>
                          <McBadge mcNumber={driver.mcNumber} size="sm" />
                        </TableCell>
                      )}
                      {visibleColumns.dqf && (
                        <TableCell>
                          <Badge className={getStatusBadgeColor(driver.statusSummary.dqf.status)}>
                            {driver.statusSummary.dqf.status}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.medicalCard && (
                        <TableCell>
                          {driver.medicalCard ? (
                            <Badge className={getStatusBadgeColor(driver.statusSummary.medicalCard.status)}>
                              {formatDaysUntilExpiration(driver.statusSummary.medicalCard.daysUntilExpiration)}
                            </Badge>
                          ) : (
                            <Badge className={getStatusBadgeColor('MISSING')}>Missing</Badge>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.medicalCardExp && (
                        <TableCell>
                          {driver.medicalCard ? (
                            <div className="text-sm">{formatDate(driver.medicalCard.expirationDate)}</div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.medicalCardStatus && (
                        <TableCell>
                          <Badge className={getStatusBadgeColor(driver.statusSummary.medicalCard.status)}>
                            {driver.statusSummary.medicalCard.status}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.cdl && (
                        <TableCell>
                          {driver.cdl ? (
                            <Badge className={getStatusBadgeColor(driver.statusSummary.cdl.status)}>
                              {formatDaysUntilExpiration(driver.statusSummary.cdl.daysUntilExpiration)}
                            </Badge>
                          ) : (
                            <Badge className={getStatusBadgeColor('MISSING')}>Missing</Badge>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.cdlExp && (
                        <TableCell>
                          {driver.cdl ? (
                            <div className="text-sm">{formatDate(driver.cdl.expirationDate)}</div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.cdlStatus && (
                        <TableCell>
                          <Badge className={getStatusBadgeColor(driver.statusSummary.cdl.status)}>
                            {driver.statusSummary.cdl.status}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.mvr && (
                        <TableCell>
                          {driver.mvr ? (
                            <div>
                              {driver.mvr.violations.length > 0 && (
                                <div className="text-xs text-destructive mb-1">
                                  {driver.mvr.violations.length} violation(s)
                                </div>
                              )}
                              <Badge className={getStatusBadgeColor(driver.statusSummary.mvr.status)}>
                                {driver.statusSummary.mvr.status}
                              </Badge>
                            </div>
                          ) : (
                            <Badge className={getStatusBadgeColor('MISSING')}>Missing</Badge>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.mvrDate && (
                        <TableCell>
                          {driver.mvr ? (
                            <div className="text-sm">{formatDate(driver.mvr.pullDate)}</div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.mvrStatus && (
                        <TableCell>
                          <Badge className={getStatusBadgeColor(driver.statusSummary.mvr.status)}>
                            {driver.statusSummary.mvr.status}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.drugTests && (
                        <TableCell>
                          {driver.recentDrugTests.length > 0 ? (
                            <Badge className="bg-green-100 text-green-800">
                              {driver.recentDrugTests.length} test(s)
                            </Badge>
                          ) : (
                            <Badge className={getStatusBadgeColor('MISSING')}>Missing</Badge>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.drugTestDate && (
                        <TableCell>
                          {driver.recentDrugTests.length > 0 ? (
                            <div className="text-sm">{formatDate(driver.recentDrugTests[0].testDate)}</div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.hos && (
                        <TableCell>
                          <Badge className={getStatusBadgeColor(driver.statusSummary.hos.status)}>
                            {driver.hos.compliancePercentage}%
                          </Badge>
                          {driver.hos.violations.length > 0 && (
                            <div className="text-xs text-destructive mt-1">
                              {driver.hos.violations.length} violation(s)
                            </div>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.hosStatus && (
                        <TableCell>
                          <Badge className={getStatusBadgeColor(driver.statusSummary.hos.status)}>
                            {driver.statusSummary.hos.status}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.compliance && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <div className="text-sm font-medium">{driver.overallCompliance}%</div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    driver.overallCompliance >= 80
                                      ? 'bg-green-500'
                                      : driver.overallCompliance >= 60
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                  }`}
                                  style={{ width: `${driver.overallCompliance}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={colSpan} className="p-0 bg-muted/30">
                          <DriverComplianceEditor
                            driver={driver}
                            onSave={handleRefresh}
                            onCancel={() => toggleRow(driver.driverId)}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, pagination.total)} of {pagination.total} drivers
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

