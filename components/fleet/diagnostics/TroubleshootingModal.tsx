'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Wrench,
  DollarSign,
  Clock,
  CheckCircle2,
  Lightbulb,
  ExternalLink,
  Copy,
  Check,
  ListChecks,
  CircleDot,
  ShieldAlert,
  Gauge,
  FileText,
  Phone,
  Printer,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TroubleshootingInfo {
  code: string;
  name: string;
  description: string;
  category: string;
  severity: string;
  urgency: string;
  commonCauses: string[];
  troubleshooting: string[];
  estimatedCost: string | null;
  source: 'database' | 'ai';
  aiGenerated?: string;
}

interface TroubleshootingModalProps {
  code: string | null;
  open: boolean;
  onClose: () => void;
}

const severityConfig = {
  critical: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900', label: 'Critical' },
  warning: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900', label: 'Warning' },
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900', label: 'Info' },
};

const urgencyConfig = {
  immediate: { 
    label: 'Immediate Action Required', 
    color: 'bg-red-500', 
    textColor: 'text-white',
    description: 'STOP driving immediately. This fault can cause engine damage or safety issues.',
    icon: ShieldAlert,
  },
  soon: { 
    label: 'Service Within 24-48 Hours', 
    color: 'bg-yellow-500', 
    textColor: 'text-black',
    description: 'Schedule service soon. Continued operation may worsen the issue.',
    icon: Clock,
  },
  monitor: { 
    label: 'Monitor & Schedule Service', 
    color: 'bg-blue-500', 
    textColor: 'text-white',
    description: 'Keep an eye on dashboard warnings. Service at next convenient opportunity.',
    icon: Gauge,
  },
};

const categoryIcons: Record<string, any> = {
  engine: '🔧',
  transmission: '⚙️',
  brake: '🛑',
  exhaust: '💨',
  electrical: '⚡',
  aftertreatment: '♻️',
  fuel: '⛽',
  cooling: '❄️',
  air: '🌬️',
  unknown: '❓',
};

