'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import { Loader2, CalendarIcon, TruckIcon, WrenchIcon, DollarSignIcon, MessageSquareIcon, BuildingIcon } from 'lucide-react';

interface MaintenanceFormProps {
    id?: string;
    initialData?: any;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function MaintenanceForm({ id, initialData, onSuccess, onCancel }: MaintenanceFormProps) {
    const router = useRouter();
    const isEditing = !!id;

    const [formData, setFormData] = useState({
        truckId: initialData?.truckId || '',
        type: initialData?.type || '',
        description: initialData?.description || '',
        cost: initialData?.cost || 0,
        odometer: initialData?.odometer || 0,
        date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        nextServiceDate: initialData?.nextServiceDate ? new Date(initialData.nextServiceDate).toISOString().split('T')[0] : '',
        vendorId: initialData?.vendorId || '',
        invoiceNumber: initialData?.invoiceNumber || '',
        notes: initialData?.notes || '',
    });

    // Fetch Trucks
    const { data: trucksData, isLoading: isLoadingTrucks } = useQuery({
        queryKey: ['trucks'],
        queryFn: async () => {
            const response = await fetch(apiUrl('/api/trucks?limit=500'));
            if (!response.ok) throw new Error('Failed to fetch trucks');
            return response.json();
        },
    });

    // Fetch Vendors
    const { data: vendorsData, isLoading: isLoadingVendors } = useQuery({
        queryKey: ['vendors'],
        queryFn: async () => {
            const response = await fetch(apiUrl('/api/vendors'));
            if (!response.ok) throw new Error('Failed to fetch vendors');
            return response.json();
        },
    });

    const trucks = trucksData?.data || [];
    const vendors = vendorsData?.data?.vendors || [];

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const url = isEditing ? apiUrl(`/api/maintenance/${id}`) : apiUrl('/api/maintenance');
            const method = isEditing ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to save maintenance record');
            }

            return response.json();
        },
        onSuccess: () => {
            toast.success(isEditing ? 'Maintenance record updated' : 'Maintenance record created');
            if (onSuccess) {
                onSuccess();
            } else {
                router.push('/dashboard/maintenance');
                router.refresh();
            }
        },
        onError: (error: any) => {
            toast.error(error.message);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.truckId) return toast.error('Please select a truck');
        if (!formData.type) return toast.error('Please select a maintenance type');
        if (!formData.description) return toast.error('Please provide a description');

        // Convert string dates back to ISO strings for API
        const submissionData = {
            ...formData,
            date: formData.date ? new Date(formData.date).toISOString() : null,
            nextServiceDate: formData.nextServiceDate ? new Date(formData.nextServiceDate).toISOString() : null,
            cost: Number(formData.cost),
            odometer: Number(formData.odometer),
        };

        mutation.mutate(submissionData);
    };

    const handleChange = (name: string, value: any) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    if (isLoadingTrucks || isLoadingVendors) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <Card className="max-w-4xl mx-auto shadow-lg border-primary/10">
            <CardHeader className="bg-primary/5 border-b pb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <WrenchIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-xl">{isEditing ? 'Edit Maintenance Record' : 'Record New Maintenance'}</CardTitle>
                        <CardDescription>
                            {isEditing ? `Updating record for truck #${initialData?.truck?.truckNumber}` : 'Enter the details of the service performed'}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Truck Information */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-primary/80 mb-2">
                                <TruckIcon className="h-4 w-4" />
                                Vehicle Detail
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="truckId">Truck <span className="text-destructive">*</span></Label>
                                <Select
                                    disabled={isEditing}
                                    value={formData.truckId}
                                    onValueChange={(value) => handleChange('truckId', value)}
                                >
                                    <SelectTrigger id="truckId" className="bg-muted/30">
                                        <SelectValue placeholder="Select a truck" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {trucks.map((truck: any) => (
                                            <SelectItem key={truck.id} value={truck.id}>
                                                #{truck.truckNumber} - {truck.make} {truck.model}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="odometer">Odometer Reading (mi) <span className="text-destructive">*</span></Label>
                                <Input
                                    id="odometer"
                                    type="number"
                                    placeholder="e.g. 125430"
                                    value={formData.odometer}
                                    onChange={(e) => handleChange('odometer', e.target.value)}
                                    className="bg-muted/30"
                                />
                            </div>
                        </div>

                        {/* Service Information */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-primary/80 mb-2">
                                <WrenchIcon className="h-4 w-4" />
                                Service Details
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">Service Type <span className="text-destructive">*</span></Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => handleChange('type', value)}
                                >
                                    <SelectTrigger id="type" className="bg-muted/30">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PM_A">PM Service A</SelectItem>
                                        <SelectItem value="PM_B">PM Service B</SelectItem>
                                        <SelectItem value="TIRES">Tires / Alignment</SelectItem>
                                        <SelectItem value="REPAIR">General Repair</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cost">Total Cost ($) <span className="text-destructive">*</span></Label>
                                <div className="relative">
                                    <DollarSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="cost"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.cost}
                                        onChange={(e) => handleChange('cost', e.target.value)}
                                        className="pl-9 bg-muted/30"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-primary/80 mb-2">
                                <CalendarIcon className="h-4 w-4" />
                                Scheduling
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date">Service Date <span className="text-destructive">*</span></Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => handleChange('date', e.target.value)}
                                    className="bg-muted/30"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nextServiceDate">Next Service Due (Optional)</Label>
                                <Input
                                    id="nextServiceDate"
                                    type="date"
                                    value={formData.nextServiceDate}
                                    onChange={(e) => handleChange('nextServiceDate', e.target.value)}
                                    className="bg-muted/30"
                                />
                            </div>
                        </div>

                        {/* Vendor Information */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-primary/80 mb-2">
                                <BuildingIcon className="h-4 w-4" />
                                Vendor & Billing
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="vendorId">Service Provider</Label>
                                <Select
                                    value={formData.vendorId}
                                    onValueChange={(value) => handleChange('vendorId', value)}
                                >
                                    <SelectTrigger id="vendorId" className="bg-muted/30">
                                        <SelectValue placeholder="Select vendor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vendors.map((vendor: any) => (
                                            <SelectItem key={vendor.id} value={vendor.id}>
                                                {vendor.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                                <Input
                                    id="invoiceNumber"
                                    placeholder="Vendor Ref #"
                                    value={formData.invoiceNumber}
                                    onChange={(e) => handleChange('invoiceNumber', e.target.value)}
                                    className="bg-muted/30"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary/80 mb-2">
                            <MessageSquareIcon className="h-4 w-4" />
                            Description & Notes
                        </div>
                        <Label htmlFor="description">Short Description <span className="text-destructive">*</span></Label>
                        <Input
                            id="description"
                            placeholder="e.g. Annual safety inspection and oil change"
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            className="bg-muted/30"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Details about specific parts replaced or findings..."
                            className="min-h-[100px] bg-muted/30"
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-6 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onCancel ? onCancel() : router.back()}
                            disabled={mutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={mutation.isPending}
                            className="min-w-[120px]"
                        >
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                isEditing ? 'Save Changes' : 'Create Record'
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
