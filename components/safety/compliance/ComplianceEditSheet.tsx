'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Form,
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
import { Checkbox } from '@/components/ui/checkbox';
import DocumentUpload from '@/components/documents/DocumentUpload';
import { updateDriverCompliance } from '@/app/actions/safety/compliance-actions';
import { toast } from 'sonner';

interface ComplianceEditSheetProps {
    isOpen: boolean;
    onClose: () => void;
    driver: any; // Using flexible type for now, should match ComplianceDriver
}

// Validation schemas for different forms
const cdlSchema = z.object({
    number: z.string().min(1, 'CDL Number is required'),
    state: z.string().length(2, 'State must be 2 characters'),
    expiry: z.string().min(1, 'Expiration date is required'),
});

const medCardSchema = z.object({
    number: z.string().min(1, 'Registry number is required'),
    expiry: z.string().min(1, 'Expiration date is required'),
});

const mvrSchema = z.object({
    date: z.string().min(1, 'Pull date is required'),
    state: z.string().length(2, 'State must be 2 characters'),
});

const drugTestSchema = z.object({
    date: z.string().min(1, 'Test date is required'),
    testType: z.string().min(1, 'Test type is required'),
    result: z.string().min(1, 'Result is required'),
});

const annualReviewSchema = z.object({
    date: z.string().min(1, 'Review date is required'),
    status: z.string().min(1, 'Status is required'),
});

