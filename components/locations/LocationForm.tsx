'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const locationSchema = z.object({
    locationNumber: z.string().min(1, 'Location number is required'),
    name: z.string().min(1, 'Name is required'),
    type: z.enum([
        'PICKUP',
        'DELIVERY',
        'TERMINAL',
        'WAREHOUSE',
        'CUSTOMER',
        'VENDOR',
        'REPAIR_SHOP',
        'FUEL_STOP',
        'REST_AREA',
        'SCALE',
    ]),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zip: z.string().min(1, 'Zip is required'),
    country: z.string().default('USA'),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    contactName: z.string().optional(),
    contactPhone: z.string().optional(),
    contactEmail: z.string().email().optional().or(z.literal('')),
    notes: z.string().optional(),
    specialInstructions: z.string().optional(),
});

type LocationFormValues = z.infer<typeof locationSchema>;

const LOCATION_TYPES = [
    { value: 'PICKUP', label: 'Pickup' },
    { value: 'DELIVERY', label: 'Delivery' },
    { value: 'TERMINAL', label: 'Terminal' },
    { value: 'WAREHOUSE', label: 'Warehouse' },
    { value: 'CUSTOMER', label: 'Customer' },
    { value: 'VENDOR', label: 'Vendor' },
    { value: 'REPAIR_SHOP', label: 'Repair Shop' },
    { value: 'FUEL_STOP', label: 'Fuel Stop' },
    { value: 'REST_AREA', label: 'Rest Area' },
    { value: 'SCALE', label: 'Scale' },
];

export default function LocationForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<LocationFormValues>({
        resolver: zodResolver(locationSchema) as any,
        defaultValues: {
            type: 'PICKUP',
            country: 'USA',
            locationNumber: '',
            name: '',
            address: '',
            city: '',
            state: '',
            zip: '',
            contactName: '',
            contactPhone: '',
            contactEmail: '',
            notes: '',
            specialInstructions: '',
        },
    });

    const onSubmit = async (data: LocationFormValues) => {
        setIsSubmitting(true);
        try {
            const response = await fetch(apiUrl('/api/locations'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to create location');
            }

            toast.success('Location created successfully');
            router.push('/dashboard/locations');
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create location');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Basic Information */}
                <Card className="md:col-span-2">
                    <CardContent className="pt-6">
                        <h3 className="mb-4 text-lg font-medium">Basic Information</h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="locationNumber">Location Number *</Label>
                                <Input
                                    id="locationNumber"
                                    {...form.register('locationNumber')}
                                    placeholder="e.g. LOC-001"
                                />
                                {form.formState.errors.locationNumber && (
                                    <p className="text-sm text-red-500">{form.formState.errors.locationNumber.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    {...form.register('name')}
                                    placeholder="Location Name"
                                />
                                {form.formState.errors.name && (
                                    <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">Type *</Label>
                                <Select
                                    onValueChange={(value) => form.setValue('type', value as any)}
                                    defaultValue={form.getValues('type')}
                                >
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {LOCATION_TYPES.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.formState.errors.type && (
                                    <p className="text-sm text-red-500">{form.formState.errors.type.message}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Address */}
                <Card className="md:col-span-2">
                    <CardContent className="pt-6">
                        <h3 className="mb-4 text-lg font-medium">Address</h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="address">Street Address *</Label>
                                <Input
                                    id="address"
                                    {...form.register('address')}
                                    placeholder="123 Main St"
                                />
                                {form.formState.errors.address && (
                                    <p className="text-sm text-red-500">{form.formState.errors.address.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="city">City *</Label>
                                <Input
                                    id="city"
                                    {...form.register('city')}
                                    placeholder="City"
                                />
                                {form.formState.errors.city && (
                                    <p className="text-sm text-red-500">{form.formState.errors.city.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="state">State *</Label>
                                <Input
                                    id="state"
                                    {...form.register('state')}
                                    placeholder="State"
                                />
                                {form.formState.errors.state && (
                                    <p className="text-sm text-red-500">{form.formState.errors.state.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="zip">ZIP Code *</Label>
                                <Input
                                    id="zip"
                                    {...form.register('zip')}
                                    placeholder="ZIP"
                                />
                                {form.formState.errors.zip && (
                                    <p className="text-sm text-red-500">{form.formState.errors.zip.message}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                    <CardContent className="pt-6">
                        <h3 className="mb-4 text-lg font-medium">Contact Information</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="contactName">Contact Name</Label>
                                <Input
                                    id="contactName"
                                    {...form.register('contactName')}
                                    placeholder="Contact Name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contactPhone">Phone</Label>
                                <Input
                                    id="contactPhone"
                                    {...form.register('contactPhone')}
                                    placeholder="Phone"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contactEmail">Email</Label>
                                <Input
                                    id="contactEmail"
                                    type="email"
                                    {...form.register('contactEmail')}
                                    placeholder="Email"
                                />
                                {form.formState.errors.contactEmail && (
                                    <p className="text-sm text-red-500">{form.formState.errors.contactEmail.message}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notes & Instructions */}
                <Card>
                    <CardContent className="pt-6">
                        <h3 className="mb-4 text-lg font-medium">Additional Information</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    {...form.register('notes')}
                                    placeholder="Internal notes..."
                                    className="min-h-[100px]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="specialInstructions">Special Instructions</Label>
                                <Textarea
                                    id="specialInstructions"
                                    {...form.register('specialInstructions')}
                                    placeholder="Driver instructions..."
                                    className="min-h-[100px]"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard/locations')}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Location
                </Button>
            </div>
        </form>
    );
}
