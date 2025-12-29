'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Globe, Clock, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

const generalSettingsSchema = z.object({
  // Regional Settings
  timezone: z.string().min(1, 'Timezone is required'),
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']),
  timeFormat: z.enum(['12h', '24h']),
  currency: z.string().length(3, 'Currency code must be 3 characters'),
  currencySymbol: z.string().min(1, 'Currency symbol is required'),
  
  // Business Hours
  businessDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])),
  businessHoursStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  businessHoursEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  timezoneOffset: z.number().default(0),
  
  // Default Values
  defaultPaymentTerms: z.number().min(0).max(365),
  defaultLoadType: z.enum(['FTL', 'LTL', 'PARTIAL', 'INTERMODAL']),
  defaultEquipmentType: z.enum(['DRY_VAN', 'REEFER', 'FLATBED', 'STEP_DECK', 'LOWBOY', 'TANKER', 'CONESTOGA', 'POWER_ONLY', 'HOTSHOT']),
  
  // System Preferences
  autoCalculateMiles: z.boolean(),
  autoAssignDrivers: z.boolean(),
  requirePOD: z.boolean(),
  enableLoadTemplates: z.boolean(),
  dispatcherSeeAllLoads: z.boolean().optional(), // Allow dispatchers to see all loads (default: true)
  
  // Numbering
  loadNumberPrefix: z.string().optional(),
  loadNumberFormat: z.enum(['SEQUENTIAL', 'DATE_SEQUENTIAL', 'CUSTOM']),
  invoiceNumberPrefix: z.string().optional(),
  invoiceNumberFormat: z.enum(['SEQUENTIAL', 'DATE_SEQUENTIAL', 'CUSTOM']),
});

type GeneralSettings = z.infer<typeof generalSettingsSchema>;

async function fetchGeneralSettings() {
  const response = await fetch(apiUrl('/api/settings/general'));
  if (!response.ok) throw new Error('Failed to fetch general settings');
  return response.json();
}

async function updateGeneralSettings(data: GeneralSettings) {
  const response = await fetch(apiUrl('/api/settings/general'), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update general settings');
  }
  return response.json();
}

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
];