export default function ComplianceEditSheet({ isOpen, onClose, driver }: ComplianceEditSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    // State to track uploaded document IDs per section
    const [uploadedDocIds, setUploadedDocIds] = useState<Record<string, string>>({});

    // -- Forms --
    const cdlForm = useForm<z.infer<typeof cdlSchema>>({
        resolver: zodResolver(cdlSchema),
        defaultValues: {
            number: driver?.cdl?.number || '',
            state: driver?.cdl?.state || '',
            expiry: driver?.cdl?.expiry ? new Date(driver.cdl.expiry).toISOString().split('T')[0] : '',
        }
    });

    const medCardForm = useForm<z.infer<typeof medCardSchema>>({
        resolver: zodResolver(medCardSchema),
        defaultValues: {
            number: '',
            expiry: driver?.medCard?.expiry ? new Date(driver.medCard.expiry).toISOString().split('T')[0] : '',
        }
    });

    const mvrForm = useForm<z.infer<typeof mvrSchema>>({
        resolver: zodResolver(mvrSchema),
        defaultValues: {
            date: driver?.mvr?.date ? new Date(driver.mvr.date).toISOString().split('T')[0] : '',
            state: driver?.cdl?.state || '',
        }
    });

    const drugTestForm = useForm<z.infer<typeof drugTestSchema>>({
        resolver: zodResolver(drugTestSchema),
        defaultValues: {
            date: driver?.drugTest?.date ? new Date(driver.drugTest.date).toISOString().split('T')[0] : '',
            testType: 'RANDOM',
            result: driver?.drugTest?.result || 'NEGATIVE',
        }
    });

    const annualReviewForm = useForm<z.infer<typeof annualReviewSchema>>({
        resolver: zodResolver(annualReviewSchema),
        defaultValues: {
            date: driver?.annualReview?.date ? new Date(driver.annualReview.date).toISOString().split('T')[0] : '',
            status: driver?.annualReview?.status || 'COMPLETED',
        }
    });

    // -- Submit Handler --
    const onSubmit = async (data: any, type: string) => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('driverId', driver.id);
            formData.append('type', type);
            formData.append('data', JSON.stringify(data));

            // Get the specific document ID for this section
            const docId = uploadedDocIds[type];
            if (docId) {
                formData.append('documentId', docId);
            }

            const res = await updateDriverCompliance(null, formData);
            if (res.success) {
                toast.success(`${type.toUpperCase()} record updated successfully`);
                // Clear the uploaded doc ID for this section after successful save
                setUploadedDocIds(prev => {
                    const next = { ...prev };
                    delete next[type];
                    return next;
                });

                if (type === 'annualReview') {
                    onClose();
                }
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            console.error(error);
            toast.error('An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDocSuccess = (type: string, res: any) => {
        if (res?.data?.id) {
            setUploadedDocIds(prev => ({ ...prev, [type]: res.data.id }));
            toast.success("Document uploaded. Click 'Save' to attach it.");
        }
    };

    if (!driver) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[800px] sm:max-w-[800px] p-0 flex flex-col h-full bg-background">
                <SheetHeader className="px-6 py-4 border-b flex-shrink-0">
                    <SheetTitle>Edit Compliance: {driver.name}</SheetTitle>
                    <SheetDescription>
                        Update documents and records for this driver. Scroll down to edit multiple sections.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

                    {/* CDL Section */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-sm">1</span>
                                CDL Record
                            </h3>
                        </div>
                        <Form {...cdlForm}>
                            <form onSubmit={cdlForm.handleSubmit((d) => onSubmit(d, 'cdl'))}>
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <FormField
                                            control={cdlForm.control}
                                            name="number"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>CDL Number</FormLabel>
                                                    <FormControl><Input {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={cdlForm.control}
                                                name="state"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>State</FormLabel>
                                                        <FormControl><Input {...field} maxLength={2} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={cdlForm.control}
                                                name="expiry"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Expiration Date</FormLabel>
                                                        <FormControl><Input type="date" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="border rounded-md p-4 bg-muted/20">
                                        <Label className="mb-4 block font-semibold">CDL Document</Label>
                                        <DocumentUpload
                                            onSuccess={(res) => handleDocSuccess('cdl', res)}
                                            driverId={driver.id}
                                            defaultType="DRIVER_LICENSE"
                                            compact
                                        />
                                        {uploadedDocIds['cdl'] && (
                                            <p className="text-xs text-green-600 mt-2 font-medium">Document ready to attach</p>
                                        )}
                                    </div>

                                    <Button type="submit" disabled={isSubmitting} className="w-full">
                                        {isSubmitting ? 'Saving...' : 'Save CDL Record'}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </section>

                    {/* Med Card Section */}
                    <section className="space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-sm">2</span>
                                Medical Card
                            </h3>
                        </div>
                        <Form {...medCardForm}>
                            <form onSubmit={medCardForm.handleSubmit((d) => onSubmit(d, 'medCard'))}>
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <FormField
                                            control={medCardForm.control}
                                            name="number"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Registry Number</FormLabel>
                                                    <FormControl><Input {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={medCardForm.control}
                                            name="expiry"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Expiration Date</FormLabel>
                                                    <FormControl><Input type="date" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="border rounded-md p-4 bg-muted/20">
                                        <Label className="mb-4 block font-semibold">Medical Card Document</Label>
                                        <DocumentUpload
                                            onSuccess={(res) => handleDocSuccess('medCard', res)}
                                            driverId={driver.id}
                                            defaultType="MEDICAL_CARD"
                                            compact
                                        />
                                        {uploadedDocIds['medCard'] && (
                                            <p className="text-xs text-green-600 mt-2 font-medium">Document ready to attach</p>
                                        )}
                                    </div>

                                    <Button type="submit" disabled={isSubmitting} className="w-full">
                                        {isSubmitting ? 'Saving...' : 'Save Medical Card'}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </section>

                    {/* MVR Section */}
                    <section className="space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-sm">3</span>
                                MVR Record
                            </h3>
                        </div>
                        <Form {...mvrForm}>
                            <form onSubmit={mvrForm.handleSubmit((d) => onSubmit(d, 'mvr'))}>
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={mvrForm.control}
                                                name="date"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Pull Date</FormLabel>
                                                        <FormControl><Input type="date" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={mvrForm.control}
                                                name="state"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>State</FormLabel>
                                                        <FormControl><Input {...field} maxLength={2} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="border rounded-md p-4 bg-muted/20">
                                        <Label className="mb-4 block font-semibold">MVR PDF</Label>
                                        <DocumentUpload
                                            onSuccess={(res) => handleDocSuccess('mvr', res)}
                                            driverId={driver.id}
                                            defaultType="OTHER"
                                            compact
                                        />
                                        {uploadedDocIds['mvr'] && (
                                            <p className="text-xs text-green-600 mt-2 font-medium">Document ready to attach</p>
                                        )}
                                    </div>

                                    <Button type="submit" disabled={isSubmitting} className="w-full">
                                        {isSubmitting ? 'Saving...' : 'Record MVR Pull'}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </section>

                    {/* Drug Test Section */}
                    <section className="space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-sm">4</span>
                                Drug & Alcohol Test
                            </h3>
                        </div>
                        <Form {...drugTestForm}>
                            <form onSubmit={drugTestForm.handleSubmit((d) => onSubmit(d, 'drugTest'))}>
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <FormField
                                            control={drugTestForm.control}
                                            name="testType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Test Type</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="RANDOM">Random</SelectItem>
                                                            <SelectItem value="PRE_EMPLOYMENT">Pre-Employment</SelectItem>
                                                            <SelectItem value="POST_ACCIDENT">Post-Accident</SelectItem>
                                                            <SelectItem value="REASONABLE_SUSPICION">Reasonable Suspicion</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={drugTestForm.control}
                                                name="date"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Test Date</FormLabel>
                                                        <FormControl><Input type="date" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={drugTestForm.control}
                                                name="result"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Result</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Result" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="NEGATIVE">Negative (Pass)</SelectItem>
                                                                <SelectItem value="POSITIVE">Positive (Fail)</SelectItem>
                                                                <SelectItem value="REFUSAL">Refusal</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="border rounded-md p-4 bg-muted/20">
                                        <Label className="mb-4 block font-semibold">Test Result PDF</Label>
                                        <DocumentUpload
                                            onSuccess={(res) => handleDocSuccess('drugTest', res)}
                                            driverId={driver.id}
                                            defaultType="OTHER"
                                            compact
                                        />
                                        {uploadedDocIds['drugTest'] && (
                                            <p className="text-xs text-green-600 mt-2 font-medium">Document ready to attach</p>
                                        )}
                                    </div>

                                    <Button type="submit" disabled={isSubmitting} className="w-full">
                                        {isSubmitting ? 'Saving...' : 'Save Test Result'}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </section>

                    {/* Annual Review Section */}
                    <section className="space-y-4 pt-4 border-t pb-8">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-sm">5</span>
                                Annual Review
                            </h3>
                        </div>
                        <Form {...annualReviewForm}>
                            <form onSubmit={annualReviewForm.handleSubmit((d) => onSubmit(d, 'annualReview'))}>
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={annualReviewForm.control}
                                                name="date"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Review Date</FormLabel>
                                                        <FormControl><Input type="date" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={annualReviewForm.control}
                                                name="status"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Status</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Status" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                                                <SelectItem value="PENDING">Pending</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="border rounded-md p-4 bg-muted/20">
                                        <Label className="mb-4 block font-semibold">Review Document</Label>
                                        <DocumentUpload
                                            onSuccess={(res) => handleDocSuccess('annualReview', res)}
                                            driverId={driver.id}
                                            defaultType="OTHER"
                                            compact
                                        />
                                        {uploadedDocIds['annualReview'] && (
                                            <p className="text-xs text-green-600 mt-2 font-medium">Document ready to attach</p>
                                        )}
                                    </div>

                                    <Button type="submit" disabled={isSubmitting} className="w-full">
                                        {isSubmitting ? 'Saving...' : 'Save Review'}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </section>
                </div>
            </SheetContent>
        </Sheet>
    );
}
