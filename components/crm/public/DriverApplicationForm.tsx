'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { driverApplicationSchema, type DriverApplicationInput } from '@/lib/validations/driver-application';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, Truck, AlertCircle } from 'lucide-react';

const ENDORSEMENT_OPTIONS = [
    { value: 'H', label: 'H - Hazmat' },
    { value: 'N', label: 'N - Tank' },
    { value: 'T', label: 'T - Double/Triple' },
    { value: 'P', label: 'P - Passenger' },
    { value: 'S', label: 'S - School Bus' },
    { value: 'X', label: 'X - Hazmat + Tank' },
];

interface DriverApplicationFormProps {
    slug: string;
}

export default function DriverApplicationForm({ slug }: DriverApplicationFormProps) {
    const router = useRouter();
    const [companyName, setCompanyName] = useState<string | null>(null);
    const [companyLocation, setCompanyLocation] = useState('');
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const form = useForm<DriverApplicationInput>({
        resolver: zodResolver(driverApplicationSchema) as any,
        defaultValues: {
            firstName: '', lastName: '', phone: '', email: '',
            city: '', state: '', cdlNumber: '', cdlClass: '',
            yearsExperience: undefined, endorsements: [],
            previousEmployers: '', referralSource: '', consent: undefined as any,
            honeypot: '',
        },
    });

    useEffect(() => {
        fetch(`/api/public/apply/${slug}`)
            .then((res) => {
                if (!res.ok) throw new Error('Not found');
                return res.json();
            })
            .then((data) => {
                setCompanyName(data.company.name);
                if (data.company.city && data.company.state) {
                    setCompanyLocation(`${data.company.city}, ${data.company.state}`);
                }
            })
            .catch(() => setLoadError('Company not found or applications are not enabled.'));
    }, [slug]);

    const onSubmit = async (values: DriverApplicationInput) => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const res = await fetch(`/api/public/apply/${slug}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Submission failed');
            }
            router.push(`/apply/${slug}/success`);
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'Failed to submit application');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadError) {
        return (
            <Card className="text-center">
                <CardContent className="pt-8 pb-8">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">{loadError}</p>
                </CardContent>
            </Card>
        );
    }

    if (!companyName) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="text-center space-y-2">
                <div className="flex justify-center">
                    <div className="rounded-full bg-primary/10 p-3">
                        <Truck className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <CardTitle className="text-2xl">{companyName}</CardTitle>
                <CardDescription>
                    Driver Application {companyLocation && `- ${companyLocation}`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <PersonalInfoSection form={form} />
                        <CDLInfoSection form={form} />
                        <ExperienceSection form={form} />
                        <ConsentSection form={form} />

                        {/* Honeypot - hidden from humans */}
                        <div className="hidden" aria-hidden="true">
                            <input {...form.register('honeypot')} tabIndex={-1} autoComplete="off" />
                        </div>

                        {submitError && (
                            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                                {submitError}
                            </div>
                        )}

                        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Submit Application
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

function PersonalInfoSection({ form }: { form: any }) {
    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl><Input placeholder="John" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
            <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl><Input type="tel" placeholder="(555) 123-4567" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="john@example.com" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl><Input placeholder="City" {...field} /></FormControl>
                    </FormItem>
                )} />
                <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl><Input placeholder="TX" maxLength={2} {...field} /></FormControl>
                    </FormItem>
                )} />
            </div>
        </div>
    );
}

function CDLInfoSection({ form }: { form: any }) {
    const endorsements = form.watch('endorsements') || [];

    const toggleEndorsement = (value: string) => {
        const current = form.getValues('endorsements') || [];
        form.setValue(
            'endorsements',
            current.includes(value)
                ? current.filter((e: string) => e !== value)
                : [...current, value]
        );
    };

    return (
        <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">CDL Information</h3>
            <FormField control={form.control} name="cdlNumber" render={({ field }) => (
                <FormItem>
                    <FormLabel>CDL Number</FormLabel>
                    <FormControl><Input placeholder="License number" {...field} /></FormControl>
                </FormItem>
            )} />
            <FormField control={form.control} name="cdlClass" render={({ field }) => (
                <FormItem>
                    <FormLabel>CDL Class</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="A">Class A</SelectItem>
                            <SelectItem value="B">Class B</SelectItem>
                            <SelectItem value="C">Class C</SelectItem>
                        </SelectContent>
                    </Select>
                </FormItem>
            )} />
            <div>
                <FormLabel className="text-sm">Endorsements</FormLabel>
                <div className="grid grid-cols-2 gap-2 mt-2">
                    {ENDORSEMENT_OPTIONS.map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                            <Checkbox
                                checked={endorsements.includes(opt.value)}
                                onCheckedChange={() => toggleEndorsement(opt.value)}
                            />
                            {opt.label}
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ExperienceSection({ form }: { form: any }) {
    return (
        <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Experience</h3>
            <FormField control={form.control} name="yearsExperience" render={({ field }) => (
                <FormItem>
                    <FormLabel>Years of CDL Experience</FormLabel>
                    <FormControl><Input type="number" min={0} placeholder="0" {...field} /></FormControl>
                </FormItem>
            )} />
            <FormField control={form.control} name="previousEmployers" render={({ field }) => (
                <FormItem>
                    <FormLabel>Previous Employers</FormLabel>
                    <FormControl><Textarea placeholder="List your previous trucking employers..." rows={3} {...field} /></FormControl>
                </FormItem>
            )} />
            <FormField control={form.control} name="referralSource" render={({ field }) => (
                <FormItem>
                    <FormLabel>How did you hear about us?</FormLabel>
                    <FormControl><Input placeholder="Job board, referral, social media..." {...field} /></FormControl>
                </FormItem>
            )} />
        </div>
    );
}

function ConsentSection({ form }: { form: any }) {
    return (
        <div className="pt-4 border-t">
            <FormField control={form.control} name="consent" render={({ field }) => (
                <FormItem className="flex items-start gap-3">
                    <FormControl>
                        <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-1"
                        />
                    </FormControl>
                    <div className="space-y-1">
                        <FormLabel className="text-sm leading-relaxed">
                            I confirm that the information provided is accurate and I consent to being
                            contacted regarding employment opportunities. *
                        </FormLabel>
                        <FormMessage />
                    </div>
                </FormItem>
            )} />
        </div>
    );
}