export default function GeneralSettings() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['general-settings'],
    queryFn: fetchGeneralSettings,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<GeneralSettings>({
    resolver: zodResolver(generalSettingsSchema) as any,
    values: settingsData?.data || {
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      currency: 'USD',
      currencySymbol: '$',
      businessDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      businessHoursStart: '08:00',
      businessHoursEnd: '17:00',
      timezoneOffset: 0,
      defaultPaymentTerms: 30,
      defaultLoadType: 'FTL',
      defaultEquipmentType: 'DRY_VAN',
      autoCalculateMiles: true,
      autoAssignDrivers: false,
      requirePOD: false,
      enableLoadTemplates: true,
      dispatcherSeeAllLoads: true, // Default: dispatchers see all loads
      loadNumberPrefix: '',
      loadNumberFormat: 'DATE_SEQUENTIAL',
      invoiceNumberPrefix: '',
      invoiceNumberFormat: 'DATE_SEQUENTIAL',
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateGeneralSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['general-settings'] });
      toast.success('General settings updated successfully');
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const onSubmit = (data: GeneralSettings) => {
    setError(null);
    updateMutation.mutate(data);
  };

  const toggleBusinessDay = (day: string) => {
    const currentDays = watch('businessDays') || [];
    const newDays = currentDays.includes(day as any)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day as any];
    setValue('businessDays', newDays as any, { shouldDirty: true });
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>Regional Settings</CardTitle>
          </div>
          <CardDescription>
            Configure timezone, date/time format, and currency
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={watch('timezone')}
                onValueChange={(value) => setValue('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.timezone && (
                <p className="text-sm text-destructive">{errors.timezone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select
                value={watch('dateFormat')}
                onValueChange={(value: any) => setValue('dateFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="timeFormat">Time Format</Label>
              <Select
                value={watch('timeFormat')}
                onValueChange={(value: any) => setValue('timeFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                  <SelectItem value="24h">24-hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={watch('currency')}
                onValueChange={(value) => {
                  const currency = CURRENCIES.find((c) => c.code === value);
                  setValue('currency', value);
                  if (currency) {
                    setValue('currencySymbol', currency.symbol);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.name} ({curr.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currencySymbol">Currency Symbol</Label>
            <Input id="currencySymbol" {...register('currencySymbol')} />
            {errors.currencySymbol && (
              <p className="text-sm text-destructive">{errors.currencySymbol.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <CardTitle>Business Hours</CardTitle>
          </div>
          <CardDescription>
            Define your company's operating hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="businessHoursStart">Start Time</Label>
              <Input
                id="businessHoursStart"
                type="time"
                {...register('businessHoursStart')}
              />
              {errors.businessHoursStart && (
                <p className="text-sm text-destructive">{errors.businessHoursStart.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessHoursEnd">End Time</Label>
              <Input
                id="businessHoursEnd"
                type="time"
                {...register('businessHoursEnd')}
              />
              {errors.businessHoursEnd && (
                <p className="text-sm text-destructive">{errors.businessHoursEnd.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Business Days</Label>
            <div className="flex flex-wrap gap-2">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                <Button
                  key={day}
                  type="button"
                  variant={watch('businessDays')?.includes(day as any) ? 'default' : 'outline'}
                  onClick={() => toggleBusinessDay(day)}
                  className="capitalize"
                >
                  {day.slice(0, 3)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Values */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <CardTitle>Default Values</CardTitle>
          </div>
          <CardDescription>
            Set default values for new records
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defaultPaymentTerms">Default Payment Terms (days)</Label>
              <Input
                id="defaultPaymentTerms"
                type="number"
                {...register('defaultPaymentTerms', { valueAsNumber: true })}
              />
              {errors.defaultPaymentTerms && (
                <p className="text-sm text-destructive">{errors.defaultPaymentTerms.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultLoadType">Default Load Type</Label>
              <Select
                value={watch('defaultLoadType')}
                onValueChange={(value: any) => setValue('defaultLoadType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FTL">Full Truckload</SelectItem>
                  <SelectItem value="LTL">Less Than Truckload</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="INTERMODAL">Intermodal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultEquipmentType">Default Equipment Type</Label>
            <Select
              value={watch('defaultEquipmentType')}
              onValueChange={(value: any) => setValue('defaultEquipmentType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRY_VAN">Dry Van</SelectItem>
                <SelectItem value="REEFER">Reefer</SelectItem>
                <SelectItem value="FLATBED">Flatbed</SelectItem>
                <SelectItem value="STEP_DECK">Step Deck</SelectItem>
                <SelectItem value="LOWBOY">Lowboy</SelectItem>
                <SelectItem value="TANKER">Tanker</SelectItem>
                <SelectItem value="CONESTOGA">Conestoga</SelectItem>
                <SelectItem value="POWER_ONLY">Power Only</SelectItem>
                <SelectItem value="HOTSHOT">Hotshot</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* System Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>System Preferences</CardTitle>
          </div>
          <CardDescription>
            Configure automatic behaviors and requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Calculate Miles</Label>
              <p className="text-sm text-muted-foreground">
                Automatically calculate miles when pickup/delivery locations are entered
              </p>
            </div>
            <Switch
              checked={watch('autoCalculateMiles')}
              onCheckedChange={(checked) => setValue('autoCalculateMiles', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Assign Drivers</Label>
              <p className="text-sm text-muted-foreground">
                Automatically suggest driver assignments based on availability
              </p>
            </div>
            <Switch
              checked={watch('autoAssignDrivers')}
              onCheckedChange={(checked) => setValue('autoAssignDrivers', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require POD</Label>
              <p className="text-sm text-muted-foreground">
                Require proof of delivery before marking loads as delivered
              </p>
            </div>
            <Switch
              checked={watch('requirePOD')}
              onCheckedChange={(checked) => setValue('requirePOD', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Load Templates</Label>
              <p className="text-sm text-muted-foreground">
                Allow saving and reusing load templates
              </p>
            </div>
            <Switch
              checked={watch('enableLoadTemplates')}
              onCheckedChange={(checked) => setValue('enableLoadTemplates', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Dispatchers See All Loads</Label>
              <p className="text-sm text-muted-foreground">
                When enabled, dispatchers can see all loads within their MC access. When disabled, dispatchers only see loads they dispatched or loads for their assigned drivers.
              </p>
            </div>
            <Switch
              checked={watch('dispatcherSeeAllLoads') ?? true}
              onCheckedChange={(checked) => setValue('dispatcherSeeAllLoads', checked, { shouldDirty: true })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Numbering */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Numbering</CardTitle>
          </div>
          <CardDescription>
            Configure load and invoice numbering formats
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="loadNumberPrefix">Load Number Prefix</Label>
              <Input
                id="loadNumberPrefix"
                placeholder="LOAD-"
                {...register('loadNumberPrefix')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loadNumberFormat">Load Number Format</Label>
              <Select
                value={watch('loadNumberFormat')}
                onValueChange={(value: any) => setValue('loadNumberFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEQUENTIAL">Sequential (001, 002...)</SelectItem>
                  <SelectItem value="DATE_SEQUENTIAL">Date + Sequential (2024-001)</SelectItem>
                  <SelectItem value="CUSTOM">Custom Format</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumberPrefix">Invoice Number Prefix</Label>
              <Input
                id="invoiceNumberPrefix"
                placeholder="INV-"
                {...register('invoiceNumberPrefix')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceNumberFormat">Invoice Number Format</Label>
              <Select
                value={watch('invoiceNumberFormat')}
                onValueChange={(value: any) => setValue('invoiceNumberFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEQUENTIAL">Sequential (001, 002...)</SelectItem>
                  <SelectItem value="DATE_SEQUENTIAL">Date + Sequential (2024-001)</SelectItem>
                  <SelectItem value="CUSTOM">Custom Format</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          disabled={!isDirty || updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}

