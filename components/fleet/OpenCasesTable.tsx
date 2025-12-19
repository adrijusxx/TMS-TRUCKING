'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertTriangle, Clock, Truck, User, Phone, ChevronDown, ChevronRight,
  RefreshCw, MoreHorizontal, ExternalLink, Users, DollarSign, Edit, Filter, X,
} from 'lucide-react';
import { apiUrl, cn } from '@/lib/utils';
import InlineCaseEditor from './InlineCaseEditor';

interface Assignment {
  id: string;
  userId: string;
  role?: string;
  user: { id: string; firstName: string; lastName: string; email: string; phone?: string; role: string };
}

interface Payment {
  id: string;
  paymentNumber: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
}

interface Breakdown {
  id: string;
  breakdownNumber: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
  breakdownType: string;
  location: string;
  description: string;
  timeElapsed: string;
  serviceProvider?: string;
  serviceContact?: string;
  repairCost?: number;
  towingCost?: number;
  laborCost?: number;
  partsCost?: number;
  otherCosts?: number;
  totalCost: number;
  isDriverChargeable?: boolean;
  driverChargeNotes?: string;
  resolution?: string;
  repairNotes?: string;
  truck: { id: string; truckNumber: string; make?: string; model?: string };
  driver?: { id: string; driverNumber: string; user: { id: string; firstName: string; lastName: string; phone?: string; email?: string } } | null;
  assignments?: Assignment[];
  payments?: Payment[];
  totalPaid?: number;
}

interface ActiveBreakdownsData {
  breakdowns: Breakdown[];
  stats: { total: number };
}

async function fetchActiveBreakdowns() {
  const response = await fetch(apiUrl('/api/fleet/breakdowns/active'));
  if (!response.ok) throw new Error('Failed to fetch active breakdowns');
  return response.json();
}

const getPriorityBadge = (priority: string) => {
  const config: Record<string, { label: string; className: string }> = {
    CRITICAL: { label: 'CRIT', className: 'bg-red-500 text-white' },
    HIGH: { label: 'HIGH', className: 'bg-orange-500 text-white' },
    MEDIUM: { label: 'MED', className: 'bg-yellow-500 text-white' },
    LOW: { label: 'LOW', className: 'bg-blue-500 text-white' },
  };
  const { label, className } = config[priority] || { label: priority, className: '' };
  return <Badge className={cn(className, 'text-[10px] h-4 px-1.5 font-medium')}>{label}</Badge>;
};

const getStatusBadge = (status: string) => {
  const colors: Record<string, string> = {
    REPORTED: 'bg-gray-500',
    DISPATCHED: 'bg-blue-500',
    IN_PROGRESS: 'bg-yellow-500',
    WAITING_PARTS: 'bg-orange-500',
    COMPLETED: 'bg-green-500',
    RESOLVED: 'bg-green-600',
  };
  return <Badge className={cn(colors[status] || 'bg-gray-500', 'text-xs')}>{status.replace('_', ' ')}</Badge>;
};

interface OpenCasesTableProps {
  searchQuery?: string;
}

