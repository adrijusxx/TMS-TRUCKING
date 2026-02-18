'use client';

import { UseFormReturn } from 'react-hook-form';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface LeadCDLTabProps {
    form: UseFormReturn<any>;
}

export default function LeadCDLTab({ form }: LeadCDLTabProps) {
    return (
        <div className="space-y-4">
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
    );
}
