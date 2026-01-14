'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Check, ChevronsUpDown, Truck, Loader2, Sparkles, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn, apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import SolutionSuggestions from '@/components/breakdowns/SolutionSuggestions';
import SimilarCasesPanel from '@/components/breakdowns/SimilarCasesPanel';
import NearbyVendorsWidget from '@/components/fleet/NearbyVendorsWidget';

const inlineCaseSchema = z.object({
  truckId: z.string().min(1, 'Truck is required'),
  location: z.string().min(1, 'Location is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  breakdownType: z.enum([
    'ENGINE_FAILURE', 'TRANSMISSION_FAILURE', 'BRAKE_FAILURE', 'TIRE_FLAT',
    'TIRE_BLOWOUT', 'ELECTRICAL_ISSUE', 'COOLING_SYSTEM', 'FUEL_SYSTEM',
    'SUSPENSION', 'ACCIDENT_DAMAGE', 'WEATHER_RELATED', 'OTHER',
  ]),
  description: z.string().min(1, 'Description is required'),
});

type InlineCaseFormData = z.infer<typeof inlineCaseSchema>;

interface CreateCaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

async function searchTrucks(query: string) {
  const response = await fetch(apiUrl(`/api/trucks?search=${encodeURIComponent(query)}&limit=10`));
  if (!response.ok) throw new Error('Failed to search trucks');
  const data = await response.json();
  return data.data || [];
}

