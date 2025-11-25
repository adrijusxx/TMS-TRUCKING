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
import { Building2, Upload, Palette, Mail, FileText, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

const companyBrandingSchema = z.object({
  // Company Information
  name: z.string().min(1, 'Company name is required'),
  dotNumber: z.string().min(1, 'DOT number is required'),
  mcNumber: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  zip: z.string().min(5, 'ZIP code is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email address'),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  
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

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<CompanyBrandingSettings>({
    resolver: zodResolver(companyBrandingSchema),
    values: settingsData?.data || {
      name: '',
      dotNumber: '',
      mcNumber: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      phone: '',
      email: '',
      website: '',
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

      {/* Company Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>Company Information</CardTitle>
          </div>
          <CardDescription>
            Basic company details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input id="name" {...register('name')} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dotNumber">DOT Number *</Label>
              <Input id="dotNumber" {...register('dotNumber')} />
              {errors.dotNumber && (
                <p className="text-sm text-destructive">{errors.dotNumber.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mcNumber">MC Number</Label>
              <Input id="mcNumber" {...register('mcNumber')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" type="tel" {...register('phone')} />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" type="url" placeholder="https://example.com" {...register('website')} />
            {errors.website && (
              <p className="text-sm text-destructive">{errors.website.message}</p>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input id="address" {...register('address')} />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input id="city" {...register('city')} />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input id="state" maxLength={2} {...register('state')} />
              {errors.state && (
                <p className="text-sm text-destructive">{errors.state.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code *</Label>
              <Input id="zip" {...register('zip')} />
              {errors.zip && (
                <p className="text-sm text-destructive">{errors.zip.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <CardTitle>Branding</CardTitle>
          </div>
          <CardDescription>
            Customize your company's visual identity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Company Logo</Label>
            <div className="flex items-center gap-4">
              {watch('logoUrl') && (
                <img
                  src={watch('logoUrl')}
                  alt="Company logo"
                  className="h-20 w-20 object-contain border rounded"
                />
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={logoUploading}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Upload PNG, JPG, or SVG (max 5MB)
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
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
          </div>
        </CardContent>
      </Card>

      {/* Email Branding */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Email Branding</CardTitle>
          </div>
          <CardDescription>
            Customize email appearance and sender information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emailFromName">From Name *</Label>
              <Input id="emailFromName" {...register('emailFromName')} />
              {errors.emailFromName && (
                <p className="text-sm text-destructive">{errors.emailFromName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailFromAddress">From Email *</Label>
              <Input id="emailFromAddress" type="email" {...register('emailFromAddress')} />
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
              placeholder="Best regards,&#10;Your Company Name"
              {...register('emailSignature')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoice Branding */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>Invoice Branding</CardTitle>
          </div>
          <CardDescription>
            Customize invoice appearance and content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invoiceHeader">Invoice Header</Label>
            <Textarea
              id="invoiceHeader"
              rows={3}
              placeholder="Custom header text or HTML"
              {...register('invoiceHeader')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceFooter">Invoice Footer</Label>
            <Textarea
              id="invoiceFooter"
              rows={3}
              placeholder="Custom footer text or HTML"
              {...register('invoiceFooter')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceTerms">Payment Terms</Label>
            <Textarea
              id="invoiceTerms"
              rows={3}
              placeholder="Net 30, Due upon receipt, etc."
              {...register('invoiceTerms')}
            />
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





