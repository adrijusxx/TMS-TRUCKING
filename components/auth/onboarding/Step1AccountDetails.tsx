'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Loader2, Check, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { z } from 'zod';
import { useState, useEffect, useCallback } from 'react';
import { apiUrl, cn } from '@/lib/utils';

// Simplified schema without CAPTCHA for testing
const step1Schema = z.object({
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type Step1Input = z.infer<typeof step1Schema>;

interface Step1AccountDetailsProps {
    onComplete: (data: Step1Input & { turnstileToken?: string }) => void;
    isLoading?: boolean;
    defaultValues?: Partial<Step1Input>;
}

// Email availability check status
type EmailStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

export function Step1AccountDetails({
    onComplete,
    isLoading,
    defaultValues
}: Step1AccountDetailsProps) {
    const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle');
    const [emailMessage, setEmailMessage] = useState<string>('');
    const [debouncedEmail, setDebouncedEmail] = useState('');

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<Step1Input>({
        resolver: zodResolver(step1Schema),
        defaultValues: {
            firstName: defaultValues?.firstName || '',
            lastName: defaultValues?.lastName || '',
            email: defaultValues?.email || '',
            password: '',
            confirmPassword: '',
        },
    });

    const emailValue = watch('email');

    // Debounce email input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedEmail(emailValue);
        }, 500);
        return () => clearTimeout(timer);
    }, [emailValue]);

    // Check email availability when debounced email changes
    const checkEmailAvailability = useCallback(async (email: string) => {
        if (!email || !email.includes('@')) {
            setEmailStatus('idle');
            return;
        }

        setEmailStatus('checking');

        try {
            const response = await fetch(apiUrl('/api/auth/check-email'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.available) {
                setEmailStatus('available');
                setEmailMessage('Email is available');
            } else {
                setEmailStatus('taken');
                setEmailMessage(data.message || 'This email is already registered');
            }
        } catch (error) {
            setEmailStatus('error');
            setEmailMessage('Unable to verify email');
        }
    }, []);

    useEffect(() => {
        if (debouncedEmail) {
            checkEmailAvailability(debouncedEmail);
        }
    }, [debouncedEmail, checkEmailAvailability]);

    const onSubmit = (data: Step1Input) => {
        // Block submission if email is taken
        if (emailStatus === 'taken') {
            return;
        }
        // Pass empty token - server handles missing CAPTCHA gracefully
        onComplete({ ...data, turnstileToken: 'skip-for-testing' });
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-1">Create Your Account</h2>
                <p className="text-slate-400 text-sm">Let's start with your details</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="firstName" className="text-slate-300 text-sm">First Name</Label>
                        <Input
                            id="firstName"
                            placeholder="John"
                            {...register('firstName')}
                            disabled={isLoading}
                            className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 h-9"
                        />
                        {errors.firstName && (
                            <p className="text-xs text-red-400">{errors.firstName.message}</p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="lastName" className="text-slate-300 text-sm">Last Name</Label>
                        <Input
                            id="lastName"
                            placeholder="Doe"
                            {...register('lastName')}
                            disabled={isLoading}
                            className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 h-9"
                        />
                        {errors.lastName && (
                            <p className="text-xs text-red-400">{errors.lastName.message}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-slate-300 text-sm">Email</Label>
                    <div className="relative">
                        <Input
                            id="email"
                            type="email"
                            placeholder="john@company.com"
                            {...register('email')}
                            disabled={isLoading}
                            className={cn(
                                "bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 h-9 pr-10",
                                emailStatus === 'taken' && "border-red-500 focus:border-red-500",
                                emailStatus === 'available' && "border-green-500 focus:border-green-500"
                            )}
                        />
                        {/* Status indicator */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {emailStatus === 'checking' && (
                                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            )}
                            {emailStatus === 'available' && (
                                <Check className="h-4 w-4 text-green-500" />
                            )}
                            {emailStatus === 'taken' && (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                        </div>
                    </div>
                    {errors.email && (
                        <p className="text-xs text-red-400">{errors.email.message}</p>
                    )}
                    {emailStatus === 'taken' && (
                        <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {emailMessage}. <Link href="/login" className="text-purple-400 hover:underline">Sign in instead?</Link>
                        </p>
                    )}
                    {emailStatus === 'available' && (
                        <p className="text-xs text-green-400 flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            {emailMessage}
                        </p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-slate-300 text-sm">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="At least 8 characters"
                        {...register('password')}
                        disabled={isLoading}
                        className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 h-9"
                    />
                    {errors.password && (
                        <p className="text-xs text-red-400">{errors.password.message}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-slate-300 text-sm">Confirm Password</Label>
                    <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        {...register('confirmPassword')}
                        disabled={isLoading}
                        className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 h-9"
                    />
                    {errors.confirmPassword && (
                        <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
                    )}
                </div>

                <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 h-10"
                    disabled={isLoading || emailStatus === 'taken'}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                        </>
                    ) : (
                        <>
                            Continue
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>

                <p className="text-center text-sm text-slate-400">
                    Already have an account?{' '}
                    <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                        Sign in
                    </Link>
                </p>
            </form>
        </div>
    );
}
