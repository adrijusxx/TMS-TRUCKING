'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import LeadNotes from './LeadNotes';
import LeadActivityTimeline from './LeadActivityTimeline';
import LeadDocuments from './LeadDocuments';
import LeadPersonalTab from './LeadPersonalTab';
import LeadCDLTab from './LeadCDLTab';
import LeadStatusTab from './LeadStatusTab';
import HireLeadDialog from './HireLeadDialog';
import LeadQuickActions from './LeadQuickActions';
import DuplicateLeadWarning from './DuplicateLeadWarning';
import { Card, CardContent } from '@/components/ui/card';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, FileSpreadsheet, UserCheck } from 'lucide-react';
import { useClickToCall } from '@/lib/hooks/useClickToCall';

const leadFormSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().min(10, 'Valid phone number required'),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    cdlNumber: z.string().optional(),
    cdlClass: z.string().optional(),
    yearsExperience: z.number().optional(),
    status: z.string(),
    priority: z.string(),
    source: z.string(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

const defaultValues: LeadFormValues = {
    firstName: '', lastName: '', phone: '', email: '',
    address: '', city: '', state: '', zip: '',
    cdlNumber: '', cdlClass: '', yearsExperience: undefined,
    status: 'NEW', priority: 'WARM', source: 'OTHER',
};

interface LeadSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    leadId: string | null;
    onSuccess?: () => void;
}

