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
import { Palette, Moon, Sun, Monitor, Layout, Type, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import { useTheme } from '@/components/providers/ThemeProvider';

const appearanceSchema = z.object({
  // Theme
  theme: z.enum(['light', 'dark', 'amber', 'system']),
  
  // Colors
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  
  // Layout
  sidebarCollapsed: z.boolean(),
  sidebarPosition: z.enum(['left', 'right']),
  compactMode: z.boolean(),
  density: z.enum(['comfortable', 'compact', 'spacious']),
  
  // Typography
  fontSize: z.enum(['small', 'medium', 'large']),
  fontFamily: z.enum(['system', 'inter', 'roboto', 'open-sans']),
  
  // UI Elements
  showBreadcrumbs: z.boolean(),
  showPageHeaders: z.boolean(),
  showTableStripes: z.boolean(),
  showAnimations: z.boolean(),
  
  // Dashboard
  dashboardLayout: z.enum(['grid', 'list', 'cards']),
  showQuickActions: z.boolean(),
  showRecentActivity: z.boolean(),
  showStats: z.boolean(),
});

type AppearanceSettings = z.infer<typeof appearanceSchema>;

async function fetchAppearanceSettings() {
  const response = await fetch(apiUrl('/api/settings/appearance'));
  if (!response.ok) throw new Error('Failed to fetch appearance settings');
  return response.json();
}

async function updateAppearanceSettings(data: AppearanceSettings) {
  const response = await fetch(apiUrl('/api/settings/appearance'), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update appearance settings');
  }
  return response.json();
}

export default function AppearanceSettings() {
  const queryClient = useQueryClient();
  const { theme: currentTheme, setTheme } = useTheme();
  const [error, setError] = useState<string | null>(null);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['appearance-settings'],
    queryFn: fetchAppearanceSettings,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<AppearanceSettings>({
    resolver: zodResolver(appearanceSchema),
    values: settingsData?.data || {
      theme: (currentTheme as any) || 'system',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      accentColor: '#10b981',
      sidebarCollapsed: false,
      sidebarPosition: 'left',
      compactMode: false,
      density: 'comfortable',
      fontSize: 'medium',
      fontFamily: 'system',
      showBreadcrumbs: true,
      showPageHeaders: true,
      showTableStripes: true,
      showAnimations: true,
      dashboardLayout: 'grid',
      showQuickActions: true,
      showRecentActivity: true,
      showStats: true,
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateAppearanceSettings,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appearance-settings'] });
      // Update theme immediately
      if (variables.theme) {
        setTheme(variables.theme);
      }
      toast.success('Appearance settings updated successfully');
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const onSubmit = (data: AppearanceSettings) => {
    setError(null);
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Theme */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <CardTitle>Theme</CardTitle>
          </div>
          <CardDescription>
            Choose your preferred color theme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme Mode</Label>
            <Select
              value={watch('theme')}
              onValueChange={(value: any) => {
                setValue('theme', value);
                setTheme(value);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Dark
                  </div>
                </SelectItem>
                <SelectItem value="amber">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4" />
                    Amber
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    System
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  {...register('primaryColor')}
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  {...register('primaryColor')}
                  placeholder="#3b82f6"
                />
              </div>
              {errors.primaryColor && (
                <p className="text-sm text-destructive">{errors.primaryColor.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  {...register('secondaryColor')}
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  {...register('secondaryColor')}
                  placeholder="#8b5cf6"
                />
              </div>
              {errors.secondaryColor && (
                <p className="text-sm text-destructive">{errors.secondaryColor.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  id="accentColor"
                  type="color"
                  {...register('accentColor')}
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  {...register('accentColor')}
                  placeholder="#10b981"
                />
              </div>
              {errors.accentColor && (
                <p className="text-sm text-destructive">{errors.accentColor.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layout */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            <CardTitle>Layout</CardTitle>
          </div>
          <CardDescription>
            Customize the application layout and spacing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sidebarPosition">Sidebar Position</Label>
              <Select
                value={watch('sidebarPosition')}
                onValueChange={(value: any) => setValue('sidebarPosition', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="density">Density</Label>
              <Select
                value={watch('density')}
                onValueChange={(value: any) => setValue('density', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="spacious">Spacious</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Collapse Sidebar by Default</Label>
                <p className="text-sm text-muted-foreground">
                  Start with sidebar collapsed
                </p>
              </div>
              <Switch
                checked={watch('sidebarCollapsed')}
                onCheckedChange={(checked) => setValue('sidebarCollapsed', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compact Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Reduce spacing and padding throughout the app
                </p>
              </div>
              <Switch
                checked={watch('compactMode')}
                onCheckedChange={(checked) => setValue('compactMode', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            <CardTitle>Typography</CardTitle>
          </div>
          <CardDescription>
            Adjust font size and family
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fontSize">Font Size</Label>
              <Select
                value={watch('fontSize')}
                onValueChange={(value: any) => setValue('fontSize', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontFamily">Font Family</Label>
              <Select
                value={watch('fontFamily')}
                onValueChange={(value: any) => setValue('fontFamily', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System Default</SelectItem>
                  <SelectItem value="inter">Inter</SelectItem>
                  <SelectItem value="roboto">Roboto</SelectItem>
                  <SelectItem value="open-sans">Open Sans</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UI Elements */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            <CardTitle>UI Elements</CardTitle>
          </div>
          <CardDescription>
            Toggle visibility of interface elements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Breadcrumbs</Label>
              <p className="text-sm text-muted-foreground">
                Display navigation breadcrumbs at the top of pages
              </p>
            </div>
            <Switch
              checked={watch('showBreadcrumbs')}
              onCheckedChange={(checked) => setValue('showBreadcrumbs', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Page Headers</Label>
              <p className="text-sm text-muted-foreground">
                Display page titles and descriptions
              </p>
            </div>
            <Switch
              checked={watch('showPageHeaders')}
              onCheckedChange={(checked) => setValue('showPageHeaders', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Table Stripes</Label>
              <p className="text-sm text-muted-foreground">
                Alternate row colors in tables for better readability
              </p>
            </div>
            <Switch
              checked={watch('showTableStripes')}
              onCheckedChange={(checked) => setValue('showTableStripes', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Animations</Label>
              <p className="text-sm text-muted-foreground">
                Enable transitions and animations
              </p>
            </div>
            <Switch
              checked={watch('showAnimations')}
              onCheckedChange={(checked) => setValue('showAnimations', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            <CardTitle>Dashboard</CardTitle>
          </div>
          <CardDescription>
            Customize dashboard layout and widgets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dashboardLayout">Dashboard Layout</Label>
            <Select
              value={watch('dashboardLayout')}
              onValueChange={(value: any) => setValue('dashboardLayout', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="list">List</SelectItem>
                <SelectItem value="cards">Cards</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Quick Actions</Label>
                <p className="text-sm text-muted-foreground">
                  Display quick action buttons on dashboard
                </p>
              </div>
              <Switch
                checked={watch('showQuickActions')}
                onCheckedChange={(checked) => setValue('showQuickActions', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Recent Activity</Label>
                <p className="text-sm text-muted-foreground">
                  Display recent activity feed on dashboard
                </p>
              </div>
              <Switch
                checked={watch('showRecentActivity')}
                onCheckedChange={(checked) => setValue('showRecentActivity', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Statistics</Label>
                <p className="text-sm text-muted-foreground">
                  Display statistics cards on dashboard
                </p>
              </div>
              <Switch
                checked={watch('showStats')}
                onCheckedChange={(checked) => setValue('showStats', checked)}
              />
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
