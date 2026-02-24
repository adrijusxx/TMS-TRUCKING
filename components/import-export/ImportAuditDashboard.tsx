'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users, Truck, Container, Building2, Package, MapPin,
  Store, UserCog, FileText, DollarSign, UserPlus,
  ChevronDown, ChevronRight, RefreshCw, ShieldCheck, AlertTriangle, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditCheck {
  entity: string;
  checkType: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  details?: Record<string, unknown>;
}

interface EntityAuditResult {
  entity: string;
  overallScore: number;
  checks: AuditCheck[];
  importerCapabilities: {
    hasPreviewMode: boolean;
    hasBatchOptimization: boolean;
    hasUpdateExisting: boolean;
  };
  fieldCoverage: {
    schemaFields: number;
    configuredFields: number;
    coveragePercent: number;
    missingFields: string[];
  };
}

interface FullAuditResult {
  timestamp: string;
  entities: EntityAuditResult[];
  overallScore: number;
  recommendations: string[];
}

const ENTITY_ICONS: Record<string, typeof Users> = {
  drivers: Users,
  trucks: Truck,
  trailers: Container,
  customers: Building2,
  loads: Package,
  locations: MapPin,
  vendors: Store,
  users: UserCog,
  invoices: FileText,
  settlements: DollarSign,
  'recruiting-leads': UserPlus,
};

const ENTITY_LABELS: Record<string, string> = {
  drivers: 'Drivers',
  trucks: 'Trucks',
  trailers: 'Trailers',
  customers: 'Customers',
  loads: 'Loads',
  locations: 'Locations',
  vendors: 'Vendors',
  users: 'Users / Employees',
  invoices: 'Invoices',
  settlements: 'Settlements',
  'recruiting-leads': 'Recruiting Leads',
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30';
  if (score >= 60) return 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30';
  return 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30';
}

function StatusIcon({ status }: { status: 'pass' | 'warning' | 'fail' }) {
  if (status === 'pass') return <ShieldCheck className="h-4 w-4 text-green-500" />;
  if (status === 'warning') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  return <XCircle className="h-4 w-4 text-red-500" />;
}

function EntityCard({ result }: { result: EntityAuditResult }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ENTITY_ICONS[result.entity] ?? Package;
  const label = ENTITY_LABELS[result.entity] ?? result.entity;
  const failCount = result.checks.filter((c) => c.status === 'fail').length;
  const warnCount = result.checks.filter((c) => c.status === 'warning').length;

  return (
    <Card className={cn('transition-colors', getScoreBg(result.overallScore))}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">{label}</CardTitle>
          </div>
          <span className={cn('text-2xl font-bold', getScoreColor(result.overallScore))}>
            {result.overallScore}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Field coverage */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Field Coverage</span>
            <span className="font-medium">{result.fieldCoverage.coveragePercent}%</span>
          </div>
          <Progress value={result.fieldCoverage.coveragePercent} className="h-1.5" />
          <p className="text-xs text-muted-foreground mt-1">
            {result.fieldCoverage.configuredFields} / {result.fieldCoverage.schemaFields} fields
          </p>
        </div>

        {/* Capability badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={result.importerCapabilities.hasPreviewMode ? 'default' : 'outline'} className="text-xs">
            Preview
          </Badge>
          <Badge variant={result.importerCapabilities.hasBatchOptimization ? 'default' : 'outline'} className="text-xs">
            Batch
          </Badge>
          <Badge variant={result.importerCapabilities.hasUpdateExisting ? 'default' : 'outline'} className="text-xs">
            Update
          </Badge>
        </div>

        {/* Check summary */}
        <div className="flex items-center gap-3 text-xs">
          {failCount > 0 && (
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <XCircle className="h-3 w-3" /> {failCount} fail
            </span>
          )}
          {warnCount > 0 && (
            <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-3 w-3" /> {warnCount} warn
            </span>
          )}
          {failCount === 0 && warnCount === 0 && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <ShieldCheck className="h-3 w-3" /> All checks pass
            </span>
          )}
        </div>

        {/* Expandable details */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs h-7"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
          {expanded ? 'Hide details' : 'Show details'}
        </Button>

        {expanded && (
          <div className="space-y-2 pt-1 border-t">
            {result.checks.map((check, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <StatusIcon status={check.status} />
                <div>
                  <p>{check.message}</p>
                  {check.details && (
                    <p className="text-muted-foreground mt-0.5">
                      {JSON.stringify(check.details).slice(0, 120)}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {result.fieldCoverage.missingFields.length > 0 && (
              <div className="text-xs text-muted-foreground mt-2">
                <p className="font-medium mb-1">Unconfigured fields:</p>
                <p className="break-all">{result.fieldCoverage.missingFields.slice(0, 8).join(', ')}
                  {result.fieldCoverage.missingFields.length > 8 && ` +${result.fieldCoverage.missingFields.length - 8} more`}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ImportAuditDashboard() {
  const { data, isLoading, refetch, isFetching } = useQuery<{ success: boolean; data: FullAuditResult }>({
    queryKey: ['import-audit'],
    queryFn: () => fetch('/api/import-export/audit').then((r) => r.json()),
  });

  const audit = data?.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Import System Audit</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Validates importer field coverage, capabilities, and data quality across all entity types.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          Run Audit
        </Button>
      </div>

      {isLoading && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Running audit...</CardContent></Card>
      )}

      {audit && (
        <>
          {/* Overall score */}
          <Card className={cn('border', getScoreBg(audit.overallScore))}>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overall System Health</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {audit.entities.length} importers audited
                  </p>
                </div>
                <span className={cn('text-5xl font-bold', getScoreColor(audit.overallScore))}>
                  {audit.overallScore}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {audit.recommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {audit.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Entity grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {audit.entities.map((result) => (
              <EntityCard key={result.entity} result={result} />
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-right">
            Last audit: {new Date(audit.timestamp).toLocaleString()}
          </p>
        </>
      )}
    </div>
  );
}
