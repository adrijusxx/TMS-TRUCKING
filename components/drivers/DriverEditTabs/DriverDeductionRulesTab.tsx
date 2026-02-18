'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash2, Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { cn, formatCurrency, apiUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface DriverDeductionRulesTabProps {
    driver: any;
}

const BUILT_IN_DEDUCTIONS: Record<string, string> = {
    FUEL_ADVANCE: 'Fuel Advance', CASH_ADVANCE: 'Cash Advance', INSURANCE: 'Insurance',
    OCCUPATIONAL_ACCIDENT: 'Occupational Accident', TRUCK_PAYMENT: 'Truck Payment',
    TRUCK_LEASE: 'Truck Lease', ESCROW: 'Escrow', EQUIPMENT_RENTAL: 'Equipment Rental',
    MAINTENANCE: 'Maintenance', TOLLS: 'Tolls', PERMITS: 'Permits',
    FUEL_CARD: 'Fuel Card', FUEL_CARD_FEE: 'Fuel Card Fee',
    TRAILER_RENTAL: 'Trailer Rental', OTHER: 'Other',
};

const BUILT_IN_ADDITIONS: Record<string, string> = {
    BONUS: 'Bonus', OVERTIME: 'Overtime', INCENTIVE: 'Incentive', REIMBURSEMENT: 'Reimbursement',
};

interface CustomType { id: string; name: string; category: string; }

function formatRuleAmount(rule: any): string {
    switch (rule.calculationType) {
        case 'FIXED': return formatCurrency(rule.amount || 0);
        case 'PERCENTAGE': return `${rule.percentage || 0}%`;
        case 'PER_MILE': return `${formatCurrency(rule.perMileRate || 0)}/mi`;
        default: return '-';
    }
}

function getScopeLabel(rule: any, driverId: string): string {
    if (rule.driverId === driverId) return 'Driver-specific';
    if (rule.driverType) return `All ${rule.driverType.replace('_', ' ').toLowerCase()}s`;
    return 'Company-wide';
}

