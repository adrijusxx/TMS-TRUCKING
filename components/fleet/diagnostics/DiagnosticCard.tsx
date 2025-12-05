'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Truck,
  Clock,
  CheckCircle2,
  Wrench,
  ChevronDown,
  ChevronUp,
  Gauge,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { DIAGNOSTIC_CATEGORIES, categorizeFaultCode } from '@/lib/data/dtc-codes';

interface DiagnosticCardProps {
  fault: {
    id: string;
    faultCode: string;
    description: string | null;
    severity: string | null;
    category?: string | null; // Optional - derived from code pattern
    isActive: boolean;
    checkEngineLight?: boolean; // Optional - not in all schemas
    occurredAt: string;
    resolvedAt: string | null;
    mileageAtOccur?: number | null; // Optional - not in all schemas
    truck: {
      id: string;
      truckNumber: string;
      make: string;
      model: string;
      year: number;
    };
    resolvedBy?: {
      firstName: string;
      lastName: string;
    } | null;
  };
  onTroubleshoot: (code: string) => void;
  onResolve: (faultId: string) => void;
  onReactivate: (faultId: string) => void;
  compact?: boolean;
}

const severityConfig = {
  CRITICAL: {
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  WARNING: {
    icon: AlertCircle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800',
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  INFO: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
};

export function DiagnosticCard({
  fault,
  onTroubleshoot,
  onResolve,
  onReactivate,
  compact = false,
}: DiagnosticCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const severity = (fault.severity?.toUpperCase() || 'WARNING') as keyof typeof severityConfig;
  const config = severityConfig[severity] || severityConfig.WARNING;
  const SeverityIcon = config.icon;
  
  // Derive category from fault code if not provided
  const derivedCategory = fault.category || categorizeFaultCode(fault.faultCode).category;
  const categoryInfo = DIAGNOSTIC_CATEGORIES[derivedCategory as keyof typeof DIAGNOSTIC_CATEGORIES] 
    || DIAGNOSTIC_CATEGORIES.unknown;
  
  // Check if it's a CEL code (check engine light indicator)
  const isCheckEngineLight = fault.checkEngineLight || fault.faultCode === 'CEL';

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center justify-between p-3 rounded-lg border',
          fault.isActive ? config.bg : 'bg-muted/50 border-muted'
        )}
      >
        <div className="flex items-center gap-3">
          <SeverityIcon className={cn('h-4 w-4', config.color)} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-sm">{fault.faultCode}</span>
              {isCheckEngineLight && (
                <Badge variant="destructive" className="text-[10px] h-4 px-1">CEL</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {fault.truck.truckNumber} • {fault.description || 'Unknown issue'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => onTroubleshoot(fault.faultCode)}
          >
            <Wrench className="h-3 w-3 mr-1" />
            Help
          </Button>
          {fault.isActive ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => onResolve(fault.id)}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Resolve
            </Button>
          ) : (
            <Badge variant="secondary" className="text-xs">Resolved</Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('overflow-hidden', fault.isActive ? config.bg : 'bg-muted/30')}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left side - Code and info */}
          <div className="flex items-start gap-3">
            <div className={cn('p-2 rounded-lg', fault.isActive ? 'bg-white/50' : 'bg-muted')}>
              <SeverityIcon className={cn('h-5 w-5', config.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-lg">{fault.faultCode}</span>
                <Badge className={config.badge}>{severity}</Badge>
                <Badge variant="outline" className="text-xs">
                  {categoryInfo.label}
                </Badge>
                {isCheckEngineLight && (
                  <Badge variant="destructive" className="text-xs">Check Engine</Badge>
                )}
                {!fault.isActive && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                    Resolved
                  </Badge>
                )}
              </div>
              <p className="text-sm text-foreground/80 mt-1">
                {fault.description || 'No description available'}
              </p>
              
              {/* Truck info */}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  {fault.truck.truckNumber} ({fault.truck.year} {fault.truck.make} {fault.truck.model})
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(fault.occurredAt), { addSuffix: true })}
                </span>
                {fault.mileageAtOccur && (
                  <span className="flex items-center gap-1">
                    <Gauge className="h-3 w-3" />
                    {Math.round(fault.mileageAtOccur).toLocaleString()} mi
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onTroubleshoot(fault.faultCode)}
            >
              <Wrench className="h-4 w-4 mr-1" />
              Troubleshoot
            </Button>
            {fault.isActive ? (
              <Button
                size="sm"
                variant="default"
                onClick={() => onResolve(fault.id)}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Resolve
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReactivate(fault.id)}
              >
                Reactivate
              </Button>
            )}
          </div>
        </div>

        {/* Expandable details */}
        {!compact && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3 text-xs text-muted-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Less details
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                More details
              </>
            )}
          </Button>
        )}

        {expanded && (
          <div className="mt-3 pt-3 border-t text-sm space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-muted-foreground">Occurred:</span>{' '}
                <span>{new Date(fault.occurredAt).toLocaleString()}</span>
              </div>
              {fault.resolvedAt && (
                <div>
                  <span className="text-muted-foreground">Resolved:</span>{' '}
                  <span>{new Date(fault.resolvedAt).toLocaleString()}</span>
                </div>
              )}
              {fault.resolvedBy && (
                <div>
                  <span className="text-muted-foreground">Resolved by:</span>{' '}
                  <span>{fault.resolvedBy.firstName} {fault.resolvedBy.lastName}</span>
                </div>
              )}
              {fault.mileageAtOccur && (
                <div>
                  <span className="text-muted-foreground">Mileage:</span>{' '}
                  <span>{Math.round(fault.mileageAtOccur).toLocaleString()} miles</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

