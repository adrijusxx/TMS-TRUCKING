'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import { Loader2, Save, Building2, FileText, Palette } from 'lucide-react';

interface McNumber {
  id: string;
  number: string;
  companyName: string;
  companyPhone: string | null;
  isDefault: boolean;
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  email: string | null;
  website: string | null;
  branding: Record<string, unknown> | null;
}

interface BrandingForm {
  companyName: string;
  companyPhone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  website: string;
  logoUrl: string;
  hideCompanyName: boolean;
  invoiceTerms: string;
  invoiceFooter: string;
}

const emptyForm: BrandingForm = {
  companyName: '',
  companyPhone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  website: '',
  logoUrl: '',
  hideCompanyName: false,
  invoiceTerms: '',
  invoiceFooter: '',
};

function parseBranding(branding: Record<string, unknown> | string | null): Record<string, unknown> {
  if (!branding) return {};
  if (typeof branding === 'string') {
    try { return JSON.parse(branding); } catch { return {}; }
  }
  return branding;
}

function mcToForm(mc: McNumber): BrandingForm {
  const branding = parseBranding(mc.branding);
  return {
    companyName: mc.companyName || '',
    companyPhone: mc.companyPhone || '',
    email: mc.email || '',
    address: mc.address || '',
    city: mc.city || '',
    state: mc.state || '',
    zip: mc.zip || '',
    website: mc.website || '',
    logoUrl: mc.logoUrl || '',
    hideCompanyName: !!branding.hideCompanyName,
    invoiceTerms: (branding.invoiceTerms as string) || '',
    invoiceFooter: (branding.invoiceFooter as string) || '',
  };
}

export function McInvoiceBranding() {
  const queryClient = useQueryClient();
  const [selectedMcId, setSelectedMcId] = useState<string>('');
  const [form, setForm] = useState<BrandingForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['mc-numbers-branding'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/mc-numbers?limit=1000'));
      if (!res.ok) throw new Error('Failed to fetch MC numbers');
      return res.json();
    },
  });

  const mcNumbers: McNumber[] = data?.data || [];

  // When MC selection changes, load its branding data into the form
  useEffect(() => {
    if (!selectedMcId) {
      setForm(emptyForm);
      setDirty(false);
      return;
    }
    const mc = mcNumbers.find((m) => m.id === selectedMcId);
    if (mc) {
      setForm(mcToForm(mc));
      setDirty(false);
    }
  }, [selectedMcId, mcNumbers]);

  // Auto-select the first MC if none selected
  useEffect(() => {
    if (!selectedMcId && mcNumbers.length > 0) {
      const defaultMc = mcNumbers.find((m) => m.isDefault) || mcNumbers[0];
      setSelectedMcId(defaultMc.id);
    }
  }, [mcNumbers, selectedMcId]);

  const updateField = <K extends keyof BrandingForm>(key: K, value: BrandingForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!selectedMcId) return;
    setSaving(true);
    try {
      const branding = {
        hideCompanyName: form.hideCompanyName,
        invoiceTerms: form.invoiceTerms || undefined,
        invoiceFooter: form.invoiceFooter || undefined,
      };

      const res = await fetch(apiUrl(`/api/settings/company/mc/${selectedMcId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: form.companyName,
          companyPhone: form.companyPhone || undefined,
          logoUrl: form.logoUrl || undefined,
          email: form.email || undefined,
          address: form.address || undefined,
          city: form.city || undefined,
          state: form.state || undefined,
          zip: form.zip || undefined,
          website: form.website || undefined,
          branding,
        }),
      });

      const result = await res.json();
      if (!result.success) {
        toast.error(result.error?.message || 'Failed to save branding settings');
        return;
      }

      toast.success('Invoice branding saved');
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ['mc-numbers-branding'] });
    } catch {
      toast.error('Failed to save branding settings');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (mcNumbers.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold">No MC Numbers</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create an MC number first in Settings &gt; MC Numbers to configure invoice branding.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* MC Number Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <CardTitle>Invoice Branding per MC Number</CardTitle>
          </div>
          <CardDescription>
            Customize how your company appears on invoices, rate confirmations, and other documents for each MC number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label>Select MC Number</Label>
            <Select value={selectedMcId} onValueChange={setSelectedMcId}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Select MC number" />
              </SelectTrigger>
              <SelectContent>
                {mcNumbers.map((mc) => (
                  <SelectItem key={mc.id} value={mc.id}>
                    {mc.companyName} — {mc.number}
                    {mc.isDefault ? ' (Default)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedMcId && (
        <>
          {/* Company Identity */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <CardTitle className="text-base">Company Identity</CardTitle>
              </div>
              <CardDescription>
                Name and contact info shown on invoices for this MC
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Company Name</Label>
                  <Input
                    value={form.companyName}
                    onChange={(e) => updateField('companyName', e.target.value)}
                    placeholder="Company name on invoices"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input
                    value={form.companyPhone}
                    onChange={(e) => updateField('companyPhone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="billing@company.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Website</Label>
                  <Input
                    value={form.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    placeholder="www.company.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Street Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="123 Main St"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>State</Label>
                  <Input
                    value={form.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    placeholder="ST"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>ZIP Code</Label>
                  <Input
                    value={form.zip}
                    onChange={(e) => updateField('zip', e.target.value)}
                    placeholder="12345"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Logo URL</Label>
                <Input
                  value={form.logoUrl}
                  onChange={(e) => updateField('logoUrl', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-muted-foreground">
                  Direct URL to your company logo image (PNG or JPG recommended)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Options */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle className="text-base">Invoice Options</CardTitle>
              </div>
              <CardDescription>
                Customize invoice content and appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Hide Company Name</Label>
                  <p className="text-sm text-muted-foreground">
                    Hide the company name on invoices (useful when logo is enough)
                  </p>
                </div>
                <Switch
                  checked={form.hideCompanyName}
                  onCheckedChange={(checked) => updateField('hideCompanyName', checked)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Payment Terms</Label>
                <Textarea
                  value={form.invoiceTerms}
                  onChange={(e) => updateField('invoiceTerms', e.target.value)}
                  placeholder="Net 30 days. Late payments subject to 1.5% monthly interest."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Payment terms displayed at the bottom of invoices
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Invoice Footer</Label>
                <Textarea
                  value={form.invoiceFooter}
                  onChange={(e) => updateField('invoiceFooter', e.target.value)}
                  placeholder="Thank you for your business!"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Custom footer text shown at the bottom of every invoice
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving || !dirty} size="lg">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Branding
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