export default function OpenCasesTable({ searchQuery = '' }: OpenCasesTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<{ success: boolean; data: ActiveBreakdownsData }>({
    queryKey: ['activeBreakdowns-compact'],
    queryFn: fetchActiveBreakdowns,
    refetchInterval: 30000,
  });

  const breakdowns = data?.data?.breakdowns || [];

  // Apply all filters
  const filteredBreakdowns = breakdowns.filter(b => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        b.breakdownNumber.toLowerCase().includes(searchLower) ||
        b.truck.truckNumber.toLowerCase().includes(searchLower) ||
        b.driver?.user.firstName.toLowerCase().includes(searchLower) ||
        b.driver?.user.lastName.toLowerCase().includes(searchLower) ||
        b.location.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;

    // Priority filter
    if (priorityFilter !== 'ALL' && b.priority !== priorityFilter) return false;

    // Type filter
    if (typeFilter !== 'ALL' && b.breakdownType !== typeFilter) return false;

    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-6 w-6 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Failed to load cases</p>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-2">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (breakdowns.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No active cases</p>
        </CardContent>
      </Card>
    );
  }

  const activeFiltersCount = [statusFilter, priorityFilter, typeFilter].filter(f => f !== 'ALL').length;

  return (
    <Card>
      <CardContent className="p-0">
        {/* Filters */}
        <div className="p-3 border-b space-y-3">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-8"
            >
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-4 px-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('ALL');
                  setPriorityFilter('ALL');
                  setTypeFilter('ALL');
                }}
                className="h-8 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="REPORTED">Reported</SelectItem>
                    <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="WAITING_PARTS">Waiting Parts</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Priority</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Priorities</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Issue Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="ENGINE_FAILURE">Engine</SelectItem>
                    <SelectItem value="TRANSMISSION_FAILURE">Transmission</SelectItem>
                    <SelectItem value="BRAKE_FAILURE">Brakes</SelectItem>
                    <SelectItem value="TIRE_FLAT">Flat Tire</SelectItem>
                    <SelectItem value="TIRE_BLOWOUT">Blowout</SelectItem>
                    <SelectItem value="ELECTRICAL_ISSUE">Electrical</SelectItem>
                    <SelectItem value="COOLING_SYSTEM">Cooling</SelectItem>
                    <SelectItem value="FUEL_SYSTEM">Fuel</SelectItem>
                    <SelectItem value="SUSPENSION">Suspension</SelectItem>
                    <SelectItem value="ACCIDENT_DAMAGE">Accident</SelectItem>
                    <SelectItem value="WEATHER_RELATED">Weather</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[32px]"></TableHead>
                <TableHead className="w-[70px]">Priority</TableHead>
                <TableHead>Case #</TableHead>
                <TableHead>Truck</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Elapsed</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBreakdowns.slice(0, 20).map((breakdown) => (
                <>
                  <TableRow
                    key={breakdown.id}
                    className={cn(
                      'cursor-pointer hover:bg-muted/50',
                      expandedId === breakdown.id && 'bg-muted/50 border-b-0'
                    )}
                    onClick={() => toggleExpand(breakdown.id)}
                  >
                    <TableCell className="py-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        {expandedId === breakdown.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="py-2">{getPriorityBadge(breakdown.priority)}</TableCell>
                    <TableCell className="py-2">
                      <span className="font-mono text-xs font-medium">{breakdown.breakdownNumber}</span>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1">
                        <Truck className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">#{breakdown.truck.truckNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      {breakdown.driver ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs">
                                  {breakdown.driver.user.firstName.charAt(0)}. {breakdown.driver.user.lastName}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{breakdown.driver.user.firstName} {breakdown.driver.user.lastName}</p>
                              {breakdown.driver.user.phone && <p className="text-xs">{breakdown.driver.user.phone}</p>}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      {breakdown.assignments && breakdown.assignments.length > 0 ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1">
                                {breakdown.assignments.slice(0, 3).map(a => (
                                  <Badge 
                                    key={a.id} 
                                    variant="outline" 
                                    className="text-[10px] h-5 w-5 p-0 flex items-center justify-center font-semibold cursor-help"
                                  >
                                    {a.user.firstName.charAt(0)}{a.user.lastName.charAt(0)}
                                  </Badge>
                                ))}
                                {breakdown.assignments.length > 3 && (
                                  <Badge variant="outline" className="text-[10px] h-5 px-1 cursor-help">
                                    +{breakdown.assignments.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {breakdown.assignments.map(a => (
                                <p key={a.id} className="text-xs">
                                  {a.user.firstName} {a.user.lastName} {a.role && `(${a.role})`}
                                </p>
                              ))}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2">{getStatusBadge(breakdown.status)}</TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{breakdown.timeElapsed}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      {breakdown.totalCost > 0 || (breakdown.totalPaid && breakdown.totalPaid > 0) ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-xs">
                                <span className="font-medium">${breakdown.totalCost?.toFixed(0) || 0}</span>
                                {breakdown.totalPaid && breakdown.totalPaid > 0 && (
                                  <span className="text-green-600 ml-1">({(breakdown.totalPaid / breakdown.totalCost * 100).toFixed(0)}%)</span>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Estimated: ${breakdown.totalCost?.toFixed(2)}</p>
                              <p className="text-xs text-green-600">Paid: ${breakdown.totalPaid?.toFixed(2) || 0}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toggleExpand(breakdown.id)}>
                            <Edit className="h-3.5 w-3.5 mr-2" />
                            Edit Inline
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {breakdown.driver?.user.phone && (
                            <DropdownMenuItem onClick={() => window.location.href = `tel:${breakdown.driver?.user.phone}`}>
                              <Phone className="h-3.5 w-3.5 mr-2" />
                              Call Driver
                            </DropdownMenuItem>
                          )}
                          <Link href={`/dashboard/breakdowns/${breakdown.id}`}>
                            <DropdownMenuItem>
                              <ExternalLink className="h-3.5 w-3.5 mr-2" />
                              Full Details
                            </DropdownMenuItem>
                          </Link>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded Inline Editor */}
                  {expandedId === breakdown.id && (
                    <TableRow key={`${breakdown.id}-editor`}>
                      <TableCell colSpan={10} className="p-0">
                        <InlineCaseEditor
                          breakdown={breakdown}
                          onClose={() => setExpandedId(null)}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredBreakdowns.length > 20 && (
          <div className="p-3 border-t text-center">
            <Link href="/dashboard/fleet/breakdowns">
              <Button variant="link" size="sm">View all {filteredBreakdowns.length} cases →</Button>
            </Link>
          </div>
        )}

        {searchQuery && filteredBreakdowns.length === 0 && breakdowns.length > 0 && (
          <div className="p-6 text-center">
            <p className="text-muted-foreground text-sm">No cases match your search "{searchQuery}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