export default function LeadSheet({ open, onOpenChange, leadId, onSuccess }: LeadSheetProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [leadData, setLeadData] = useState<any>(null);
    const [hireDialogOpen, setHireDialogOpen] = useState(false);
    const isEditing = !!leadId;

    const form = useForm<LeadFormValues>({
        resolver: zodResolver(leadFormSchema),
        defaultValues,
    });

    useEffect(() => {
        if (leadId && open) {
            setIsFetching(true);
            fetch(`/api/crm/leads/${leadId}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.lead) {
                        setLeadData(data.lead);
                        form.reset({
                            firstName: data.lead.firstName || '',
                            lastName: data.lead.lastName || '',
                            phone: data.lead.phone || '',
                            email: data.lead.email || '',
                            address: data.lead.address || '',
                            city: data.lead.city || '',
                            state: data.lead.state || '',
                            zip: data.lead.zip || '',
                            cdlNumber: data.lead.cdlNumber || '',
                            cdlClass: data.lead.cdlClass || '',
                            yearsExperience: data.lead.yearsExperience || undefined,
                            status: data.lead.status || 'NEW',
                            priority: data.lead.priority || 'WARM',
                            source: data.lead.source || 'OTHER',
                        });
                    }
                })
                .finally(() => setIsFetching(false));
        } else if (!leadId && open) {
            setLeadData(null);
            form.reset(defaultValues);
        }
    }, [leadId, open, form]);

    const { initiateCall } = useClickToCall();
    const handleCall = (phone: string) => initiateCall(phone);

    const handleScoreUpdate = (score: number, summary: string) => {
        setLeadData((prev: any) => ({
            ...prev,
            aiScore: score,
            aiScoreSummary: summary,
            aiScoreUpdatedAt: new Date().toISOString(),
        }));
        onSuccess?.();
    };

    const onSubmit = async (values: LeadFormValues) => {
        // Intercept HIRED: redirect to proper hire flow with driver creation
        if (isEditing && values.status === 'HIRED' && leadData?.status !== 'HIRED') {
            setHireDialogOpen(true);
            return;
        }

        setIsLoading(true);
        try {
            const url = isEditing ? `/api/crm/leads/${leadId}` : '/api/crm/leads';
            const res = await fetch(url, {
                method: isEditing ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to save lead');
            }
            toast.success(isEditing ? 'Lead updated successfully' : 'Lead created successfully');
            onSuccess?.();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save lead');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[700px] sm:max-w-[700px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{isEditing ? 'Edit Lead' : 'Add New Lead'}</SheetTitle>
                    <SheetDescription>
                        {isEditing
                            ? 'Update lead information and track progress'
                            : 'Enter lead details to add them to the recruiting pipeline'}
                    </SheetDescription>
                    {isEditing && leadId && (
                        <LeadQuickActions leadId={leadId} onSuccess={onSuccess} />
                    )}
                </SheetHeader>

                {isFetching ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
                            {!isEditing && (
                                <DuplicateLeadWarning
                                    phone={form.watch('phone')}
                                    email={form.watch('email')}
                                />
                            )}
                            <Tabs defaultValue="personal" className="w-full">
                                <TabsList className={`grid w-full ${isEditing ? 'grid-cols-7' : 'grid-cols-3'}`}>
                                    <TabsTrigger value="personal">Personal</TabsTrigger>
                                    <TabsTrigger value="cdl">CDL Info</TabsTrigger>
                                    <TabsTrigger value="status">Status</TabsTrigger>
                                    {isEditing && <TabsTrigger value="import">Import Data</TabsTrigger>}
                                    {isEditing && <TabsTrigger value="notes">Notes</TabsTrigger>}
                                    {isEditing && <TabsTrigger value="activity">Activity</TabsTrigger>}
                                    {isEditing && <TabsTrigger value="documents">Docs</TabsTrigger>}
                                </TabsList>

                                <TabsContent value="personal" className="mt-4">
                                    <LeadPersonalTab form={form} onCall={handleCall} />
                                </TabsContent>

                                <TabsContent value="cdl" className="mt-4">
                                    <LeadCDLTab form={form} />
                                </TabsContent>

                                <TabsContent value="status" className="mt-4">
                                    <LeadStatusTab
                                        form={form}
                                        isEditing={isEditing}
                                        leadId={leadId}
                                        leadData={leadData}
                                        onScoreUpdate={handleScoreUpdate}
                                    />
                                </TabsContent>

                                {isEditing && (
                                    <>
                                        <TabsContent value="import" className="mt-4">
                                            <ImportMetadataCard metadata={leadData?.metadata} />
                                        </TabsContent>
                                        <TabsContent value="notes" className="mt-4">
                                            <div className="bg-muted/10 p-1 rounded-lg">
                                                <LeadNotes leadId={leadId!} />
                                            </div>
                                        </TabsContent>
                                        <TabsContent value="activity" className="mt-4">
                                            <div className="bg-muted/10 p-1 rounded-lg">
                                                <LeadActivityTimeline leadId={leadId!} />
                                            </div>
                                        </TabsContent>
                                        <TabsContent value="documents" className="mt-4">
                                            <div className="bg-muted/10 p-1 rounded-lg">
                                                <LeadDocuments leadId={leadId!} />
                                            </div>
                                        </TabsContent>
                                    </>
                                )}
                            </Tabs>

                            <div className="flex justify-between gap-3 pt-4 border-t">
                                <div>
                                    {isEditing && leadData?.status !== 'HIRED' && leadData?.status !== 'REJECTED' && !leadData?.driverId && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="text-green-600 border-green-600 hover:bg-green-50"
                                            onClick={() => setHireDialogOpen(true)}
                                        >
                                            <UserCheck className="h-4 w-4 mr-2" />
                                            Hire
                                        </Button>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                        {isEditing ? 'Save Changes' : 'Create Lead'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </Form>
                )}
            </SheetContent>

            {isEditing && leadId && (
                <HireLeadDialog
                    open={hireDialogOpen}
                    onOpenChange={setHireDialogOpen}
                    leadId={leadId}
                    leadName={`${leadData?.firstName || ''} ${leadData?.lastName || ''}`.trim()}
                    onSuccess={() => {
                        setHireDialogOpen(false);
                        onSuccess?.();
                    }}
                />
            )}
        </Sheet>
    );
}

function ImportMetadataCard({ metadata }: { metadata?: Record<string, any> | null }) {
    return (
        <Card>
            <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Import Metadata</span>
                </div>
                {metadata && Object.keys(metadata).length > 0 ? (
                    <div className="space-y-2">
                        {Object.entries(metadata).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-start py-2 border-b last:border-0">
                                <span className="text-xs text-muted-foreground capitalize">
                                    {key.replace(/_/g, ' ')}
                                </span>
                                <span className="text-sm text-right max-w-[60%]">
                                    {String(value)}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                        No import metadata available.
                        <p className="text-xs mt-1">Extra fields from Facebook forms or spreadsheets will appear here.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
