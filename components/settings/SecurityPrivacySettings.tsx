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
import { Shield, Lock, Eye, Key, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

const securitySchema = z.object({
  // Password Policy
  minPasswordLength: z.number().min(8).max(32),
  requireUppercase: z.boolean(),
  requireLowercase: z.boolean(),
  requireNumbers: z.boolean(),
  requireSpecialChars: z.boolean(),
  passwordExpiryDays: z.number().min(0).max(365),
  
  // Session Management
  sessionTimeout: z.number().min(5).max(1440), // minutes
  maxConcurrentSessions: z.number().min(1).max(10),
  
  // Two-Factor Authentication
  require2FA: z.boolean(),
  require2FAForAdmin: z.boolean(),
  
  // Login Security
  maxLoginAttempts: z.number().min(3).max(10),
  lockoutDuration: z.number().min(5).max(60), // minutes
  
  // Data Privacy
  enableAuditLog: z.boolean(),
  logRetentionDays: z.number().min(30).max(3650),
  enableDataEncryption: z.boolean(),
  
  // Access Control
  allowRemoteAccess: z.boolean(),
  ipWhitelist: z.string().optional(),
});

type SecuritySettings = z.infer<typeof securitySchema>;

async function fetchSecuritySettings() {
  const response = await fetch(apiUrl('/api/settings/security'));
  if (!response.ok) throw new Error('Failed to fetch security settings');
  return response.json();
}

async function updateSecuritySettings(data: SecuritySettings) {
  const response = await fetch(apiUrl('/api/settings/security'), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update security settings');
  }
  return response.json();
}

export default function SecurityPrivacySettings() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['security-settings'],
    queryFn: fetchSecuritySettings,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<SecuritySettings>({
    resolver: zodResolver(securitySchema),
    values: settingsData?.data || {
      minPasswordLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      passwordExpiryDays: 90,
      sessionTimeout: 60,
      maxConcurrentSessions: 3,
      require2FA: false,
      require2FAForAdmin: true,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      enableAuditLog: true,
      logRetentionDays: 365,
      enableDataEncryption: true,
      allowRemoteAccess: true,
      ipWhitelist: '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateSecuritySettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-settings'] });
      toast.success('Security settings updated successfully');
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const onSubmit = (data: SecuritySettings) => {
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
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Error</p>
                <p className="text-xs text-destructive/90 mt-0.5">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Password Policy */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <CardTitle>Password Policy</CardTitle>
          </div>
          <CardDescription>
            Configure password requirements for all users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minPasswordLength">Minimum Password Length</Label>
              <Input
                id="minPasswordLength"
                type="number"
                {...register('minPasswordLength', { valueAsNumber: true })}
              />
              {errors.minPasswordLength && (
                <p className="text-sm text-destructive">{errors.minPasswordLength.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordExpiryDays">Password Expiry (days)</Label>
              <Input
                id="passwordExpiryDays"
                type="number"
                {...register('passwordExpiryDays', { valueAsNumber: true })}
              />
              {errors.passwordExpiryDays && (
                <p className="text-sm text-destructive">{errors.passwordExpiryDays.message}</p>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Uppercase Letters</Label>
                <p className="text-sm text-muted-foreground">At least one uppercase letter (A-Z)</p>
              </div>
              <Switch
                checked={watch('requireUppercase')}
                onCheckedChange={(checked) => setValue('requireUppercase', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Lowercase Letters</Label>
                <p className="text-sm text-muted-foreground">At least one lowercase letter (a-z)</p>
              </div>
              <Switch
                checked={watch('requireLowercase')}
                onCheckedChange={(checked) => setValue('requireLowercase', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Numbers</Label>
                <p className="text-sm text-muted-foreground">At least one number (0-9)</p>
              </div>
              <Switch
                checked={watch('requireNumbers')}
                onCheckedChange={(checked) => setValue('requireNumbers', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Special Characters</Label>
                <p className="text-sm text-muted-foreground">At least one special character (!@#$%)</p>
              </div>
              <Switch
                checked={watch('requireSpecialChars')}
                onCheckedChange={(checked) => setValue('requireSpecialChars', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <CardTitle>Session Management</CardTitle>
          </div>
          <CardDescription>
            Control user session behavior and security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                {...register('sessionTimeout', { valueAsNumber: true })}
              />
              {errors.sessionTimeout && (
                <p className="text-sm text-destructive">{errors.sessionTimeout.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxConcurrentSessions">Max Concurrent Sessions</Label>
              <Input
                id="maxConcurrentSessions"
                type="number"
                {...register('maxConcurrentSessions', { valueAsNumber: true })}
              />
              {errors.maxConcurrentSessions && (
                <p className="text-sm text-destructive">{errors.maxConcurrentSessions.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Two-Factor Authentication</CardTitle>
          </div>
          <CardDescription>
            Add an extra layer of security with 2FA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require 2FA for All Users</Label>
              <p className="text-sm text-muted-foreground">Force all users to enable 2FA</p>
            </div>
            <Switch
              checked={watch('require2FA')}
              onCheckedChange={(checked) => setValue('require2FA', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require 2FA for Admins</Label>
              <p className="text-sm text-muted-foreground">Force admin users to enable 2FA</p>
            </div>
            <Switch
              checked={watch('require2FAForAdmin')}
              onCheckedChange={(checked) => setValue('require2FAForAdmin', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Login Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle>Login Security</CardTitle>
          </div>
          <CardDescription>
            Protect against brute force attacks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                {...register('maxLoginAttempts', { valueAsNumber: true })}
              />
              {errors.maxLoginAttempts && (
                <p className="text-sm text-destructive">{errors.maxLoginAttempts.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
              <Input
                id="lockoutDuration"
                type="number"
                {...register('lockoutDuration', { valueAsNumber: true })}
              />
              {errors.lockoutDuration && (
                <p className="text-sm text-destructive">{errors.lockoutDuration.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Privacy */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            <CardTitle>Data Privacy & Compliance</CardTitle>
          </div>
          <CardDescription>
            Manage data retention and encryption
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Audit Logging</Label>
              <p className="text-sm text-muted-foreground">Track all user actions and changes</p>
            </div>
            <Switch
              checked={watch('enableAuditLog')}
              onCheckedChange={(checked) => setValue('enableAuditLog', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logRetentionDays">Log Retention (days)</Label>
            <Input
              id="logRetentionDays"
              type="number"
              {...register('logRetentionDays', { valueAsNumber: true })}
            />
            {errors.logRetentionDays && (
              <p className="text-sm text-destructive">{errors.logRetentionDays.message}</p>
            )}
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Data Encryption</Label>
              <p className="text-sm text-muted-foreground">Encrypt sensitive data at rest</p>
            </div>
            <Switch
              checked={watch('enableDataEncryption')}
              onCheckedChange={(checked) => setValue('enableDataEncryption', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Access Control */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Access Control</CardTitle>
          </div>
          <CardDescription>
            Control who can access your system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Remote Access</Label>
              <p className="text-sm text-muted-foreground">Allow access from any IP address</p>
            </div>
            <Switch
              checked={watch('allowRemoteAccess')}
              onCheckedChange={(checked) => setValue('allowRemoteAccess', checked)}
            />
          </div>

          {!watch('allowRemoteAccess') && (
            <div className="space-y-2">
              <Label htmlFor="ipWhitelist">IP Whitelist</Label>
              <Input
                id="ipWhitelist"
                placeholder="192.168.1.1, 10.0.0.0/24"
                {...register('ipWhitelist')}
              />
              <p className="text-sm text-muted-foreground">
                Comma-separated list of allowed IP addresses or CIDR ranges
              </p>
              {errors.ipWhitelist && (
                <p className="text-sm text-destructive">{errors.ipWhitelist.message}</p>
              )}
            </div>
          )}
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





