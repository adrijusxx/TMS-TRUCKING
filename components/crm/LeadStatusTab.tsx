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
import { Input } from '@/components/ui/input';
import { Clock, AlertTriangle } from 'lucide-react';
import LeadAIScore from './LeadAIScore';

interface LeadStatusTabProps {
    form: UseFormReturn<any>;
    isEditing: boolean;
    leadId?: string | null;
    leadData?: any;
    onScoreUpdate?: (score: number, summary: string) => void;
}

export default function LeadStatusTab({ form, isEditing, leadId, leadData, onScoreUpdate }: LeadStatusTabProps) {
    return (
        <div className="space-y-4">
            {isEditing && leadId && onScoreUpdate && (
                <LeadAIScore leadId={leadId} leadData={leadData} onScoreUpdate={onScoreUpdate} />
            )}

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

            {isEditing && leadData && (
                <FollowUpSection leadData={leadData} />
            )}
        </div>
    );
}

function FollowUpSection({ leadData }: { leadData: any }) {
    const followUp = leadData?.nextFollowUpDate ? new Date(leadData.nextFollowUpDate) : null;
    const isOverdue = followUp ? followUp < new Date() : false;

    return (
        <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 mb-2">
                {isOverdue ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                ) : (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">Follow-Up</span>
            </div>
            {followUp ? (
                <div className={`text-sm px-3 py-2 rounded-md ${isOverdue ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400' : 'bg-muted'}`}>
                    <p className="font-medium">
                        {followUp.toLocaleDateString()} at {followUp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isOverdue && <span className="ml-2 text-xs font-bold uppercase">Overdue</span>}
                    </p>
                    {leadData?.nextFollowUpNote && (
                        <p className="text-xs mt-1 opacity-80">{leadData.nextFollowUpNote}</p>
                    )}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">
                    No follow-up scheduled. Use the quick actions above to log activity and set a follow-up.
                </p>
            )}
        </div>
    );
}
