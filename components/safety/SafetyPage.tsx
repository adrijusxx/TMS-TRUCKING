'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, AlertTriangle, GraduationCap, Plus, Filter, Download, Upload } from 'lucide-react';
import { formatDate, formatCurrency, apiUrl } from '@/lib/utils';
import ImportDialog from '@/components/import-export/ImportDialog';
import ExportDialog from '@/components/import-export/ExportDialog';
import { BulkActionBar } from '@/components/data-table/BulkActionBar';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

interface SafetyIncident {
  id: string;
  incidentNumber: string;
  incidentType: string;
  severity: string;
  date: Date;
  location: string;
  city?: string | null;
  state?: string | null;
  status: string;
  injuriesInvolved: boolean;
  fatalitiesInvolved: boolean;
  estimatedCost?: number | null;
  driver?: {
    id: string;
    driverNumber: string;
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
  truck?: {
    id: string;
    truckNumber: string;
  } | null;
}

interface SafetyTraining {
  id: string;
  trainingType: string;
  trainingName: string;
  trainingDate: Date;
  completionDate?: Date | null;
  expiryDate?: Date | null;
  status: string;
  completed: boolean;
  passed?: boolean | null;
  driver: {
    id: string;
    driverNumber: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

async function fetchSafetyIncidents(params: {
  page?: number;
  limit?: number;
  incidentType?: string;
  severity?: string;
  status?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.incidentType) queryParams.set('incidentType', params.incidentType);
  if (params.severity) queryParams.set('severity', params.severity);
  if (params.status) queryParams.set('status', params.status);

  const response = await fetch(apiUrl(`/api/safety/incidents?${queryParams}`));
  if (!response.ok) throw new Error('Failed to fetch safety incidents');
  return response.json();
}

async function fetchSafetyTrainings(params: {
  page?: number;
  limit?: number;
  driverId?: string;
  trainingType?: string;
  status?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.driverId) queryParams.set('driverId', params.driverId);
  if (params.trainingType) queryParams.set('trainingType', params.trainingType);
  if (params.status) queryParams.set('status', params.status);

  const response = await fetch(apiUrl(`/api/safety/trainings?${queryParams}`));
  if (!response.ok) throw new Error('Failed to fetch safety trainings');
  return response.json();
}

function formatType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    MINOR: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    MODERATE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    MAJOR: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    FATAL: 'bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-200',
  };
  return colors[severity] || 'bg-gray-100 text-gray-800';
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    REPORTED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    UNDER_INVESTIGATION: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    INVESTIGATION_COMPLETE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    CLOSED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    EXPIRED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export default function SafetyPage() {
  const [incidentPage, setIncidentPage] = useState(1);
  const [trainingPage, setTrainingPage] = useState(1);
  const [incidentTypeFilter, setIncidentTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [trainingTypeFilter, setTrainingTypeFilter] = useState<string>('all');
  const [selectedIncidentIds, setSelectedIncidentIds] = useState<string[]>([]);
  const [selectedTrainingIds, setSelectedTrainingIds] = useState<string[]>([]);

  const { data: incidentsData, isLoading: incidentsLoading, error: incidentsError, refetch: refetchIncidents } = useQuery({
    queryKey: ['safety-incidents', incidentPage, incidentTypeFilter, severityFilter],
    queryFn: () =>
      fetchSafetyIncidents({
        page: incidentPage,
        limit: 20,
        incidentType: incidentTypeFilter !== 'all' ? incidentTypeFilter : undefined,
        severity: severityFilter !== 'all' ? severityFilter : undefined,
      }),
  });

  const { data: trainingsData, isLoading: trainingsLoading, error: trainingsError, refetch: refetchTrainings } = useQuery({
    queryKey: ['safety-trainings', trainingPage, trainingTypeFilter],
    queryFn: () =>
      fetchSafetyTrainings({
        page: trainingPage,
        limit: 20,
        trainingType: trainingTypeFilter !== 'all' ? trainingTypeFilter : undefined,
      }),
  });

  const incidents: SafetyIncident[] = incidentsData?.data?.incidents || [];
  const trainings: SafetyTraining[] = trainingsData?.data?.trainings || [];
  const incidentsPagination = incidentsData?.data?.pagination;
  const trainingsPagination = trainingsData?.data?.pagination;

  const toggleIncidentSelect = (id: string) => {
    if (selectedIncidentIds.includes(id)) {
      setSelectedIncidentIds(selectedIncidentIds.filter((i) => i !== id));
    } else {
      setSelectedIncidentIds([...selectedIncidentIds, id]);
    }
  };

  const toggleTrainingSelect = (id: string) => {
    if (selectedTrainingIds.includes(id)) {
      setSelectedTrainingIds(selectedTrainingIds.filter((i) => i !== id));
    } else {
      setSelectedTrainingIds([...selectedTrainingIds, id]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Manage safety records and compliance</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="incidents" className="space-y-3">
        <TabsList>
          <TabsTrigger value="incidents">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Incidents
          </TabsTrigger>
          <TabsTrigger value="trainings">
            <GraduationCap className="h-4 w-4 mr-2" />
            Trainings
          </TabsTrigger>
        </TabsList>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <ImportDialog entityType="safety-incidents" onImportComplete={() => refetchIncidents()} />
              <ExportDialog entityType="safety-incidents" />
              <Link href="/dashboard/safety/incidents/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Incident
                </Button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={incidentTypeFilter} onValueChange={(value) => { setIncidentTypeFilter(value); setIncidentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ACCIDENT">Accident</SelectItem>
                <SelectItem value="COLLISION">Collision</SelectItem>
                <SelectItem value="ROLLOVER">Rollover</SelectItem>
                <SelectItem value="FIRE">Fire</SelectItem>
                <SelectItem value="SPILL">Spill</SelectItem>
                <SelectItem value="INJURY">Injury</SelectItem>
                <SelectItem value="FATALITY">Fatality</SelectItem>
                <SelectItem value="HAZMAT_INCIDENT">Hazmat</SelectItem>
                <SelectItem value="EQUIPMENT_FAILURE">Equipment Failure</SelectItem>
                <SelectItem value="DRIVER_ERROR">Driver Error</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={(value) => { setSeverityFilter(value); setIncidentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="MINOR">Minor</SelectItem>
                <SelectItem value="MODERATE">Moderate</SelectItem>
                <SelectItem value="MAJOR">Major</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="FATAL">Fatal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Incidents Table */}
          {incidentsLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-muted-foreground">Loading incidents...</div>
            </div>
          ) : incidentsError ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <p className="text-destructive mb-2">Error loading incidents</p>
                <Button onClick={() => refetchIncidents()}>Retry</Button>
              </div>
            </div>
          ) : incidents.length === 0 ? (
            <div className="flex items-center justify-center h-96 border rounded-lg">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No safety incidents found</p>
                <Link href="/dashboard/safety/incidents/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Report Incident
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedIncidentIds.length === incidents.length && incidents.length > 0}
                          onCheckedChange={() => {
                            if (selectedIncidentIds.length === incidents.length) {
                              setSelectedIncidentIds([]);
                            } else {
                              setSelectedIncidentIds(incidents.map((i) => i.id));
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Incident #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Truck</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents.map((incident) => (
                      <TableRow key={incident.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIncidentIds.includes(incident.id)}
                            onCheckedChange={() => toggleIncidentSelect(incident.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/dashboard/safety/incidents/${incident.id}`}
                            className="font-medium hover:underline"
                          >
                            {incident.incidentNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{formatType(incident.incidentType)}</TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(incident.severity)}>
                            {incident.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(incident.date)}</TableCell>
                        <TableCell>
                          {incident.location}
                          {incident.city && incident.state && (
                            <div className="text-sm text-muted-foreground">
                              {incident.city}, {incident.state}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {incident.driver ? (
                            <Link
                              href={`/dashboard/drivers/${incident.driver.id}`}
                              className="hover:underline"
                            >
                              {incident.driver.user.firstName} {incident.driver.user.lastName}
                            </Link>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {incident.truck ? (
                            <Link
                              href={`/dashboard/trucks/${incident.truck.id}`}
                              className="hover:underline"
                            >
                              {incident.truck.truckNumber}
                            </Link>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(incident.status)}>
                            {formatType(incident.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {incident.estimatedCost
                            ? formatCurrency(incident.estimatedCost)
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {incidentsPagination && incidentsPagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {((incidentPage - 1) * 20) + 1} to {Math.min(incidentPage * 20, incidentsPagination.total)} of {incidentsPagination.total} incidents
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIncidentPage(incidentPage - 1)}
                      disabled={incidentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIncidentPage(incidentPage + 1)}
                      disabled={incidentPage >= incidentsPagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {/* Bulk Actions */}
              {selectedIncidentIds.length > 0 && (
                <BulkActionBar
                  selectedIds={selectedIncidentIds}
                  onClearSelection={() => setSelectedIncidentIds([])}
                  entityType="safety-incidents"
                  enableBulkEdit={false}
                  enableBulkDelete={true}
                  enableBulkExport={true}
                  onActionComplete={() => {
                    refetchIncidents();
                    setSelectedIncidentIds([]);
                  }}
                />
              )}
            </>
          )}
        </TabsContent>

        {/* Trainings Tab */}
        <TabsContent value="trainings" className="space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <ImportDialog entityType="safety-trainings" onImportComplete={() => refetchTrainings()} />
              <ExportDialog entityType="safety-trainings" />
              <Link href="/dashboard/safety/trainings/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Training
                </Button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={trainingTypeFilter} onValueChange={(value) => { setTrainingTypeFilter(value); setTrainingPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="DEFENSIVE_DRIVING">Defensive Driving</SelectItem>
                <SelectItem value="HAZMAT">Hazmat</SelectItem>
                <SelectItem value="HOURS_OF_SERVICE">Hours of Service</SelectItem>
                <SelectItem value="ELD_TRAINING">ELD Training</SelectItem>
                <SelectItem value="FIRST_AID">First Aid</SelectItem>
                <SelectItem value="CPR">CPR</SelectItem>
                <SelectItem value="FIRE_SAFETY">Fire Safety</SelectItem>
                <SelectItem value="BACKING_SAFETY">Backing Safety</SelectItem>
                <SelectItem value="LOAD_SECUREMENT">Load Securement</SelectItem>
                <SelectItem value="DOCK_SAFETY">Dock Safety</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Trainings Table */}
          {trainingsLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-muted-foreground">Loading trainings...</div>
            </div>
          ) : trainingsError ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <p className="text-destructive mb-2">Error loading trainings</p>
                <Button onClick={() => refetchTrainings()}>Retry</Button>
              </div>
            </div>
          ) : trainings.length === 0 ? (
            <div className="flex items-center justify-center h-96 border rounded-lg">
              <div className="text-center">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No safety trainings found</p>
                <Link href="/dashboard/safety/trainings/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Training
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedTrainingIds.length === trainings.length && trainings.length > 0}
                          onCheckedChange={() => {
                            if (selectedTrainingIds.length === trainings.length) {
                              setSelectedTrainingIds([]);
                            } else {
                              setSelectedTrainingIds(trainings.map((t) => t.id));
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Training</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Completion</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Passed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trainings.map((training) => (
                      <TableRow key={training.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedTrainingIds.includes(training.id)}
                            onCheckedChange={() => toggleTrainingSelect(training.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/dashboard/drivers/${training.driver.id}`}
                            className="font-medium hover:underline"
                          >
                            {training.driver.user.firstName} {training.driver.user.lastName}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/dashboard/safety/trainings/${training.id}`}
                            className="font-medium hover:underline"
                          >
                            {training.trainingName}
                          </Link>
                        </TableCell>
                        <TableCell>{formatType(training.trainingType)}</TableCell>
                        <TableCell>{formatDate(training.trainingDate)}</TableCell>
                        <TableCell>
                          {training.completionDate ? formatDate(training.completionDate) : '-'}
                        </TableCell>
                        <TableCell>
                          {training.expiryDate ? formatDate(training.expiryDate) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(training.status)}>
                            {formatType(training.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {training.passed === null ? (
                            '-'
                          ) : training.passed ? (
                            <Badge className="bg-green-100 text-green-800">Yes</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">No</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {trainingsPagination && trainingsPagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {((trainingPage - 1) * 20) + 1} to {Math.min(trainingPage * 20, trainingsPagination.total)} of {trainingsPagination.total} trainings
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTrainingPage(trainingPage - 1)}
                      disabled={trainingPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTrainingPage(trainingPage + 1)}
                      disabled={trainingPage >= trainingsPagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {/* Bulk Actions */}
              {selectedTrainingIds.length > 0 && (
                <BulkActionBar
                  selectedIds={selectedTrainingIds}
                  onClearSelection={() => setSelectedTrainingIds([])}
                  entityType="safety-trainings"
                  enableBulkEdit={false}
                  enableBulkDelete={true}
                  enableBulkExport={true}
                  onActionComplete={() => {
                    refetchTrainings();
                    setSelectedTrainingIds([]);
                  }}
                />
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

