'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Truck, User, MapPin, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import { z } from 'zod';

const quickEntrySchema = z.object({
  truckId: z.string().min(1, 'Truck is required'),
  driverId: z.string().optional(),
  loadId: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  city: z.string().optional(),
  state: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  breakdownType: z.enum([
    'ENGINE_FAILURE',
    'TRANSMISSION_FAILURE',
    'BRAKE_FAILURE',
    'TIRE_FLAT',
    'TIRE_BLOWOUT',
    'ELECTRICAL_ISSUE',
    'COOLING_SYSTEM',
    'FUEL_SYSTEM',
    'SUSPENSION',
    'ACCIDENT_DAMAGE',
    'WEATHER_RELATED',
    'OTHER',
  ]),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  description: z.string().min(1, 'Description is required'),
  urgencyLevel: z.enum(['IMMOBILIZED', 'CAN_LIMP', 'SAFETY_HAZARD', 'NON_URGENT']).optional(),
  loadStatus: z.enum(['LOADED', 'EMPTY']).optional(),
  appointmentTime: z.string().optional(),
});

type QuickEntryFormData = z.infer<typeof quickEntrySchema>;

// Common problem templates
const problemTemplates = [
  { value: 'WON\'T_START', label: "Won't start", description: 'Engine won\'t start' },
  { value: 'FLAT_TIRE', label: 'Flat tire', description: 'Flat tire on vehicle' },
  { value: 'ENGINE_LIGHT', label: 'Engine light on', description: 'Check engine light is on' },
  { value: 'ACCIDENT', label: 'Accident', description: 'Vehicle involved in accident' },
  { value: 'OVERHEATING', label: 'Overheating', description: 'Engine overheating' },
  { value: 'ELECTRICAL', label: 'Electrical issue', description: 'Electrical problem' },
  { value: 'BRAKE_PROBLEM', label: 'Brake problem', description: 'Brake system issue' },
  { value: 'OTHER', label: 'Other', description: 'Other problem' },
];

async function searchTrucks(query: string) {
  const response = await fetch(apiUrl(`/api/trucks?search=${encodeURIComponent(query)}&limit=10`));
  if (!response.ok) throw new Error('Failed to search trucks');
  const data = await response.json();
  return data.data || [];
}

async function searchDrivers(query: string) {
  const response = await fetch(apiUrl(`/api/search?q=${encodeURIComponent(query)}`));
  if (!response.ok) throw new Error('Failed to search drivers');
  const data = await response.json();
  return data.data?.drivers || [];
}

async function createBreakdown(data: QuickEntryFormData) {
  const response = await fetch(apiUrl('/api/breakdowns'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create breakdown');
  }
  return response.json();
}

interface BreakdownQuickEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedTruckId?: string;
  preselectedDriverId?: string;
}