export default function DriverDeductionRulesTab({ driver }: DriverDeductionRulesTabProps) {
    const queryClient = useQueryClient();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [showAdditions, setShowAdditions] = useState(false);

    // Fetch rules applicable to this driver (driver-specific + inherited)
    const { data: rulesData, isLoading } = useQuery({
        queryKey: ['deduction-rules', driver.id],
        queryFn: async () => {
            const res = await fetch(apiUrl(`/api/deduction-rules?driverId=${driver.id}`));
            if (!res.ok) throw new Error('Failed to fetch rules');
            return res.json();
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(apiUrl('/api/deduction-rules'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, driverId: driver.id }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error?.message || 'Failed to create rule');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deduction-rules', driver.id] });
            toast.success('Deduction rule created');
            setIsAddDialogOpen(false);
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const deleteMutation = useMutation({
        mutationFn: async (ruleId: string) => {
            const res = await fetch(apiUrl(`/api/deduction-rules/${ruleId}`), { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete rule');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deduction-rules', driver.id] });
            toast.success('Rule deleted');
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const rules = rulesData?.data || [];
    const deductions = rules.filter((r: any) => !r.isAddition);
    const additions = rules.filter((r: any) => r.isAddition);
    const displayedRules = showAdditions ? additions : deductions;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button
                        variant={!showAdditions ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShowAdditions(false)}
                    >
                        Deductions ({deductions.length})
                    </Button>
                    <Button
                        variant={showAdditions ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShowAdditions(true)}
                    >
                        Additions ({additions.length})
                    </Button>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Add Rule
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add {showAdditions ? 'Addition' : 'Deduction'} Rule</DialogTitle>
                        </DialogHeader>
                        <CreateRuleForm
                            isAddition={showAdditions}
                            onSubmit={(data) => createMutation.mutate(data)}
                            isPending={createMutation.isPending}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium">
                        {showAdditions ? 'Addition' : 'Deduction'} Rules for {driver.user?.firstName} {driver.user?.lastName}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                    ) : displayedRules.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No {showAdditions ? 'addition' : 'deduction'} rules found.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Frequency</TableHead>
                                    <TableHead>Scope</TableHead>
                                    <TableHead>Goal</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-10" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayedRules.map((rule: any) => (
                                    <TableRow key={rule.id}>
                                        <TableCell className="font-medium text-sm">{rule.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                {(rule.deductionType === 'OTHER' && rule.name)
                                                    ? rule.name
                                                    : (BUILT_IN_DEDUCTIONS[rule.deductionType] || BUILT_IN_ADDITIONS[rule.deductionType] || rule.deductionType.replace(/_/g, ' '))}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">{formatRuleAmount(rule)}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {(rule.frequency || rule.deductionFrequency || 'PER_SETTLEMENT').replace(/_/g, ' ')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={rule.driverId === driver.id ? 'default' : 'secondary'}
                                                className="text-xs"
                                            >
                                                {getScopeLabel(rule, driver.id)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {rule.goalAmount ? (
                                                <span>{formatCurrency(rule.currentAmount || 0)} / {formatCurrency(rule.goalAmount)}</span>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={rule.isActive ? 'default' : 'secondary'} className="text-xs">
                                                {rule.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {rule.driverId === driver.id && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => {
                                                        if (confirm('Delete this rule?')) {
                                                            deleteMutation.mutate(rule.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function CreateRuleForm({ isAddition, onSubmit, isPending }: {
    isAddition: boolean;
    onSubmit: (data: any) => void;
    isPending: boolean;
}) {
    const builtInTypes = isAddition ? BUILT_IN_ADDITIONS : BUILT_IN_DEDUCTIONS;
    const [typeOpen, setTypeOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [customTypes, setCustomTypes] = useState<CustomType[]>([]);
    const [form, setForm] = useState({
        name: '',
        deductionType: Object.keys(builtInTypes)[0],
        typeLabel: Object.values(builtInTypes)[0],
        isAddition,
        calculationType: 'FIXED' as string,
        amount: '',
        percentage: '',
        perMileRate: '',
        frequency: 'PER_SETTLEMENT',
        goalAmount: '',
        maxAmount: '',
        minGrossPay: '',
    });

    useEffect(() => {
        const fetchCustomTypes = async () => {
            try {
                const res = await fetch(apiUrl('/api/deduction-type-templates?isActive=true'));
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data) setCustomTypes(data.data);
                }
            } catch { /* ignore */ }
        };
        fetchCustomTypes();
    }, []);

    const category = isAddition ? 'addition' : 'deduction';
    const filteredCustom = customTypes.filter(t => t.category === category);

    const handleTypeSelect = async (key: string, label: string, isCustom: boolean) => {
        setForm(p => ({
            ...p,
            deductionType: isCustom ? 'OTHER' : key,
            typeLabel: label,
            name: p.name || label,
        }));
        setTypeOpen(false);
        setSearchTerm('');
    };

    const createCustomType = async (name: string) => {
        try {
            const res = await fetch(apiUrl('/api/deduction-type-templates'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, category }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data) {
                    setCustomTypes(prev => [...prev, data.data]);
                    toast.success(`Custom type "${name}" created`);
                    handleTypeSelect('OTHER', name, true);
                    return;
                }
            }
            const err = await res.json().catch(() => null);
            toast.error(err?.error?.message || 'Failed to create type');
        } catch {
            toast.error('Failed to create custom type');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            name: form.name,
            deductionType: form.deductionType,
            isAddition: form.isAddition,
            calculationType: form.calculationType,
            amount: form.calculationType === 'FIXED' && form.amount ? parseFloat(form.amount) : undefined,
            percentage: form.calculationType === 'PERCENTAGE' && form.percentage ? parseFloat(form.percentage) : undefined,
            perMileRate: form.calculationType === 'PER_MILE' && form.perMileRate ? parseFloat(form.perMileRate) : undefined,
            frequency: form.frequency,
            goalAmount: form.goalAmount ? parseFloat(form.goalAmount) : undefined,
            maxAmount: form.maxAmount ? parseFloat(form.maxAmount) : undefined,
            minGrossPay: form.minGrossPay ? parseFloat(form.minGrossPay) : undefined,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label>Type</Label>
                    <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                                {form.typeLabel || 'Select type...'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[220px] p-0" align="start">
                            <Command>
                                <CommandInput
                                    placeholder="Search or create..."
                                    value={searchTerm}
                                    onValueChange={setSearchTerm}
                                />
                                <CommandList>
                                    {searchTerm && (
                                        <CommandEmpty>
                                            <Button
                                                variant="ghost"
                                                className="w-full text-sm justify-start h-auto py-1.5 px-2 font-normal"
                                                onClick={() => createCustomType(searchTerm)}
                                            >
                                                Create &quot;{searchTerm}&quot;
                                            </Button>
                                        </CommandEmpty>
                                    )}
                                    <CommandGroup heading={isAddition ? 'Built-in Additions' : 'Built-in Deductions'}>
                                        {Object.entries(builtInTypes).map(([key, label]) => (
                                            <CommandItem
                                                key={key}
                                                value={label}
                                                onSelect={() => handleTypeSelect(key, label, false)}
                                            >
                                                <Check className={cn('mr-2 h-4 w-4', form.deductionType === key && form.typeLabel === label ? 'opacity-100' : 'opacity-0')} />
                                                {label}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                    {filteredCustom.length > 0 && (
                                        <>
                                            <CommandSeparator />
                                            <CommandGroup heading="Custom Types">
                                                {filteredCustom.map((ct) => (
                                                    <CommandItem
                                                        key={ct.id}
                                                        value={ct.name}
                                                        onSelect={() => handleTypeSelect('OTHER', ct.name, true)}
                                                    >
                                                        <Check className={cn('mr-2 h-4 w-4', form.typeLabel === ct.name ? 'opacity-100' : 'opacity-0')} />
                                                        {ct.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </>
                                    )}
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                    <Label>Calculation</Label>
                    <Select value={form.calculationType} onValueChange={(v) => setForm(p => ({ ...p, calculationType: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="FIXED">Fixed Amount</SelectItem>
                            <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                            <SelectItem value="PER_MILE">Per Mile</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {form.calculationType === 'FIXED' && (
                    <div className="space-y-2">
                        <Label>Amount ($)</Label>
                        <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))} required />
                    </div>
                )}
                {form.calculationType === 'PERCENTAGE' && (
                    <div className="space-y-2">
                        <Label>Percentage (%)</Label>
                        <Input type="number" step="0.01" max="100" value={form.percentage} onChange={(e) => setForm(p => ({ ...p, percentage: e.target.value }))} required />
                    </div>
                )}
                {form.calculationType === 'PER_MILE' && (
                    <div className="space-y-2">
                        <Label>Rate per Mile ($)</Label>
                        <Input type="number" step="0.001" value={form.perMileRate} onChange={(e) => setForm(p => ({ ...p, perMileRate: e.target.value }))} required />
                    </div>
                )}
                <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select value={form.frequency} onValueChange={(v) => setForm(p => ({ ...p, frequency: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PER_SETTLEMENT">Per Settlement</SelectItem>
                            <SelectItem value="WEEKLY">Weekly</SelectItem>
                            <SelectItem value="BIWEEKLY">Bi-Weekly</SelectItem>
                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                            <SelectItem value="ONE_TIME">One Time</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                    <Label>Goal Amount</Label>
                    <Input type="number" step="0.01" placeholder="Optional" value={form.goalAmount} onChange={(e) => setForm(p => ({ ...p, goalAmount: e.target.value }))} />
                </div>
                <div className="space-y-2">
                    <Label>Max Amount</Label>
                    <Input type="number" step="0.01" placeholder="Optional" value={form.maxAmount} onChange={(e) => setForm(p => ({ ...p, maxAmount: e.target.value }))} />
                </div>
                <div className="space-y-2">
                    <Label>Min Gross Pay</Label>
                    <Input type="number" step="0.01" placeholder="Optional" value={form.minGrossPay} onChange={(e) => setForm(p => ({ ...p, minGrossPay: e.target.value }))} />
                </div>
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Rule
            </Button>
        </form>
    );
}
