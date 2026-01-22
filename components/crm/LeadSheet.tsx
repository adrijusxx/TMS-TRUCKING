'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import LeadNotes from './LeadNotes';
import LeadActivityTimeline from './LeadActivityTimeline';
import LeadDocuments from './LeadDocuments';
import { Card, CardContent } from '@/components/ui/card';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Loader2, Sparkles, Phone, FileSpreadsheet } from 'lucide-react';

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

interface LeadSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    leadId: string | null;
    onSuccess?: () => void;
}

export default function LeadSheet({
    open,
    onOpenChange,
    leadId,
    onSuccess,
}: LeadSheetProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const isEditing = !!leadId;

    const form = useForm<LeadFormValues>({
        resolver: zodResolver(leadFormSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            phone: '',
            email: '',
            address: '',
            city: '',
            state: '',
            zip: '',
            cdlNumber: '',
            cdlClass: '',
            yearsExperience: undefined,
            status: 'NEW',
            priority: 'WARM',
            source: 'OTHER',
        },
    });

    const [leadData, setLeadData] = useState<any>(null);

    // Fetch lead data when editing
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
            form.reset({
                firstName: '',
                lastName: '',
                phone: '',
                email: '',
                address: '',
                city: '',
                state: '',
                zip: '',
                cdlNumber: '',
                cdlClass: '',
                yearsExperience: undefined,
                status: 'NEW',
                priority: 'WARM',
                source: 'OTHER',
            });
        }
    }, [leadId, open, form]);

    const [generatingScore, setGeneratingScore] = useState(false);

    const handleGenerateScore = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent form submission
        if (!leadId) return;

        setGeneratingScore(true);
        try {
            const res = await fetch(`/api/crm/leads/${leadId}/score`, {
                method: 'POST'
            });

            if (!res.ok) throw new Error('Failed to generate score');

            const data = await res.json();
            toast.success('AI Analysis Complete');

            // Update local state to show score immediately
            setLeadData((prev: any) => ({
                ...prev,
                aiScore: data.data.score,
                aiScoreSummary: data.data.summary,
                aiScoreUpdatedAt: new Date().toISOString()
            }));

            // Refresh logic - ideally revalidate data
            // For now, simple hack to update local state if we had it, but LeadSheet relies on props for some parts?
            // Actually LeadSheet takes `leadId` and usually `trigger`? 
            // In `LeadListClient`, it passes `leadId`. But LeadSheet has internal form.
            // I should force a refresh. queryClient.invalidateQueries? I'll need to check how data is fetched.
            // If passed as prop, I can't easily update it without parent refresh.
            // But I can trigger the parent refresh via `onSave` logic if I call it? 
            // Or just rely on user closing/opening/refreshing for now.
            // I'll emit a toast.
            onSuccess?.(); // Update parent if it accepts data? onSave returns void usually.

            // If I want immediate update I might need to fetch lead again inside components
        } catch (error) {
            toast.error('Failed to generate score');
            console.error(error);
        } finally {
            setGeneratingScore(false);
        }
    };

    function getScoreColor(score: number) {
        if (score >= 80) return 'text-green-600';
        if (score >= 50) return 'text-yellow-600';
        return 'text-red-600';
    }

    const handleCall = async (phone: string) => {
        try {
            // Check for Yoko configuration
            const settingsRes = await fetch('/api/user/voip-settings');
            const settingsData = await settingsRes.json();
            const isYokoEnabled = settingsData?.voipConfig?.enabled;

            if (isYokoEnabled) {
                toast.info('Initiating call via Yoko...');
                const callRes = await fetch('/api/communications/call', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ destination: phone })
                });
                const callData = await callRes.json();

                if (!callRes.ok) throw new Error(callData.error);
                toast.success('Call initiated! Check your device.');
            } else {
                window.location.href = `tel:${phone}`;
            }
        } catch (err) {
            console.error('Call failed', err);
            // Fallback to tel: on error
            window.location.href = `tel:${phone}`;
        }
    };

    const onSubmit = async (values: LeadFormValues) => {
        setIsLoading(true);
        try {
            const url = isEditing ? `/api/crm/leads/${leadId}` : '/api/crm/leads';
            const method = isEditing ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
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
                            : 'Enter lead details to add them to the recruitment pipeline'}
                    </SheetDescription>
                </SheetHeader>

                {isFetching ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
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

                                <TabsContent value="personal" className="space-y-4 mt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="firstName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>First Name *</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="John" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="lastName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Last Name *</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="Doe" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone *</FormLabel>
                                                <div className="flex gap-2">
                                                    <FormControl>
                                                        <Input {...field} placeholder="(555) 123-4567" />
                                                    </FormControl>
                                                    {field.value && (
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            type="button"
                                                            title="Call Lead"
                                                            onClick={() => handleCall(field.value)}
                                                        >
                                                            <Phone className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="email" placeholder="john@example.com" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Address</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="123 Main St" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="city"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>City</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="state"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>State</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="zip"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>ZIP</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="cdl" className="space-y-4 mt-4">
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
                                </TabsContent>

                                <TabsContent value="status" className="space-y-4 mt-4">
                                    {isEditing && (
                                        <Card>
                                            <CardContent className="pt-6">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                                            <Sparkles className="h-5 w-5 text-yellow-500" />
                                                            AI Fit Score
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground">Automated candidate evaluation</p>
                                                    </div>
                                                    <Button variant="outline" size="sm" onClick={handleGenerateScore} disabled={generatingScore}>
                                                        {generatingScore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                                        {leadData?.aiScore ? 'Recalculate' : 'Generate Score'}
                                                    </Button>
                                                </div>

                                                {leadData?.aiScore !== null && leadData?.aiScore !== undefined ? (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`text-4xl font-bold ${getScoreColor(leadData.aiScore)}`}>
                                                                {leadData.aiScore}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                Last updated: {leadData.aiScoreUpdatedAt ? format(new Date(leadData.aiScoreUpdatedAt), 'MMM d, h:mm a') : 'Just now'}
                                                            </div>
                                                        </div>

                                                        {leadData.aiScoreSummary && (
                                                            <div className="bg-muted p-3 rounded-md text-sm">
                                                                {leadData.aiScoreSummary}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                                                        No score generated yet. Click above to analyze this candidate.
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
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
                                                        <SelectItem value="HIRED">Hired</SelectItem>
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
                                                        <SelectItem value="HOT">🔥 Hot</SelectItem>
                                                        <SelectItem value="WARM">☀️ Warm</SelectItem>
                                                        <SelectItem value="COLD">❄️ Cold</SelectItem>
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
                                                        <SelectItem value="OTHER">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TabsContent>

                                {isEditing && (
                                    <>
                                        <TabsContent value="import" className="mt-4">
                                            <Card>
                                                <CardContent className="pt-4">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium text-sm">Import Metadata</span>
                                                    </div>
                                                    {leadData?.metadata && Object.keys(leadData.metadata).length > 0 ? (
                                                        <div className="space-y-2">
                                                            {Object.entries(leadData.metadata as Record<string, any>).map(([key, value]) => (
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

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    {isEditing ? 'Save Changes' : 'Create Lead'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}
            </SheetContent>
        </Sheet >
    );
}
