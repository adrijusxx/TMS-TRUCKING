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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Upload, Palette, Mail, FileText, Image as ImageIcon, Eye, Check } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

const companyBrandingSchema = z.object({
  // Branding
  logoUrl: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),

  // Email Branding
  emailFromName: z.string().min(1, 'Email from name is required'),
  emailFromAddress: z.string().email('Invalid email address'),
  emailSignature: z.string().optional(),

  // Invoice Branding
  invoiceHeader: z.string().optional(),
  invoiceFooter: z.string().optional(),
  invoiceTerms: z.string().optional(),
});

type CompanyBrandingSettings = z.infer<typeof companyBrandingSchema>;

async function fetchCompanySettings() {
  const response = await fetch(apiUrl('/api/settings/company'));
  if (!response.ok) throw new Error('Failed to fetch company settings');
  return response.json();
}

async function updateCompanySettings(data: Partial<CompanyBrandingSettings>) {
  const response = await fetch(apiUrl('/api/settings/company'), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update company settings');
  }
  return response.json();
}

async function uploadLogo(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'logo');

  const response = await fetch(apiUrl('/api/settings/company/logo'), {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to upload logo');
  }
  return response.json();
}

export default function CompanyBrandingSettings() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['company-settings'],
    queryFn: fetchCompanySettings,
  });

  const form = useForm<CompanyBrandingSettings>({
    resolver: zodResolver(companyBrandingSchema),
    values: settingsData?.data || {
      logoUrl: '',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      emailFromName: '',
      emailFromAddress: '',
      emailSignature: '',
      invoiceHeader: '',
      invoiceFooter: '',
      invoiceTerms: '',
    },
  });

  const { register, handleSubmit, formState: { errors, isDirty }, watch, setValue } = form;

  const updateMutation = useMutation({
    mutationFn: updateCompanySettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      toast.success('Company settings updated successfully');
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo file must be less than 5MB');
      return;
    }

    setLogoUploading(true);
    try {
      const result = await uploadLogo(file);
      setValue('logoUrl', result.data.url, { shouldDirty: true });
      toast.success('Logo uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload logo');
    } finally {
      setLogoUploading(false);
    }
  };

  const onSubmit = (data: CompanyBrandingSettings) => {
    setError(null);
    updateMutation.mutate(data);
  };

  const formValues = watch();

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT COLUMN: SETTINGS FORM */}
      <div className="lg:col-span-7 space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-4">
                <p className="text-sm text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Branding */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <CardTitle>Visual Identity</CardTitle>
              </div>
              <CardDescription>
                Customize your company's logo and color scheme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4">
                  {watch('logoUrl') ? (
                    <div className="relative group">
                      <img
                        src={watch('logoUrl')}
                        alt="Company logo"
                        className="h-20 w-20 object-contain border rounded-lg bg-white p-1"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setValue('logoUrl', '', { shouldDirty: true })}
                      >
                        <span className="sr-only">Remove</span>
                        &times;
                      </Button>
                    </div>
                  ) : (
                    <div className="h-20 w-20 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground bg-muted/50">
                      <ImageIcon className="h-8 w-8 opacity-50" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={logoUploading}
                      className="cursor-pointer file:cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended: PNG or SVG with transparent background (max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Input
                        id="primaryColor"
                        type="color"
                        {...register('primaryColor')}
                        className="h-10 w-12 p-1 cursor-pointer"
                      />
                    </div>
                    <Input
                      type="text"
                      {...register('primaryColor')}
                      placeholder="#3b82f6"
                      className="font-mono"
                    />
                  </div>
                  <div className="flex gap-1 mt-1">
                    {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1'].map(color => (
                      <button
                        key={color}
                        type="button"
                        className="w-6 h-6 rounded-full border shadow-sm ring-offset-background hover:ring-2 hover:ring-ring focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                        style={{ backgroundColor: color }}
                        onClick={() => setValue('primaryColor', color, { shouldDirty: true })}
                      />
                    ))}
                  </div>
                  {errors.primaryColor && (
                    <p className="text-sm text-destructive">{errors.primaryColor.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Input
                        id="secondaryColor"
                        type="color"
                        {...register('secondaryColor')}
                        className="h-10 w-12 p-1 cursor-pointer"
                      />
                    </div>
                    <Input
                      type="text"
                      {...register('secondaryColor')}
                      placeholder="#8b5cf6"
                      className="font-mono"
                    />
                  </div>
                  <div className="flex gap-1 mt-1">
                    {['#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#64748b'].map(color => (
                      <button
                        key={color}
                        type="button"
                        className="w-6 h-6 rounded-full border shadow-sm ring-offset-background hover:ring-2 hover:ring-ring focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                        style={{ backgroundColor: color }}
                        onClick={() => setValue('secondaryColor', color, { shouldDirty: true })}
                      />
                    ))}
                  </div>
                  {errors.secondaryColor && (
                    <p className="text-sm text-destructive">{errors.secondaryColor.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Branding */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <CardTitle>Email Settings</CardTitle>
              </div>
              <CardDescription>
                Configure how system emails appear to your recipients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="emailFromName">Sender Name *</Label>
                  <Input id="emailFromName" {...register('emailFromName')} placeholder="Acme Logistics" />
                  {errors.emailFromName && (
                    <p className="text-sm text-destructive">{errors.emailFromName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailFromAddress">Sender Email *</Label>
                  <Input id="emailFromAddress" type="email" {...register('emailFromAddress')} placeholder="dispatch@acme.com" />
                  {errors.emailFromAddress && (
                    <p className="text-sm text-destructive">{errors.emailFromAddress.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailSignature">Email Signature</Label>
                <Textarea
                  id="emailSignature"
                  rows={4}
                  placeholder="Review the load details attached..."
                  {...register('emailSignature')}
                />
                <p className="text-xs text-muted-foreground">
                  This signature will be appended to automated emails.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Branding */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle>Invoice Template</CardTitle>
              </div>
              <CardDescription>
                Customize your invoice documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceHeader">Header Text</Label>
                <Textarea
                  id="invoiceHeader"
                  rows={2}
                  placeholder="Thank you for your business"
                  {...register('invoiceHeader')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceTerms">Terms & Conditions</Label>
                <Textarea
                  id="invoiceTerms"
                  rows={3}
                  placeholder="Payment due within 30 days. Late fees apply..."
                  {...register('invoiceTerms')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceFooter">Footer Text</Label>
                <Textarea
                  id="invoiceFooter"
                  rows={2}
                  placeholder="Please include invoice number on checks"
                  {...register('invoiceFooter')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4 sticky bottom-6 z-10">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              hidden={!isDirty}
            >
              Reset Changes
            </Button>
            <Button
              type="submit"
              disabled={!isDirty || updateMutation.isPending}
              className="w-32"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>

      {/* RIGHT COLUMN: LIVE PREVIEW */}
      <div className="lg:col-span-5 space-y-6">
        <div className="sticky top-6">
          <div className="flex items-center gap-2 mb-4 text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium uppercase tracking-wider">Live Preview</span>
          </div>

          <Tabs defaultValue="invoice" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="invoice">Invoice</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>

            {/* INVOICE PREVIEW */}
            <TabsContent value="invoice">
              <Card className="overflow-hidden border-2 shadow-sm animate-in fade-in-50 zoom-in-95">
                <CardContent className="p-0 min-h-[500px] flex flex-col bg-white text-slate-900 text-sm">
                  {/* Mock Invoice Header */}
                  <div className="p-6 border-b" style={{ borderColor: formValues.primaryColor || '#e2e8f0' }}>
                    <div className="flex justify-between items-start">
                      <div>
                        {formValues.logoUrl ? (
                          <img src={formValues.logoUrl} alt="Logo" className="h-12 object-contain mb-3" />
                        ) : (
                          <div className="h-12 w-12 bg-slate-100 rounded flex items-center justify-center text-slate-400 mb-3">
                            <ImageIcon className="h-6 w-6" />
                          </div>
                        )}
                        <h3 className="font-bold text-lg text-slate-800">INVOICE</h3>
                        <p className="text-slate-500">#INV-2024-001</p>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        <p className="font-semibold text-slate-900">Your Company</p>
                        <p>123 Trucking Lane</p>
                        <p>Dallas, TX 75201</p>
                      </div>
                    </div>
                  </div>

                  {/* Header Text */}
                  {formValues.invoiceHeader && (
                    <div className="px-6 py-3 bg-slate-50 text-slate-600 text-xs italic border-b border-slate-100">
                      "{formValues.invoiceHeader}"
                    </div>
                  )}

                  {/* Mock Line Items */}
                  <div className="p-6 flex-1">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr style={{ color: formValues.secondaryColor || '#64748b' }}>
                          <th className="pb-2 font-semibold uppercase">Description</th>
                          <th className="pb-2 font-semibold uppercase text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-600">
                        <tr className="border-b border-slate-100">
                          <td className="py-2">Freight Charge - Load #1024</td>
                          <td className="py-2 text-right">$1,200.00</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2">Fuel Surcharge</td>
                          <td className="py-2 text-right">$150.00</td>
                        </tr>
                        <tr>
                          <td className="py-4 font-bold text-slate-800">Total</td>
                          <td className="py-4 font-bold text-slate-800 text-right" style={{ color: formValues.primaryColor }}>$1,350.00</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Terms */}
                    {formValues.invoiceTerms && (
                      <div className="mt-8 p-3 bg-slate-50 rounded border border-slate-100">
                        <p className="font-semibold text-xs text-slate-700 mb-1">Terms:</p>
                        <p className="text-xs text-slate-500">{formValues.invoiceTerms}</p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400">
                    <p>{formValues.invoiceFooter || 'Thank you for your business!'}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* EMAIL PREVIEW */}
            <TabsContent value="email">
              <Card className="overflow-hidden border-2 shadow-sm animate-in fade-in-50 zoom-in-95">
                <CardContent className="p-0 min-h-[500px] flex flex-col bg-white text-slate-900">
                  {/* Mock Email UI */}
                  <div className="bg-slate-50 border-b p-3 space-y-2 text-xs">
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-12 text-right">From:</span>
                      <span className="font-medium text-slate-700">
                        {formValues.emailFromName || 'Sender'} &lt;{formValues.emailFromAddress || 'sender@example.com'}&gt;
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-12 text-right">Subject:</span>
                      <span className="font-medium text-slate-700">Rate Confirmation - Load #1024</span>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="p-6 text-sm text-slate-700 font-sans leading-relaxed">
                    <p className="mb-4">Hello,</p>
                    <p className="mb-4">Please find the attached rate confirmation for Load #1024.</p>
                    <p className="mb-6">Let us know if you have any questions.</p>

                    {/* Signature */}
                    <div className="mt-8 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-3 mb-3">
                        {formValues.logoUrl && (
                          <img src={formValues.logoUrl} alt="Logo" className="h-8 w-auto" />
                        )}
                        <div className="h-full w-[1px] bg-slate-200" style={{ backgroundColor: formValues.primaryColor }} />
                        <div>
                          <p className="font-bold text-slate-800" style={{ color: formValues.primaryColor }}>
                            {formValues.emailFromName || 'Your Company'}
                          </p>
                          <p className="text-xs text-slate-500">Transportation & Logistics</p>
                        </div>
                      </div>

                      {formValues.emailSignature ? (
                        <div className="whitespace-pre-wrap text-slate-600">{formValues.emailSignature}</div>
                      ) : (
                        <p className="text-slate-400 italic text-xs">[Your email signature will appear here]</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Quick Tips */}
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-full text-primary shrink-0">
                  <Check className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Pro Tip</p>
                  <p className="text-xs text-muted-foreground">
                    Use a PNG logo with a transparent background for the best look on invoices and emails.
                    Your Primary Color sets the accent for headers and links.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}





