'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { onboardingStep2Schema, type OnboardingStep2Input } from '@/lib/validations/onboarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Loader2, Building2 } from 'lucide-react';

interface Step2CompanyDetailsProps {
    onComplete: (data: OnboardingStep2Input) => void;
    isLoading?: boolean;
    defaultValues?: Partial<OnboardingStep2Input>;
}

export function Step2CompanyDetails({
    onComplete,
    isLoading,
    defaultValues
}: Step2CompanyDetailsProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<OnboardingStep2Input>({
        resolver: zodResolver(onboardingStep2Schema),
        defaultValues: {
            companyName: defaultValues?.companyName || '',
            dotNumber: defaultValues?.dotNumber || '',
            mcNumber: defaultValues?.mcNumber || '',
            phone: defaultValues?.phone || '',
        },
    });

    return (
        <div>
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-5 w-5 text-purple-400" />
                    <h2 className="text-2xl font-bold text-white">Company Details</h2>
                </div>
                <p className="text-slate-400 text-sm">Tell us about your trucking company</p>
            </div>

            <form onSubmit={handleSubmit(onComplete)} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="companyName" className="text-slate-300 text-sm">Company Name</Label>
                    <Input
                        id="companyName"
                        placeholder="Acme Trucking LLC"
                        {...register('companyName')}
                        disabled={isLoading}
                        className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 h-9"
                    />
                    {errors.companyName && (
                        <p className="text-xs text-red-400">{errors.companyName.message}</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="dotNumber" className="text-slate-300 text-sm">DOT Number</Label>
                        <Input
                            id="dotNumber"
                            placeholder="1234567"
                            {...register('dotNumber')}
                            disabled={isLoading}
                            className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 h-9"
                        />
                        {errors.dotNumber && (
                            <p className="text-xs text-red-400">{errors.dotNumber.message}</p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="mcNumber" className="text-slate-300 text-sm">MC Number</Label>
                        <Input
                            id="mcNumber"
                            placeholder="MC-123456"
                            {...register('mcNumber')}
                            disabled={isLoading}
                            className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 h-9"
                        />
                        {errors.mcNumber && (
                            <p className="text-xs text-red-400">{errors.mcNumber.message}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-slate-300 text-sm">
                        Phone <span className="text-slate-500">(Optional)</span>
                    </Label>
                    <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        {...register('phone')}
                        disabled={isLoading}
                        className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 h-9"
                    />
                    {errors.phone && (
                        <p className="text-xs text-red-400">{errors.phone.message}</p>
                    )}
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 h-10"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                Continue
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
