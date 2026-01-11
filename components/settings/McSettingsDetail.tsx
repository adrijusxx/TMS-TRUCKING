'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Save, Building2, Palette, Mail, FileText, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

// Schema for MC Settings
const mcSettingsSchema = z.object({
    // Contact Info
    email: z.string().email().optional().or(z.literal('')),
    website: z.string().url().optional().or(z.literal('')),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),

    // Branding
    logoUrl: z.string().optional(),
    primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional().or(z.literal('')),
    secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional().or(z.literal('')),
    hideCompanyName: z.boolean().default(false).optional(),
    hideFooter: z.boolean().default(false).optional(),

    // Invoice Branding
    invoiceHeader: z.string().optional(),
    invoiceFooter: z.string().optional(),
    invoiceTerms: z.string().optional(),
});

type McSettingsFormData = z.infer<typeof mcSettingsSchema>;

interface McSettingsDetailProps {
    mc: any;
}

export default function McSettingsDetail({ mc }: McSettingsDetailProps) {
    const queryClient = useQueryClient();
    const [logoUploading, setLogoUploading] = useState(false);

    // Parse existing branding JSON
    const existingBranding = mc.branding ? (typeof mc.branding === 'string' ? JSON.parse(mc.branding) : mc.branding) : {};

    const defaultValues: McSettingsFormData = {
        email: mc.email || '',
        website: mc.website || '',
        address: mc.address || '',
        city: mc.city || '',
        state: mc.state || '',
        zip: mc.zip || '',
        logoUrl: mc.logoUrl || '',
        primaryColor: existingBranding.primaryColor || '#3b82f6',
        secondaryColor: existingBranding.secondaryColor || '#8b5cf6',
        hideCompanyName: existingBranding.hideCompanyName || false,
        hideFooter: existingBranding.hideFooter || false,
        invoiceHeader: existingBranding.invoiceHeader || '',
        invoiceFooter: existingBranding.invoiceFooter || '',
        invoiceTerms: existingBranding.invoiceTerms || '',
    };

    const { register, handleSubmit, formState: { errors, isDirty }, setValue, watch, reset } = useForm<McSettingsFormData>({
        resolver: zodResolver(mcSettingsSchema),
        defaultValues,
    });

    // Reset form when MC changes to ensure data freshness
    useEffect(() => {
        const branding = mc.branding ? (typeof mc.branding === 'string' ? JSON.parse(mc.branding) : mc.branding) : {};

        reset({
            email: mc.email || '',
            website: mc.website || '',
            address: mc.address || '',
            city: mc.city || '',
            state: mc.state || '',
            zip: mc.zip || '',
            logoUrl: mc.logoUrl || '',
            primaryColor: branding.primaryColor || '#3b82f6',
            secondaryColor: branding.secondaryColor || '#8b5cf6',
            hideCompanyName: branding.hideCompanyName || false,
            hideFooter: branding.hideFooter || false,
            invoiceHeader: branding.invoiceHeader || '',
            invoiceFooter: branding.invoiceFooter || '',
            invoiceTerms: branding.invoiceTerms || '',
        });
    }, [mc, reset]);

    const updateMcMutation = useMutation({
        mutationFn: async (data: McSettingsFormData) => {
            const branding = {
                primaryColor: data.primaryColor,
                secondaryColor: data.secondaryColor,
                hideCompanyName: data.hideCompanyName,
                hideFooter: data.hideFooter,
                invoiceHeader: data.invoiceHeader,
                invoiceFooter: data.invoiceFooter,
                invoiceTerms: data.invoiceTerms,
            };

            const payload = {
                email: data.email,
                website: data.website,
                address: data.address,
                city: data.city,
                state: data.state,
                zip: data.zip,
                branding,
            };

            const response = await fetch(apiUrl(`/api/settings/company/mc/${mc.id}`), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to update MC settings');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company-settings'] });
            toast.success('MC settings updated successfully');
        },
        onError: (err: Error) => {
            toast.error(err.message);
        },
    });

    const uploadLogo = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(apiUrl(`/api/settings/company/mc/${mc.id}/logo`), { method: 'POST', body: formData });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to upload logo');
        }
        return response.json();
    };

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
            toast.success('MC Logo uploaded successfully');
        } catch (err: any) {
            toast.error(err.message || 'Failed to upload logo');
        } finally {
            setLogoUploading(false);
        }
    };

    const onSubmit = (data: McSettingsFormData) => {
        updateMcMutation.mutate(data);
    };

    const currentLogo = watch('logoUrl');

    return (
        <Card className="border-t-0 rounded-tl-none rounded-tr-none">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{mc.number} Settings</CardTitle>
                        <CardDescription>
                            {mc.name || 'Manage branding and contact details for this MC number.'}
                        </CardDescription>
                    </div>
                    {mc.isDefault && (
                        <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                            Default MC
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    {/* Logo Section */}
                    <div className="flex items-start gap-6 p-4 border rounded-lg bg-muted/20">
                        <div className="shrink-0">
                            {currentLogo ? (
                                <div className="relative group">
                                    <img
                                        src={currentLogo}
                                        alt="MC logo"
                                        className="h-24 w-24 object-contain border rounded-lg bg-white p-1"
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
                                <div className="h-24 w-24 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground bg-muted/50">
                                    <ImageIcon className="h-8 w-8 opacity-50" />
                                </div>
                            )}
                        </div>
                        <div className="space-y-2 flex-1">
                            <Label>MC Logo</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                disabled={logoUploading}
                                className="cursor-pointer"
                            />
                            <p className="text-xs text-muted-foreground">
                                This logo will appear on Invoices and Settlements generated under MC {mc.number}.
                            </p>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Contact Info */}
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Building2 className="h-4 w-4" /> Contact Information
                            </h3>

                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input {...register('email')} placeholder="billing@mc-example.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Website</Label>
                                    <Input {...register('website')} placeholder="https://..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Address</Label>
                                    <Input {...register('address')} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>City</Label>
                                        <Input {...register('city')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>State</Label>
                                        <Input {...register('state')} maxLength={2} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Zip</Label>
                                    <Input {...register('zip')} />
                                </div>
                            </div>
                        </div>

                        {/* Branding & Terms */}
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Palette className="h-4 w-4" /> Branding & Terms
                            </h3>

                            <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
                                <Input
                                    type="checkbox"
                                    id="hideCompanyName"
                                    className="h-4 w-4"
                                    {...register('hideCompanyName')}
                                />
                                <div className="space-y-0.5">
                                    <Label htmlFor="hideCompanyName" className="cursor-pointer">Hide Company Name</Label>
                                    <p className="text-xs text-muted-foreground">Only show the logo on documents</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
                                <Input
                                    type="checkbox"
                                    id="hideFooter"
                                    className="h-4 w-4"
                                    {...register('hideFooter')}
                                />
                                <div className="space-y-0.5">
                                    <Label htmlFor="hideFooter" className="cursor-pointer">Hide Document Footer</Label>
                                    <p className="text-xs text-muted-foreground">Removes "Generated by..." text</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Primary Color</Label>
                                    <div className="flex gap-2">
                                        <Input type="color" className="w-12 p-1" {...register('primaryColor')} />
                                        <Input {...register('primaryColor')} placeholder="#000000" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Secondary Color</Label>
                                    <div className="flex gap-2">
                                        <Input type="color" className="w-12 p-1" {...register('secondaryColor')} />
                                        <Input {...register('secondaryColor')} placeholder="#000000" />
                                    </div>
                                </div>
                            </div>

                            <Separator className="my-2" />

                            <div className="space-y-2">
                                <Label>Invoice Terms</Label>
                                <Textarea {...register('invoiceTerms')} placeholder="Due on receipt..." rows={3} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 border-t -mx-6 -mb-6">
                        <Button type="submit" disabled={!isDirty || updateMcMutation.isPending}>
                            {updateMcMutation.isPending ? 'Saving...' : 'Save MC Settings'}
                            <Save className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