export function TroubleshootingModal({ code, open, onClose }: TroubleshootingModalProps) {
  const [data, setData] = useState<TroubleshootingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (code && open) {
      fetchTroubleshooting(code);
      setCompletedSteps(new Set());
      setActiveTab('overview');
    }
  }, [code, open]);

  const fetchTroubleshooting = async (faultCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/fleet/diagnostics/${encodeURIComponent(faultCode)}/troubleshoot`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to load troubleshooting');
      }
    } catch (err) {
      setError('Failed to load troubleshooting information');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!data) return;
    const text = `
DIAGNOSTIC TROUBLE CODE: ${data.code}
=======================================
Name: ${data.name}
Description: ${data.description}
Severity: ${data.severity.toUpperCase()}
Category: ${data.category}
Urgency: ${urgencyConfig[data.urgency as keyof typeof urgencyConfig]?.label || data.urgency}

COMMON CAUSES:
${data.commonCauses.map((c, i) => `${i + 1}. ${c}`).join('\n')}

TROUBLESHOOTING STEPS:
${data.troubleshooting.map((s, i) => `${i + 1}. ${s}`).join('\n')}

${data.estimatedCost ? `ESTIMATED REPAIR COST: ${data.estimatedCost}` : ''}
    `.trim();
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleStep = (index: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedSteps(newCompleted);
  };

  const severity = data?.severity?.toLowerCase() as keyof typeof severityConfig || 'warning';
  const urgency = data?.urgency?.toLowerCase() as keyof typeof urgencyConfig || 'soon';
  const SeverityIcon = severityConfig[severity]?.icon || AlertCircle;
  const UrgencyIcon = urgencyConfig[urgency]?.icon || Clock;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto print:max-w-none print:h-auto">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Diagnostic Troubleshooting Guide
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <p className="text-xl font-medium">Failed to Load</p>
            <p className="text-muted-foreground mt-2">{error}</p>
            <Button
              className="mt-6"
              onClick={() => code && fetchTroubleshooting(code)}
            >
              Try Again
            </Button>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-3xl font-bold">{data.code}</span>
                  <Badge className={cn(severityConfig[severity]?.bg, severityConfig[severity]?.color, 'border-0')}>
                    <SeverityIcon className="h-3 w-3 mr-1" />
                    {severityConfig[severity]?.label}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <span>{categoryIcons[data.category] || '🔧'}</span>
                    <span className="capitalize">{data.category}</span>
                  </Badge>
                </div>
                <h2 className="text-xl font-semibold">{data.name}</h2>
                <p className="text-muted-foreground">{data.description}</p>
              </div>
              <div className="flex gap-2 print:hidden">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Urgency Banner */}
            <div className={cn(
              'p-4 rounded-lg flex items-start gap-4',
              urgencyConfig[urgency]?.color,
              urgencyConfig[urgency]?.textColor
            )}>
              <UrgencyIcon className="h-6 w-6 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-lg">{urgencyConfig[urgency]?.label}</p>
                <p className="text-sm opacity-90 mt-1">{urgencyConfig[urgency]?.description}</p>
              </div>
            </div>

            {/* Tabs for detailed info */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="print:hidden">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview" className="gap-1">
                  <FileText className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="steps" className="gap-1">
                  <ListChecks className="h-4 w-4" />
                  Step-by-Step
                </TabsTrigger>
                <TabsTrigger value="resources" className="gap-1">
                  <ExternalLink className="h-4 w-4" />
                  Resources
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                {/* Common Causes */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      Common Causes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <ul className="space-y-2">
                      {data.commonCauses.map((cause, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 flex items-center justify-center text-sm font-medium">
                            {i + 1}
                          </span>
                          <span className="text-sm pt-0.5">{cause}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Quick Troubleshooting Summary */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-blue-500" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <ul className="space-y-2">
                      {data.troubleshooting.slice(0, 3).map((step, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CircleDot className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                          <span className="text-sm">{step}</span>
                        </li>
                      ))}
                    </ul>
                    {data.troubleshooting.length > 3 && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="mt-2 p-0"
                        onClick={() => setActiveTab('steps')}
                      >
                        View all {data.troubleshooting.length} steps →
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Cost Estimate */}
                {data.estimatedCost && (
                  <Card className="border-green-200 dark:border-green-800">
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
                          <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Estimated Repair Cost</p>
                          <p className="text-xl font-bold text-green-600">{data.estimatedCost}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Actual cost may vary based on shop rates and parts availability
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="steps" className="mt-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <ListChecks className="h-5 w-5 text-green-500" />
                        Troubleshooting Checklist
                      </span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {completedSteps.size}/{data.troubleshooting.length} completed
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="space-y-3">
                      {data.troubleshooting.map((step, i) => (
                        <div
                          key={i}
                          className={cn(
                            'flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                            completedSteps.has(i) 
                              ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' 
                              : 'hover:bg-muted/50'
                          )}
                          onClick={() => toggleStep(i)}
                        >
                          <div className={cn(
                            'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                            completedSteps.has(i) 
                              ? 'bg-green-500 text-white' 
                              : 'bg-muted text-muted-foreground'
                          )}>
                            {completedSteps.has(i) ? <Check className="h-4 w-4" /> : i + 1}
                          </div>
                          <div className="flex-1">
                            <p className={cn(
                              'text-sm',
                              completedSteps.has(i) && 'line-through text-muted-foreground'
                            )}>
                              {step}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {completedSteps.size === data.troubleshooting.length && (
                      <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p className="font-medium text-green-700 dark:text-green-300">
                          All steps completed!
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          If the issue persists, consult a certified technician.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="resources" className="space-y-4 mt-4">
                {/* External Resources */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">External Resources</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4 space-y-3">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(`${data.code} ${data.name} truck repair guide`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Search Repair Guides Online
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${data.code} truck diagnosis repair`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Watch Video Tutorials
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(`${data.code} OEM service bulletin TSB`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Check for TSBs (Technical Service Bulletins)
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                {/* When to Call a Pro */}
                <Card className="border-blue-200 dark:border-blue-800">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Phone className="h-5 w-5 text-blue-500" />
                      When to Call a Professional
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CircleDot className="h-4 w-4 mt-0.5 text-blue-500" />
                        Fault persists after basic troubleshooting
                      </li>
                      <li className="flex items-start gap-2">
                        <CircleDot className="h-4 w-4 mt-0.5 text-blue-500" />
                        Multiple related codes are present
                      </li>
                      <li className="flex items-start gap-2">
                        <CircleDot className="h-4 w-4 mt-0.5 text-blue-500" />
                        Special diagnostic equipment is required
                      </li>
                      <li className="flex items-start gap-2">
                        <CircleDot className="h-4 w-4 mt-0.5 text-blue-500" />
                        Repair requires removing major components
                      </li>
                      <li className="flex items-start gap-2">
                        <CircleDot className="h-4 w-4 mt-0.5 text-blue-500" />
                        Vehicle is under warranty
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Print version - shows everything */}
            <div className="hidden print:block space-y-6">
              <Separator />
              <div>
                <h3 className="font-bold mb-2">Common Causes:</h3>
                <ol className="list-decimal list-inside space-y-1">
                  {data.commonCauses.map((cause, i) => (
                    <li key={i}>{cause}</li>
                  ))}
                </ol>
              </div>
              <div>
                <h3 className="font-bold mb-2">Troubleshooting Steps:</h3>
                <ol className="list-decimal list-inside space-y-1">
                  {data.troubleshooting.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
              {data.estimatedCost && (
                <p><strong>Estimated Cost:</strong> {data.estimatedCost}</p>
              )}
            </div>

            {/* AI Notice */}
            {data.source === 'ai' && data.aiGenerated && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{data.aiGenerated}</span>
                </p>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t print:hidden">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