export default function BreakdownQuickEntryForm({
  open,
  onOpenChange,
  preselectedTruckId,
  preselectedDriverId,
}: BreakdownQuickEntryFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [truckSearchOpen, setTruckSearchOpen] = useState(false);
  const [driverSearchOpen, setDriverSearchOpen] = useState(false);
  const [truckSearchQuery, setTruckSearchQuery] = useState('');
  const [driverSearchQuery, setDriverSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<QuickEntryFormData>({
    resolver: zodResolver(quickEntrySchema),
    defaultValues: {
      priority: 'MEDIUM',
      urgencyLevel: 'NON_URGENT',
      loadStatus: 'EMPTY',
    },
  });

  const selectedTruckId = watch('truckId');
  const selectedDriverId = watch('driverId');
  const selectedUrgency = watch('urgencyLevel');

  // Search trucks
  const { data: trucksData } = useQuery({
    queryKey: ['truckSearch', truckSearchQuery],
    queryFn: () => searchTrucks(truckSearchQuery),
    enabled: truckSearchOpen && truckSearchQuery.length > 0,
  });

  // Search drivers
  const { data: driversData } = useQuery({
    queryKey: ['driverSearch', driverSearchQuery],
    queryFn: () => searchDrivers(driverSearchQuery),
    enabled: driverSearchOpen && driverSearchQuery.length > 0,
  });

  const trucks = trucksData || [];
  const drivers = driversData || [];

  // Set preselected values
  useEffect(() => {
    if (preselectedTruckId) {
      setValue('truckId', preselectedTruckId);
    }
    if (preselectedDriverId) {
      setValue('driverId', preselectedDriverId);
    }
  }, [preselectedTruckId, preselectedDriverId, setValue]);

  // Auto-populate priority based on urgency
  useEffect(() => {
    if (selectedUrgency === 'IMMOBILIZED' || selectedUrgency === 'SAFETY_HAZARD') {
      setValue('priority', 'CRITICAL');
    } else if (selectedUrgency === 'CAN_LIMP') {
      setValue('priority', 'HIGH');
    } else {
      setValue('priority', 'MEDIUM');
    }
  }, [selectedUrgency, setValue]);

  const createMutation = useMutation({
    mutationFn: createBreakdown,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activeBreakdowns'] });
      queryClient.invalidateQueries({ queryKey: ['breakdowns'] });
      toast.success(`Breakdown ${data.data.breakdownNumber} created successfully`);
      reset();
      onOpenChange(false);
      router.push(`/dashboard/fleet`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const onSubmit = async (data: QuickEntryFormData) => {
    createMutation.mutate(data);
  };

  const handleTemplateSelect = (template: typeof problemTemplates[0]) => {
    setSelectedTemplate(template.value);
    setValue('breakdownType', template.value === 'WON\'T_START' ? 'ENGINE_FAILURE' :
      template.value === 'FLAT_TIRE' ? 'TIRE_FLAT' :
        template.value === 'ENGINE_LIGHT' ? 'ENGINE_FAILURE' :
          template.value === 'ACCIDENT' ? 'ACCIDENT_DAMAGE' :
            template.value === 'OVERHEATING' ? 'COOLING_SYSTEM' :
              template.value === 'ELECTRICAL' ? 'ELECTRICAL_ISSUE' :
                template.value === 'BRAKE_PROBLEM' ? 'BRAKE_FAILURE' : 'OTHER');
    setValue('description', template.description);
  };

  // Get selected truck info
  const selectedTruck = trucks.find((t: any) => t.id === selectedTruckId);
  const selectedDriver = drivers.find((d: any) => d.id === selectedDriverId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Breakdown Entry</DialogTitle>
          <DialogDescription>
            Report a new breakdown in under 1 minute. Required fields are marked with *.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Problem Templates - Quick Select */}
          <div className="space-y-2">
            <Label>Quick Select Problem Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {problemTemplates.map((template) => (
                <Button
                  key={template.value}
                  type="button"
                  variant={selectedTemplate === template.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTemplateSelect(template)}
                  className="h-auto py-2 flex flex-col items-center gap-1"
                >
                  <span className="text-xs font-medium">{template.label}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Truck Selection */}
              <div className="space-y-2">
                <Label htmlFor="truckId">Truck *</Label>
                <Popover open={truckSearchOpen} onOpenChange={setTruckSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedTruck
                        ? `${selectedTruck.truckNumber} - ${selectedTruck.make} ${selectedTruck.model}`
                        : 'Search for truck...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search trucks..."
                        value={truckSearchQuery}
                        onValueChange={setTruckSearchQuery}
                      />
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
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  selectedTruckId === truck.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <Truck className="mr-2 h-4 w-4" />
                              {truck.truckNumber} - {truck.make} {truck.model}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.truckId && (
                  <p className="text-sm text-destructive">{errors.truckId.message}</p>
                )}
              </div>

              {/* Driver Selection */}
              <div className="space-y-2">
                <Label htmlFor="driverId">Driver (Optional)</Label>
                <Popover open={driverSearchOpen} onOpenChange={setDriverSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedDriver
                        ? `${selectedDriver.user.firstName} ${selectedDriver.user.lastName} (#${selectedDriver.driverNumber})`
                        : 'Search for driver...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search drivers..."
                        value={driverSearchQuery}
                        onValueChange={setDriverSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>No drivers found.</CommandEmpty>
                        <CommandGroup>
                          {drivers.map((driver: any) => (
                            <CommandItem
                              key={driver.id}
                              value={driver.id}
                              onSelect={() => {
                                setValue('driverId', driver.id);
                                setDriverSearchOpen(false);
                                setDriverSearchQuery('');
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  selectedDriverId === driver.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <User className="mr-2 h-4 w-4" />
                              {driver.user.firstName} {driver.user.lastName} (#{driver.driverNumber})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    placeholder="e.g., I-80, Mile Marker 145"
                    {...register('location')}
                  />
                </div>
                {errors.location && (
                  <p className="text-sm text-destructive">{errors.location.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="City" {...register('city')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" placeholder="State" maxLength={2} {...register('state')} />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Urgency Level */}
              <div className="space-y-2">
                <Label>Urgency Level *</Label>
                <RadioGroup
                  value={selectedUrgency}
                  onValueChange={(value) => setValue('urgencyLevel', value as any)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="IMMOBILIZED" id="immobilized" />
                    <Label htmlFor="immobilized" className="font-normal cursor-pointer flex items-center gap-2">
                      <Badge className="bg-red-500 text-white">🔴 Immobilized</Badge>
                      <span className="text-xs text-muted-foreground">Cannot move</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="CAN_LIMP" id="canLimp" />
                    <Label htmlFor="canLimp" className="font-normal cursor-pointer flex items-center gap-2">
                      <Badge className="bg-orange-500 text-white">🟡 Can Limp</Badge>
                      <span className="text-xs text-muted-foreground">Can drive slowly</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SAFETY_HAZARD" id="safetyHazard" />
                    <Label htmlFor="safetyHazard" className="font-normal cursor-pointer flex items-center gap-2">
                      <Badge className="bg-red-500 text-white">🔴 Safety Hazard</Badge>
                      <span className="text-xs text-muted-foreground">Immediate safety concern</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="NON_URGENT" id="nonUrgent" />
                    <Label htmlFor="nonUrgent" className="font-normal cursor-pointer flex items-center gap-2">
                      <Badge className="bg-blue-500 text-white">⚪ Non-Urgent</Badge>
                      <span className="text-xs text-muted-foreground">Can wait</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Load Status */}
              <div className="space-y-2">
                <Label>Load Status</Label>
                <RadioGroup
                  value={watch('loadStatus')}
                  onValueChange={(value) => setValue('loadStatus', value as any)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="LOADED" id="loaded" />
                    <Label htmlFor="loaded" className="font-normal cursor-pointer">
                      Loaded
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="EMPTY" id="empty" />
                    <Label htmlFor="empty" className="font-normal cursor-pointer">
                      Empty
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {watch('loadStatus') === 'LOADED' && (
                <div className="space-y-2">
                  <Label htmlFor="appointmentTime">Appointment Time</Label>
                  <Input
                    id="appointmentTime"
                    type="datetime-local"
                    {...register('appointmentTime')}
                  />
                </div>
              )}

              {/* Breakdown Type */}
              <div className="space-y-2">
                <Label htmlFor="breakdownType">Breakdown Type *</Label>
                <Select
                  onValueChange={(value) => setValue('breakdownType', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENGINE_FAILURE">Engine Failure</SelectItem>
                    <SelectItem value="TRANSMISSION_FAILURE">Transmission Failure</SelectItem>
                    <SelectItem value="BRAKE_FAILURE">Brake Failure</SelectItem>
                    <SelectItem value="TIRE_FLAT">Tire Flat</SelectItem>
                    <SelectItem value="TIRE_BLOWOUT">Tire Blowout</SelectItem>
                    <SelectItem value="ELECTRICAL_ISSUE">Electrical Issue</SelectItem>
                    <SelectItem value="COOLING_SYSTEM">Cooling System</SelectItem>
                    <SelectItem value="FUEL_SYSTEM">Fuel System</SelectItem>
                    <SelectItem value="SUSPENSION">Suspension</SelectItem>
                    <SelectItem value="ACCIDENT_DAMAGE">Accident Damage</SelectItem>
                    <SelectItem value="WEATHER_RELATED">Weather Related</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.breakdownType && (
                  <p className="text-sm text-destructive">{errors.breakdownType.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the problem..."
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Auto-set Priority Display */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Priority automatically set to: <strong>{watch('priority')}</strong> based on urgency level
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Breakdown'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

