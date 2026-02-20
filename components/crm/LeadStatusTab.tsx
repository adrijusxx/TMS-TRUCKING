'use client';

import { UseFormReturn } from 'react-hook-form';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface LeadStatusTabProps {
    form: UseFormReturn<any>;
    isEditing: boolean;
    leadData?: any;
}

export default function LeadStatusTab({ form, isEditing, leadData }: LeadStatusTabProps) {
    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="NEW">New</SelectItem>
                                <SelectItem value="CONTACTED">Contacted</SelectItem>
                                <SelectItem value="QUALIFIED">Qualified</SelectItem>
                                <SelectItem value="DOCUMENTS_PENDING">Documents Pending</SelectItem>
                                <SelectItem value="DOCUMENTS_COLLECTED">Documents Collected</SelectItem>
                                <SelectItem value="INTERVIEW">Interview</SelectItem>
                                <SelectItem value="OFFER">Offer</SelectItem>
                                {leadData?.status === 'HIRED' && (
                                    <SelectItem value="HIRED">Hired</SelectItem>
                                )}
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="HOT">Hot</SelectItem>
                                <SelectItem value="WARM">Warm</SelectItem>
                                <SelectItem value="COLD">Cold</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Source</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="FACEBOOK">Facebook</SelectItem>
                                <SelectItem value="REFERRAL">Referral</SelectItem>
                                <SelectItem value="DIRECT">Direct</SelectItem>
                                <SelectItem value="WEBSITE">Website</SelectItem>
                                <SelectItem value="APPLICATION">Application</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}
