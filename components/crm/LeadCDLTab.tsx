'use client';

import { UseFormReturn } from 'react-hook-form';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';
import { isPast, differenceInDays, addDays } from 'date-fns';

const ENDORSEMENTS = [
    { value: 'H', label: 'H - Hazmat' },
    { value: 'N', label: 'N - Tank' },
    { value: 'P', label: 'P - Passenger' },
    { value: 'S', label: 'S - School Bus' },
    { value: 'T', label: 'T - Double/Triple' },
    { value: 'X', label: 'X - Hazmat + Tank' },
];

const FREIGHT_TYPES = [
    'Dry Van', 'Reefer', 'Flatbed', 'Tanker', 'Hazmat',
    'Oversize', 'Auto Hauler', 'Intermodal', 'LTL',
];

interface LeadCDLTabProps {
    form: UseFormReturn<any>;
}

export default function LeadCDLTab({ form }: LeadCDLTabProps) {
    const cdlExpiration = form.watch('cdlExpiration');
    const expirationWarning = cdlExpiration ? getExpirationWarning(cdlExpiration) : null;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="cdlNumber"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>CDL Number</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="CDL12345678" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="cdlClass"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>CDL Class</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select class" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="A">Class A</SelectItem>
                                    <SelectItem value="B">Class B</SelectItem>
                                    <SelectItem value="C">Class C</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="cdlExpiration"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>CDL Expiration</FormLabel>
                            <FormControl>
                                <Input {...field} type="date" />
                            </FormControl>
                            {expirationWarning && (
                                <div className={`flex items-center gap-1.5 text-xs ${expirationWarning.color}`}>
                                    <AlertTriangle className="h-3 w-3" />
                                    {expirationWarning.text}
                                </div>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="yearsExperience"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Years of Experience</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                    placeholder="5"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
                control={form.control}
                name="endorsements"
                render={() => (
                    <FormItem>
                        <FormLabel>Endorsements</FormLabel>
                        <div className="flex flex-wrap gap-3">
                            {ENDORSEMENTS.map((e) => (
                                <FormField
                                    key={e.value}
                                    control={form.control}
                                    name="endorsements"
                                    render={({ field }) => (
                                        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                                            <Checkbox
                                                checked={field.value?.includes(e.value)}
                                                onCheckedChange={(checked) => {
                                                    const current = field.value || [];
                                                    field.onChange(
                                                        checked
                                                            ? [...current, e.value]
                                                            : current.filter((v: string) => v !== e.value)
                                                    );
                                                }}
                                            />
                                            {e.label}
                                        </label>
                                    )}
                                />
                            ))}
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="freightTypes"
                render={() => (
                    <FormItem>
                        <FormLabel>Freight Types</FormLabel>
                        <div className="flex flex-wrap gap-2">
                            {FREIGHT_TYPES.map((ft) => (
                                <FormField
                                    key={ft}
                                    control={form.control}
                                    name="freightTypes"
                                    render={({ field }) => {
                                        const selected = field.value?.includes(ft);
                                        return (
                                            <Badge
                                                variant={selected ? 'default' : 'outline'}
                                                className="cursor-pointer"
                                                onClick={() => {
                                                    const current = field.value || [];
                                                    field.onChange(
                                                        selected
                                                            ? current.filter((v: string) => v !== ft)
                                                            : [...current, ft]
                                                    );
                                                }}
                                            >
                                                {ft}
                                            </Badge>
                                        );
                                    }}
                                />
                            ))}
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="previousEmployers"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Previous Employers</FormLabel>
                        <FormControl>
                            <Textarea
                                {...field}
                                placeholder="List previous trucking companies..."
                                rows={3}
                            />
                        </FormControl>
                        <FormDescription>One per line or comma-separated</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}

function getExpirationWarning(dateStr: string): { text: string; color: string } | null {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    if (isPast(date)) return { text: 'CDL is expired!', color: 'text-red-600' };
    const daysLeft = differenceInDays(date, new Date());
    if (daysLeft <= 30) return { text: `Expires in ${daysLeft} days`, color: 'text-red-500' };
    if (daysLeft <= 90) return { text: `Expires in ${daysLeft} days`, color: 'text-amber-500' };
    return null;
}
