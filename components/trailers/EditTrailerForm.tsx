'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
import { Save, X, Truck, Info, History, FileText } from 'lucide-react';
import { apiUrl, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import McNumberSelector from '@/components/mc-numbers/McNumberSelector';

interface EditTrailerFormProps {
    trailer: any;
    onSuccess?: () => void;
    onCancel?: () => void;
}

async function fetchTrucks() {
    const response = await fetch(apiUrl('/api/trucks?limit=1000'));
    if (!response.ok) throw new Error('Failed to fetch trucks');
    const result = await response.json();
    return result.data || [];
}

async function updateTrailer(trailerId: string, data: any) {
    const response = await fetch(apiUrl(`/api/trailers/${trailerId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update trailer');
    }
    return response.json();
}

export default function EditTrailerForm({ trailer, onSuccess, onCancel }: EditTrailerFormProps) {
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);

    const { data: trucks = [] } = useQuery({
        queryKey: ['trucks'],
        queryFn: fetchTrucks,
    });

    const { register, handleSubmit, setValue, watch } = useForm({
        defaultValues: {
            trailerNumber: trailer.trailerNumber || '',
            vin: trailer.vin || '',
            make: trailer.make || '',
            model: trailer.model || '',
            year: trailer.year || new Date().getFullYear(),
            licensePlate: trailer.licensePlate || '',
            state: trailer.state || '',
            type: trailer.type || '',
            status: trailer.status || 'AVAILABLE',
            fleetStatus: trailer.fleetStatus || 'ACTIVE',
            mcNumberId: trailer.mcNumberId || trailer.mcNumber?.id || '',
            assignedTruckId: trailer.assignedTruckId || trailer.assignedTruck?.id || '',
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => updateTrailer(trailer.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trailers'] });
            queryClient.invalidateQueries({ queryKey: ['trailer', trailer.id] });
            toast.success('Trailer updated successfully');
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update trailer');
            setIsSaving(false);
        },
    });

    const onSubmit = (data: any) => {
        setIsSaving(true);
        const updateData: any = {
            ...data,
            year: data.year ? parseInt(data.year) : null,
            assignedTruckId: data.assignedTruckId && data.assignedTruckId !== 'none' ? data.assignedTruckId : null,
        };
        updateMutation.mutate(updateData);
    };

    const statusColors: Record<string, string> = {
        AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
        IN_USE: 'bg-blue-100 text-blue-800 border-blue-200',
        MAINTENANCE: 'bg-orange-100 text-orange-800 border-orange-200',
        OUT_OF_SERVICE: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between no-print">
                <Badge variant="outline" className={statusColors[trailer.status] || 'bg-gray-100 text-gray-800'}>
                    {trailer.status?.replace(/_/g, ' ') || 'Unknown'}
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
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview">
                        <Info className="h-4 w-4 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        <History className="h-4 w-4 mr-2" />
                        Assignment History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 pt-4">
                    <form className="space-y-6">
                        <div className="grid gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Trailer Details</CardTitle>
                                    <CardDescription>Update basic trailer information</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="trailerNumber">Trailer Number</Label>
                                            <Input id="trailerNumber" {...register('trailerNumber')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="status">Status</Label>
                                            <Select
                                                value={watch('status') || 'none'}
                                                onValueChange={(value) => setValue('status', value === 'none' ? '' : value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    <SelectItem value="AVAILABLE">Available</SelectItem>
                                                    <SelectItem value="IN_USE">In Use</SelectItem>
                                                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                                                    <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
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
                                            <Label htmlFor="type">Equipment Type</Label>
                                            <Select
                                                value={watch('type')}
                                                onValueChange={(value) => setValue('type', value)}
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

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="fleetStatus">Fleet Status</Label>
                                            <Select
                                                value={watch('fleetStatus') || 'none'}
                                                onValueChange={(value) => setValue('fleetStatus', value === 'none' ? '' : value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                                                    <SelectItem value="SOLD">Sold</SelectItem>
                                                    <SelectItem value="RETIRED">Retired</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="assignedTruckId">Assigned Truck</Label>
                                            <Select
                                                value={watch('assignedTruckId') || 'none'}
                                                onValueChange={(value) => setValue('assignedTruckId', value === 'none' ? '' : value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select truck" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    {trucks.map((t: any) => (
                                                        <SelectItem key={t.id} value={t.id}>
                                                            {t.truckNumber}
                                                        </SelectItem>
                                                    ))}
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

                <TabsContent value="history" className="pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Assignment History</CardTitle>
                            <CardDescription>Recent truck and load assignments</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {trailer.loads && trailer.loads.length > 0 ? (
                                <div className="space-y-3">
                                    {trailer.loads.map((load: any) => (
                                        <div
                                            key={load.id}
                                            className="flex items-center justify-between p-3 border rounded-lg"
                                        >
                                            <div>
                                                <div className="font-medium text-primary">
                                                    {load.loadNumber}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {load.pickupCity}, {load.pickupState}
                                                </p>
                                            </div>
                                            <Badge variant="outline">{load.status}</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No history records found
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
