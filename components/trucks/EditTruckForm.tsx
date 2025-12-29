'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, X, Truck, Package, Wrench, FileText } from 'lucide-react';
import { apiUrl, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import McNumberSelector from '@/components/mc-numbers/McNumberSelector';
import { TruckStatus, EquipmentType } from '@prisma/client';

interface EditTruckFormProps {
    truck: any;
    onSuccess?: () => void;
    onCancel?: () => void;
}

async function updateTruck(truckId: string, data: any) {
    const response = await fetch(apiUrl(`/api/trucks/${truckId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update truck');
    }
    return response.json();
}

export default function EditTruckForm({ truck, onSuccess, onCancel }: EditTruckFormProps) {
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            truckNumber: truck.truckNumber || '',
            vin: truck.vin || '',
            make: truck.make || '',
            model: truck.model || '',
            year: truck.year || new Date().getFullYear(),
            licensePlate: truck.licensePlate || '',
            state: truck.state || '',
            equipmentType: truck.equipmentType || 'DRY_VAN',
            status: truck.status || 'AVAILABLE',
            mcNumberId: truck.mcNumberId || truck.mcNumber?.id || '',
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => updateTruck(truck.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trucks'] });
            queryClient.invalidateQueries({ queryKey: ['truck', truck.id] });
            toast.success('Truck updated successfully');
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update truck');
            setIsSaving(false);
        },
    });

    const onSubmit = (data: any) => {
        setIsSaving(true);
        const updateData: any = {
            ...data,
            year: parseInt(data.year),
        };
        updateMutation.mutate(updateData);
    };

    const statusColors: Record<TruckStatus, string> = {
        AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
        IN_USE: 'bg-blue-100 text-blue-800 border-blue-200',
        MAINTENANCE: 'bg-orange-100 text-orange-800 border-orange-200',
        MAINTENANCE_DUE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        OUT_OF_SERVICE: 'bg-red-100 text-red-800 border-red-200',
        INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
        NEEDS_REPAIR: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between no-print">
                <Badge variant="outline" className={statusColors[truck.status as TruckStatus]}>
                    {truck.status.replace(/_/g, ' ')}
                </Badge>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onCancel}
                        disabled={isSaving || updateMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleSubmit(onSubmit)}
                        disabled={isSaving || updateMutation.isPending}
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">
                        <Truck className="h-4 w-4 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="loads">
                        <Package className="h-4 w-4 mr-2" />
                        Active Loads
                    </TabsTrigger>
                    <TabsTrigger value="maintenance">
                        <Wrench className="h-4 w-4 mr-2" />
                        Maintenance
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 pt-4">
                    <form className="space-y-6">
                        <div className="grid gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Truck Details</CardTitle>
                                    <CardDescription>Update basic truck information</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="truckNumber">Truck Number</Label>
                                            <Input id="truckNumber" {...register('truckNumber')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="status">Status</Label>
                                            <Select
                                                value={watch('status')}
                                                onValueChange={(value) => setValue('status', value as TruckStatus)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="AVAILABLE">Available</SelectItem>
                                                    <SelectItem value="IN_USE">In Use</SelectItem>
                                                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                                                    <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
                                                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="vin">VIN</Label>
                                        <Input id="vin" {...register('vin')} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="make">Make</Label>
                                            <Input id="make" {...register('make')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="model">Model</Label>
                                            <Input id="model" {...register('model')} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="year">Year</Label>
                                            <Input id="year" type="number" {...register('year')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="licensePlate">License Plate</Label>
                                            <Input id="licensePlate" {...register('licensePlate')} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="state">State</Label>
                                            <Input id="state" maxLength={2} {...register('state')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="equipmentType">Equipment Type</Label>
                                            <Select
                                                value={watch('equipmentType')}
                                                onValueChange={(value) => setValue('equipmentType', value as EquipmentType)}
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
                                    </div>

                                    <McNumberSelector
                                        value={watch('mcNumberId') || ''}
                                        onValueChange={(value) => setValue('mcNumberId', value)}
                                        className="w-full"
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </form>
                </TabsContent>

                <TabsContent value="loads" className="pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Active Loads</CardTitle>
                            <CardDescription>Current and recent load assignments</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {truck.loads && truck.loads.length > 0 ? (
                                <div className="space-y-3">
                                    {truck.loads.map((load: any) => (
                                        <div
                                            key={load.id}
                                            className="flex items-center justify-between p-3 border rounded-lg"
                                        >
                                            <div>
                                                <div className="font-medium text-primary">
                                                    {load.loadNumber}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {load.pickupCity}, {load.pickupState} → {load.deliveryCity},{' '}
                                                    {load.deliveryState}
                                                </p>
                                            </div>
                                            <Badge variant="outline">{load.status}</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No active loads for this truck
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="maintenance" className="pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Maintenance History</CardTitle>
                            <CardDescription>Recent service and repair records</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {truck.maintenanceRecords && truck.maintenanceRecords.length > 0 ? (
                                <div className="space-y-4">
                                    {truck.maintenanceRecords.map((record: any) => (
                                        <div
                                            key={record.id}
                                            className="flex items-center justify-between p-3 border rounded-lg"
                                        >
                                            <div>
                                                <p className="font-medium">{record.type?.replace(/_/g, ' ')}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {record.description}
                                                </p>
                                                <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                                                    <span>Date: {record.date ? formatDate(record.date) : 'N/A'}</span>
                                                    <span>Mileage: {record.mileage?.toLocaleString()} mi</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-green-600">${record.cost?.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No maintenance records found
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
