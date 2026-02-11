'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCustomerSchema, type UpdateCustomerInput } from '@/lib/validations/customer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, User, Package, Save, X, Phone, Mail, MapPin } from 'lucide-react';
import { CustomerType } from '@prisma/client';
import { toast } from 'sonner';
import { apiUrl, formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface EditCustomerFormProps {
    customer: any;
    onSuccess?: () => void;
    onCancel?: () => void;
}

async function updateCustomer(id: string, data: UpdateCustomerInput) {
    const response = await fetch(apiUrl(`/api/customers/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update customer');
    }
    return response.json();
}

export default function EditCustomerForm({
    customer,
    onSuccess,
    onCancel,
}: EditCustomerFormProps) {
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
        watch,
        reset,
    } = useForm<UpdateCustomerInput>({
        resolver: zodResolver(updateCustomerSchema) as any,
        defaultValues: {
            customerNumber: customer.customerNumber,
            name: customer.name,
            type: customer.type,
            address: customer.address,
            city: customer.city,
            state: customer.state,
            zip: customer.zip,
            phone: customer.phone,
            email: customer.email,
            billingAddress: customer.billingAddress || '',
            billingCity: customer.billingCity || '',
            billingState: customer.billingState || '',
            billingZip: customer.billingZip || '',
            billingEmail: customer.billingEmail || '',
            paymentTerms: customer.paymentTerms,
            creditLimit: customer.creditLimit || undefined,
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: UpdateCustomerInput) => updateCustomer(customer.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['customer', customer.id] });
            toast.success('Customer updated successfully');
            onSuccess?.();
        },
        onError: (err: Error) => {
            setError(err.message);
            toast.error(err.message);
        },
    });

    const onSubmit = async (data: UpdateCustomerInput) => {
        setError(null);
        // Remove empty billing fields
        if (!data.billingAddress) {
            delete data.billingAddress;
            delete data.billingCity;
            delete data.billingState;
            delete data.billingZip;
        }
        if (!data.billingEmail) {
            delete data.billingEmail;
        }
        updateMutation.mutate(data);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between no-print">
                <h2 className="text-xl font-semibold">{customer.name}</h2>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onCancel}
                        disabled={isSubmitting || updateMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleSubmit(onSubmit)}
                        disabled={isSubmitting || updateMutation.isPending}
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {isSubmitting || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="info">
                        <Building2 className="h-4 w-4 mr-2" />
                        Information
                    </TabsTrigger>
                    <TabsTrigger value="contacts">
                        <User className="h-4 w-4 mr-2" />
                        Contacts
                    </TabsTrigger>
                    <TabsTrigger value="activity">
                        <Package className="h-4 w-4 mr-2" />
                        Activity
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-6 pt-4">
                    <form className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="customerNumber">Customer Number *</Label>
                                        <Input
                                            id="customerNumber"
                                            {...register('customerNumber')}
                                            placeholder="CUST-001"
                                        />
                                        {errors.customerNumber && (
                                            <p className="text-sm text-destructive">{errors.customerNumber.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="name">Customer Name *</Label>
                                        <Input
                                            id="name"
                                            {...register('name')}
                                            placeholder="ABC Company"
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-destructive">{errors.name.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Customer Type *</Label>
                                        <Select
                                            value={watch('type')}
                                            onValueChange={(value) => setValue('type', value as CustomerType)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="DIRECT">Direct</SelectItem>
                                                <SelectItem value="BROKER">Broker</SelectItem>
                                                <SelectItem value="FACTORING">Factoring</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            {...register('email')}
                                            placeholder="contact@company.com"
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-destructive">{errors.email.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone *</Label>
                                    <Input
                                        id="phone"
                                        {...register('phone')}
                                        placeholder="(555) 123-4567"
                                    />
                                    {errors.phone && (
                                        <p className="text-sm text-destructive">{errors.phone.message}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Address Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="address">Address *</Label>
                                    <Input
                                        id="address"
                                        {...register('address')}
                                        placeholder="123 Main St"
                                    />
                                    {errors.address && (
                                        <p className="text-sm text-destructive">{errors.address.message}</p>
                                    )}
                                </div>

                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="city">City *</Label>
                                        <Input
                                            id="city"
                                            {...register('city')}
                                            placeholder="New York"
                                        />
                                        {errors.city && (
                                            <p className="text-sm text-destructive">{errors.city.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="state">State *</Label>
                                        <Input
                                            id="state"
                                            {...register('state')}
                                            placeholder="NY"
                                            maxLength={2}
                                        />
                                        {errors.state && (
                                            <p className="text-sm text-destructive">{errors.state.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="zip">ZIP Code *</Label>
                                        <Input
                                            id="zip"
                                            {...register('zip')}
                                            placeholder="10001"
                                        />
                                        {errors.zip && (
                                            <p className="text-sm text-destructive">{errors.zip.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t">
                                    <h3 className="font-medium">Billing Address (Optional)</h3>
                                    <div className="space-y-2">
                                        <Label htmlFor="billingAddress">Billing Address</Label>
                                        <Input
                                            id="billingAddress"
                                            {...register('billingAddress')}
                                            placeholder="Same as above or different address"
                                        />
                                    </div>

                                    {(watch('billingAddress') || customer.billingAddress) && (
                                        <>
                                            <div className="grid gap-4 md:grid-cols-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="billingCity">City</Label>
                                                    <Input
                                                        id="billingCity"
                                                        {...register('billingCity')}
                                                        placeholder="New York"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="billingState">State</Label>
                                                    <Input
                                                        id="billingState"
                                                        {...register('billingState')}
                                                        placeholder="NY"
                                                        maxLength={2}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="billingZip">ZIP Code</Label>
                                                    <Input
                                                        id="billingZip"
                                                        {...register('billingZip')}
                                                        placeholder="10001"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="billingEmail">Billing Email</Label>
                                                <Input
                                                    id="billingEmail"
                                                    type="email"
                                                    {...register('billingEmail')}
                                                    placeholder="billing@company.com"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Financial Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="paymentTerms">Payment Terms (days) *</Label>
                                        <Input
                                            id="paymentTerms"
                                            type="number"
                                            {...register('paymentTerms', { valueAsNumber: true })}
                                            placeholder="30"
                                        />
                                        {errors.paymentTerms && (
                                            <p className="text-sm text-destructive">{errors.paymentTerms.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="creditLimit">Credit Limit</Label>
                                        <Input
                                            id="creditLimit"
                                            type="number"
                                            step="0.01"
                                            {...register('creditLimit', { valueAsNumber: true })}
                                            placeholder="10000.00"
                                        />
                                        {errors.creditLimit && (
                                            <p className="text-sm text-destructive">{errors.creditLimit.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="taxRate">Tax Rate (%)</Label>
                                        <Input
                                            id="taxRate"
                                            type="number"
                                            step="0.01"
                                            {...register('taxRate', { valueAsNumber: true })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2 pt-8">
                                        <input
                                            type="checkbox"
                                            id="isTaxExempt"
                                            {...register('isTaxExempt')}
                                            className="rounded border-gray-300"
                                        />
                                        <Label htmlFor="isTaxExempt" className="cursor-pointer">
                                            Tax Exempt
                                        </Label>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </TabsContent>

                <TabsContent value="contacts" className="pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Contacts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {customer.contacts && customer.contacts.length > 0 ? (
                                <div className="space-y-3">
                                    {customer.contacts.map((contact: any) => (
                                        <div key={contact.id} className="p-3 border rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium">
                                                    {contact.name}
                                                    {contact.isPrimary && (
                                                        <Badge variant="outline" className="ml-2">
                                                            Primary
                                                        </Badge>
                                                    )}
                                                </p>
                                                <Badge variant="secondary">{contact.title || 'No Title'}</Badge>
                                            </div>
                                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-3.5 w-3.5" />
                                                    {contact.email}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-3.5 w-3.5" />
                                                    {contact.phone}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No contacts found for this customer
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activity" className="pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {customer.loads && customer.loads.length > 0 ? (
                                <div className="space-y-3">
                                    {customer.loads.map((load: any) => (
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
                                                <p className="text-xs text-muted-foreground">
                                                    Date: {formatDate(load.pickupDate)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">{formatCurrency(load.revenue)}</p>
                                                <Badge variant="outline" className="mt-1">
                                                    {load.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No recent loads for this customer
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div >
    );
}