async function createBreakdown(data: InlineCaseFormData) {
  const response = await fetch(apiUrl('/api/breakdowns'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create case');
  }
  return response.json();
}

export default function CreateCaseModal({ open, onOpenChange }: CreateCaseModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [truckSearchOpen, setTruckSearchOpen] = useState(false);
  const [truckSearchQuery, setTruckSearchQuery] = useState('');
  const [faultCodesExpanded, setFaultCodesExpanded] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<InlineCaseFormData>({
    resolver: zodResolver(inlineCaseSchema),
    defaultValues: { priority: 'MEDIUM', breakdownType: 'OTHER' },
  });

  const selectedTruckId = watch('truckId');
  const description = watch('description');
  const breakdownType = watch('breakdownType');

  const { data: trucksData } = useQuery({
    queryKey: ['truckSearch', truckSearchQuery],
    queryFn: () => searchTrucks(truckSearchQuery),
    enabled: truckSearchOpen,
  });

  const { data: truckContext, isLoading: isLoadingContext } = useQuery({
    queryKey: ['truckContext', selectedTruckId],
    queryFn: async () => {
      if (!selectedTruckId) return null;
      const response = await fetch(apiUrl('/api/breakdowns/case-context'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ truckId: selectedTruckId }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data;
    },
    enabled: !!selectedTruckId,
  });

  // Access definitions
  const contextData = truckContext?.data;
  const contextMessage = truckContext?.message;

  // Auto-fill location when context arrives
  const activeLocation = watch('location');
  if (contextData?.location?.address && !activeLocation) {
    setValue('location', contextData.location.address);
  }

  const trucks = trucksData || [];
  const selectedTruck = trucks.find((t: any) => t.id === selectedTruckId);

  const createMutation = useMutation({
    mutationFn: createBreakdown,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activeBreakdowns'] });
      queryClient.invalidateQueries({ queryKey: ['activeBreakdowns-compact'] });
      queryClient.invalidateQueries({ queryKey: ['activeBreakdowns-count'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-metrics-summary'] });
      toast.success(`Case ${data.data.breakdownNumber} created successfully`);
      reset();
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const onSubmit = (data: InlineCaseFormData) => {
    // Inject telematics snapshot if available
    const payload = {
      ...data,
      telematicsSnapshot: contextData || undefined
    };
    createMutation.mutate(payload as any);
  };

  const handleUseSolution = (caseData: any) => {
    if (caseData.solution) {
      setValue('description', caseData.solution);
      toast.success('Solution copied to description');
    }
  };

  const handleApplySuggestion = (suggestion: any) => {
    if (suggestion.rootCause) {
      const enhancedDescription = `Root Cause: ${suggestion.rootCause}\n\nRecommended Steps:\n${suggestion.recommendedSteps.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n')}`;
      setValue('description', enhancedDescription);
    }
    if (suggestion.urgencyLevel) {
      const priorityMap: any = { HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW' };
      setValue('priority', priorityMap[suggestion.urgencyLevel] || 'MEDIUM');
    }
    toast.success('AI suggestions applied!');
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  // Safe checks for context data
  const hasFaultCodes = contextData?.diagnostics?.faultCodes?.length > 0;
  const isEngineLightOn = contextData?.diagnostics?.checkEngineLight;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-[60vw] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="text-2xl">Create New Breakdown Case</SheetTitle>
          <SheetDescription>
            Fill in the breakdown details. The AI assistant will help you with suggestions based on similar past cases.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Form - Left Side (2/3 width) */}
          <div className="flex-[2] border-r">
            <ScrollArea className="h-full">
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                {/* Truck & Priority Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Truck *</Label>
                    <Popover open={truckSearchOpen} onOpenChange={setTruckSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between h-11">
                          {selectedTruck ? (
                            <span className="flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              #{selectedTruck.truckNumber} - {selectedTruck.make}
                            </span>
                          ) : (
                            'Select truck...'
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search trucks..." value={truckSearchQuery} onValueChange={setTruckSearchQuery} />
                          <CommandList>
                            <CommandEmpty>No trucks found.</CommandEmpty>
                            <CommandGroup>
                              {trucks.map((truck: any) => (
                                <CommandItem
                                  key={truck.id}
                                  value={truck.id}
                                  onSelect={() => {
                                    setValue('truckId', truck.id);
                                    setTruckSearchOpen(false);
                                    setTruckSearchQuery('');
                                  }}
                                >
                                  <Check className={cn('mr-2 h-4 w-4', selectedTruckId === truck.id ? 'opacity-100' : 'opacity-0')} />
                                  <Truck className="mr-2 h-4 w-4" />
                                  #{truck.truckNumber} - {truck.make} {truck.model}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {errors.truckId && <p className="text-sm text-destructive">{errors.truckId.message}</p>}

                    {/* Live Stats display */}
                    {isLoadingContext ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 pl-1 animate-pulse">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Scanning fleet for truck data...
                      </div>
                    ) : contextData?.stats ? (
                      <div className="grid grid-cols-2 gap-2 mt-3 mb-2">
                        <div className={cn("p-2 rounded border text-center", (contextData.stats.fuelLevel !== null && contextData.stats.fuelLevel < 25) ? "bg-red-50 border-red-200" : "bg-muted/50 border-muted")}>
                          <span className="text-[10px] text-muted-foreground block uppercase">Fuel</span>
                          <div className="flex items-center justify-center gap-1">
                            <span className={cn("font-bold text-sm", (contextData.stats.fuelLevel !== null && contextData.stats.fuelLevel < 25) ? "text-red-600" : "text-foreground")}>
                              {contextData.stats.fuelLevel !== null ? `${contextData.stats.fuelLevel}%` : '--'}
                            </span>
                          </div>
                        </div>
                        <div className="bg-muted/50 p-2 rounded border border-muted text-center">
                          <span className="text-[10px] text-muted-foreground block uppercase">Odometer</span>
                          <span className="font-bold text-sm block">{contextData.stats.odometer?.toLocaleString() || '--'} <span className="text-[10px] font-normal">mi</span></span>
                        </div>
                      </div>
                    ) : selectedTruckId ? (
                      <div className="text-xs text-muted-foreground mt-2 pl-1 italic flex items-center gap-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
                        <AlertTriangle className="h-3 w-3" />
                        {contextMessage || 'No telematics data available'}
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Priority *</Label>
                    <Select defaultValue="MEDIUM" onValueChange={(v) => setValue('priority', v as any)}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CRITICAL">🔴 Critical</SelectItem>
                        <SelectItem value="HIGH">🟡 High</SelectItem>
                        <SelectItem value="MEDIUM">🟢 Medium</SelectItem>
                        <SelectItem value="LOW">⚪ Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Active Fault Codes Warning */}
                {hasFaultCodes && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                    <button
                      type="button"
                      onClick={() => setFaultCodesExpanded(!faultCodesExpanded)}
                      className="flex items-center justify-between w-full text-left mb-2 text-destructive font-semibold hover:opacity-80"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Active Fault Codes Detected ({contextData.diagnostics.faultCodes.length})</span>
                      </div>
                      {faultCodesExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <div className="space-y-1">
                      {(faultCodesExpanded ? contextData.diagnostics.faultCodes : contextData.diagnostics.faultCodes.slice(0, 3)).map((fault: any, i: number) => (
                        <div key={i} className="text-xs flex gap-2">
                          <span className="font-mono bg-background px-1 rounded border">{fault.code}</span>
                          <span className="text-muted-foreground truncate">{fault.description}</span>
                        </div>
                      ))}
                      {!faultCodesExpanded && contextData.diagnostics.faultCodes.length > 3 && (
                        <div className="text-xs text-muted-foreground italic pl-1">
                          + {contextData.diagnostics.faultCodes.length - 3} more codes (click to expand)
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Type & Location Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Breakdown Type *</Label>
                    <Select defaultValue="OTHER" onValueChange={(v) => setValue('breakdownType', v as any)}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ENGINE_FAILURE">🔧 Engine Failure</SelectItem>
                        <SelectItem value="TRANSMISSION_FAILURE">⚙️ Transmission Failure</SelectItem>
                        <SelectItem value="BRAKE_FAILURE">🛑 Brake Failure</SelectItem>
                        <SelectItem value="TIRE_FLAT">🛞 Flat Tire</SelectItem>
                        <SelectItem value="TIRE_BLOWOUT">💥 Tire Blowout</SelectItem>
                        <SelectItem value="ELECTRICAL_ISSUE">⚡ Electrical Issue</SelectItem>
                        <SelectItem value="COOLING_SYSTEM">❄️ Cooling System</SelectItem>
                        <SelectItem value="FUEL_SYSTEM">⛽ Fuel System</SelectItem>
                        <SelectItem value="SUSPENSION">🔩 Suspension</SelectItem>
                        <SelectItem value="ACCIDENT_DAMAGE">🚨 Accident Damage</SelectItem>
                        <SelectItem value="WEATHER_RELATED">🌧️ Weather Related</SelectItem>
                        <SelectItem value="OTHER">📋 Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold flex justify-between">
                      Location *
                      {isLoadingContext && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                      {contextData?.location && <span className="text-xs text-green-600 font-normal">📍 Live from Samsara</span>}
                    </Label>
                    <Input
                      placeholder="e.g., I-80, MM 145"
                      {...register('location')}
                      className="h-11"
                    />
                    {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}

                    {contextData?.location?.latitude && contextData?.location?.longitude && (
                      <NearbyVendorsWidget
                        latitude={contextData.location.latitude}
                        longitude={contextData.location.longitude}
                      />
                    )}
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Description *</Label>
                  <p className="text-sm text-muted-foreground">
                    Describe the issue in detail. The AI will analyze this to suggest solutions.
                  </p>
                  <Textarea
                    placeholder="e.g., Engine making loud knocking noise, losing power on highway..."
                    rows={8}
                    {...register('description')}
                    className="resize-none"
                  />
                  {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={handleClose} size="lg">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} size="lg">
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Case'
                    )}
                  </Button>
                </div>
              </form>
            </ScrollArea>
          </div>

          {/* AI Assistant Sidebar - Right Side (1/3 width) */}
          <div className="flex-1 bg-muted/30">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">AI Assistant</h3>
                </div>

                <SolutionSuggestions
                  description={description || ''}
                  truckId={selectedTruckId}
                  breakdownType={breakdownType}
                  faultCodes={hasFaultCodes ? contextData.diagnostics.faultCodes : undefined}
                  onApplySuggestion={handleApplySuggestion}
                />

                <SimilarCasesPanel
                  description={description || ''}
                  truckId={selectedTruckId}
                  breakdownType={breakdownType}
                  onUseSolution={handleUseSolution}
                />
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

