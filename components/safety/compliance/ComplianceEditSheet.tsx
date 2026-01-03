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
    const [activeTab, setActiveTab] = useState('cdl');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadedDocId, setUploadedDocId] = useState<string | null>(null);

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
            number: '', // Med card number often not in table view, would need to fetch or leave blank
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
            if (uploadedDocId) {
                formData.append('documentId', uploadedDocId);
            }

            const res = await updateDriverCompliance(null, formData);
            if (res.success) {
                toast.success(`${type.toUpperCase()} record updated successfully`);
                onClose();
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            console.error(error);
            toast.error('An error occurred');
        } finally {
            setIsSubmitting(false);
            setUploadedDocId(null);
        }
    };

    if (!driver) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto sm:w-[800px] p-6 sm:p-10">
                <SheetHeader>
                    <SheetTitle>Edit Compliance: {driver.name}</SheetTitle>
                    <SheetDescription>
                        Update documents and records for this driver.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-5 mb-6">
                            <TabsTrigger value="cdl">CDL</TabsTrigger>
                            <TabsTrigger value="medCard">Med</TabsTrigger>
                            <TabsTrigger value="mvr">MVR</TabsTrigger>
                            <TabsTrigger value="drugTest">Drug</TabsTrigger>
                            <TabsTrigger value="annualReview">Review</TabsTrigger>
                        </TabsList>

                        {/* CDL Tab */}
                        <TabsContent value="cdl">
                            <Form {...cdlForm}>
                                <form onSubmit={cdlForm.handleSubmit((d) => onSubmit(d, 'cdl'))}>
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        <div className="md:col-span-7 space-y-4">
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
                                            <Button type="submit" disabled={isSubmitting} className="w-full mt-4">
                                                {isSubmitting ? 'Saving...' : 'Save CDL Record'}
                                            </Button>
                                        </div>
                                        <div className="md:col-span-5">
                                            <div className="border rounded-md p-4 bg-muted/20 h-full">
                                                <Label className="mb-4 block font-semibold">CDL Document</Label>
                                                <DocumentUpload
                                                    onSuccess={(res) => setUploadedDocId(res?.data?.id)}
                                                    driverId={driver.id}
                                                    defaultType="DRIVER_LICENSE"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </Form>
                        </TabsContent>

                        {/* Med Card Tab */}
                        <TabsContent value="medCard">
                            <Form {...medCardForm}>
                                <form onSubmit={medCardForm.handleSubmit((d) => onSubmit(d, 'medCard'))}>
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        <div className="md:col-span-7 space-y-4">
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
                                            <Button type="submit" disabled={isSubmitting} className="w-full mt-4">
                                                {isSubmitting ? 'Saving...' : 'Save Medical Card'}
                                            </Button>
                                        </div>
                                        <div className="md:col-span-5">
                                            <div className="border rounded-md p-4 bg-muted/20 h-full">
                                                <Label className="mb-4 block font-semibold">Medical Card</Label>
                                                <DocumentUpload
                                                    onSuccess={(res) => setUploadedDocId(res?.data?.id)}
                                                    driverId={driver.id}
                                                    defaultType="MEDICAL_CARD"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </Form>
                        </TabsContent>

                        {/* MVR Tab */}
                        <TabsContent value="mvr">
                            <Form {...mvrForm}>
                                <form onSubmit={mvrForm.handleSubmit((d) => onSubmit(d, 'mvr'))}>
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        <div className="md:col-span-7 space-y-4">
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
                                            <Button type="submit" disabled={isSubmitting} className="w-full mt-4">
                                                {isSubmitting ? 'Saving...' : 'Record MVR Pull'}
                                            </Button>
                                        </div>
                                        <div className="md:col-span-5">
                                            <div className="border rounded-md p-4 bg-muted/20 h-full">
                                                <Label className="mb-4 block font-semibold">MVR PDF</Label>
                                                <DocumentUpload
                                                    onSuccess={(res) => setUploadedDocId(res?.data?.id)}
                                                    driverId={driver.id}
                                                    defaultType="OTHER"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </Form>
                        </TabsContent>

                        {/* Drug Test Tab */}
                        <TabsContent value="drugTest">
                            <Form {...drugTestForm}>
                                <form onSubmit={drugTestForm.handleSubmit((d) => onSubmit(d, 'drugTest'))}>
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        <div className="md:col-span-7 space-y-4">
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
                                            <Button type="submit" disabled={isSubmitting} className="w-full mt-4">
                                                {isSubmitting ? 'Saving...' : 'Save Test Result'}
                                            </Button>
                                        </div>
                                        <div className="md:col-span-5">
                                            <div className="border rounded-md p-4 bg-muted/20 h-full">
                                                <Label className="mb-4 block font-semibold">Test Result PDF</Label>
                                                <DocumentUpload
                                                    onSuccess={(res) => setUploadedDocId(res?.data?.id)}
                                                    driverId={driver.id}
                                                    defaultType="OTHER"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </Form>
                        </TabsContent>

                        {/* Annual Review Tab */}
                        <TabsContent value="annualReview">
                            <Form {...annualReviewForm}>
                                <form onSubmit={annualReviewForm.handleSubmit((d) => onSubmit(d, 'annualReview'))}>
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        <div className="md:col-span-7 space-y-4">
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
                                            <Button type="submit" disabled={isSubmitting} className="w-full mt-4">
                                                {isSubmitting ? 'Saving...' : 'Save Review'}
                                            </Button>
                                        </div>
                                        <div className="md:col-span-5">
                                            <div className="border rounded-md p-4 bg-muted/20 h-full">
                                                <Label className="mb-4 block font-semibold">Review Document</Label>
                                                <DocumentUpload
                                                    onSuccess={(res) => setUploadedDocId(res?.data?.id)}
                                                    driverId={driver.id}
                                                    defaultType="OTHER"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </Form>
                        </TabsContent>

                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    );
}
