'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { Loader2, Save, DollarSign, Clock, Truck, Building2, Calculator } from 'lucide-react';

interface SystemConfig {
  id: string;
  defaultDetentionRate: number;
  defaultFreeTimeMinutes: number;
  standardTonuFee: number;
  factoringActive: boolean;
  factoringCompanyName: string | null;
  factoringCompanyAddress: string | null;
  payDriverOnFuelSurcharge: boolean;
  companyFuelTaxRate: number | null;
}

export default function AccountingSettingsPage() {
  const { data: session, status } = useSession();
  const { isAdmin } = usePermissions();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SystemConfig | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    defaultDetentionRate: 50,
    defaultFreeTimeMinutes: 120,
    standardTonuFee: 150,
    factoringActive: false,
    factoringCompanyName: '',
    factoringCompanyAddress: '',
    payDriverOnFuelSurcharge: false,
    companyFuelTaxRate: null as number | null,
  });

  // Redirect non-admin users
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.replace('/api/auth/signin');
      return;
    }
    if (!isAdmin) {
      router.replace('/dashboard');
      return;
    }
  }, [session, status, isAdmin, router]);

  // Fetch config on mount
  useEffect(() => {
    if (isAdmin && session) {
      fetchConfig();
    }
  }, [isAdmin, session]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/system-config');
      const result = await response.json();

      if (result.success && result.data) {
        setConfig(result.data);
        setFormData({
          defaultDetentionRate: result.data.defaultDetentionRate || 50,
          defaultFreeTimeMinutes: result.data.defaultFreeTimeMinutes || 120,
          standardTonuFee: result.data.standardTonuFee || 150,
          factoringActive: result.data.factoringActive || false,
          factoringCompanyName: result.data.factoringCompanyName || '',
          factoringCompanyAddress: result.data.factoringCompanyAddress || '',
          payDriverOnFuelSurcharge: result.data.payDriverOnFuelSurcharge || false,
          companyFuelTaxRate: result.data.companyFuelTaxRate || null,
        });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast.error('Failed to load system configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/system-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('System configuration saved successfully');
        setConfig(result.data);
      } else {
        toast.error(result.error?.message || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save system configuration');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin || !session) {
    return null;
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Accounting', href: '/dashboard/accounting' },
          { label: 'Settings' },
        ]}
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Accounting System Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure global variables used by DetentionManager and DriverSettlement services
          </p>
        </div>

        {/* Global Variables Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              <CardTitle>Global Variables</CardTitle>
            </div>
            <CardDescription>
              Configure default rates and fees used across the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Default Detention Rate */}
              <div className="space-y-2">
                <Label htmlFor="defaultDetentionRate">
                  Default Detention Rate ($/hour)
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    id="defaultDetentionRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.defaultDetentionRate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaultDetentionRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="50.00"
                  />
                  <span className="text-sm text-muted-foreground">/hour</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Default hourly rate for detention charges
                </p>
              </div>

              {/* Default Free Time */}
              <div className="space-y-2">
                <Label htmlFor="defaultFreeTimeMinutes">
                  Default Free Time (minutes)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="defaultFreeTimeMinutes"
                    type="number"
                    min="0"
                    value={formData.defaultFreeTimeMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaultFreeTimeMinutes: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="120"
                  />
                  <span className="text-sm text-muted-foreground">minutes</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Free time before detention charges apply (default: 120 = 2 hours)
                </p>
              </div>

              {/* Standard TONU Fee */}
              <div className="space-y-2">
                <Label htmlFor="standardTonuFee">
                  Standard TONU Fee ($)
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    id="standardTonuFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.standardTonuFee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        standardTonuFee: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="150.00"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Truck Ordered Not Used fee paid to driver when load is cancelled after dispatch
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Factoring Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <CardTitle>Factoring Configuration</CardTitle>
            </div>
            <CardDescription>
              Configure factoring company information for invoice assignment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Factoring Active</Label>
                <p className="text-sm text-muted-foreground">
                  Enable factoring for invoices (remit to factoring company)
                </p>
              </div>
              <Switch
                checked={formData.factoringActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, factoringActive: checked })
                }
              />
            </div>

            {formData.factoringActive && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="factoringCompanyName">
                    Factoring Company Name
                  </Label>
                  <Input
                    id="factoringCompanyName"
                    value={formData.factoringCompanyName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        factoringCompanyName: e.target.value,
                      })
                    }
                    placeholder="ABC Factoring Company"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="factoringCompanyAddress">
                    Factoring Company Address
                  </Label>
                  <Textarea
                    id="factoringCompanyAddress"
                    value={formData.factoringCompanyAddress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        factoringCompanyAddress: e.target.value,
                      })
                    }
                    placeholder="123 Main St&#10;City, State ZIP&#10;Phone: (555) 123-4567"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Full address including street, city, state, ZIP, and contact information
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settlement Defaults */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              <CardTitle>Settlement Defaults</CardTitle>
            </div>
            <CardDescription>
              Configure default settings for driver settlements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Pay Driver % on Fuel Surcharge</Label>
                <p className="text-sm text-muted-foreground">
                  Include fuel surcharge in driver percentage calculations
                </p>
              </div>
              <Switch
                checked={formData.payDriverOnFuelSurcharge}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, payDriverOnFuelSurcharge: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyFuelTaxRate">
                Company Fuel Tax Rate (%)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="companyFuelTaxRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.companyFuelTaxRate || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      companyFuelTaxRate: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  placeholder="8.5"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Default fuel tax rate for IFTA calculations
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

