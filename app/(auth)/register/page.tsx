'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiUrl } from '@/lib/utils';

const benefits = [
  'Full load & dispatch management',
  'Real-time GPS fleet tracking',
  'Driver settlements & invoicing',
  'Safety & DOT compliance tools',
];

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          companyName: data.companyName,
          dotNumber: data.dotNumber,
          mcNumber: data.mcNumber,
          phone: data.phone,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error?.details && Array.isArray(result.error.details)) {
          const errorMessages = result.error.details
            .map((err: { path: string[]; message: string }) => `${err.path.join('.')}: ${err.message}`)
            .join(', ');
          setError(errorMessages || result.error?.message || 'Registration failed');
        } else {
          setError(result.error?.message || 'Registration failed');
        }
        setIsLoading(false);
        return;
      }

      router.push('/login?registered=true');
    } catch {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-900/40 via-slate-900 to-slate-950 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center space-x-2 mb-16">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">TMS Pro</span>
          </Link>

          <h1 className="text-4xl font-bold text-white mb-4">
            Start Managing Your Fleet
            <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent block mt-1">
              Like a Pro
            </span>
          </h1>

          <p className="text-slate-400 text-lg mb-8">
            Join trucking companies that trust TMS Pro for their operations.
          </p>

          <ul className="space-y-4">
            {benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-center gap-3 text-slate-300">
                <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-sm text-slate-500">
          <p>14-day free trial • No credit card required</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">TMS Pro</span>
            </Link>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Create Your Account</h2>
            <p className="text-slate-400">Start your 14-day free trial</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-500/10 rounded-lg border border-red-500/20">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-slate-300">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  {...register('firstName')}
                  disabled={isLoading}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500"
                />
                {errors.firstName && (
                  <p className="text-xs text-red-400">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-slate-300">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...register('lastName')}
                  disabled={isLoading}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500"
                />
                {errors.lastName && (
                  <p className="text-xs text-red-400">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-slate-300">Company Name</Label>
              <Input
                id="companyName"
                placeholder="Acme Trucking LLC"
                {...register('companyName')}
                disabled={isLoading}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500"
              />
              {errors.companyName && (
                <p className="text-xs text-red-400">{errors.companyName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dotNumber" className="text-slate-300">DOT Number</Label>
                <Input
                  id="dotNumber"
                  placeholder="1234567"
                  {...register('dotNumber')}
                  disabled={isLoading}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500"
                />
                {errors.dotNumber && (
                  <p className="text-xs text-red-400">{errors.dotNumber.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="mcNumber" className="text-slate-300">MC Number</Label>
                <Input
                  id="mcNumber"
                  placeholder="MC-123456"
                  {...register('mcNumber')}
                  disabled={isLoading}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500"
                />
                {errors.mcNumber && (
                  <p className="text-xs text-red-400">{errors.mcNumber.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@company.com"
                {...register('email')}
                disabled={isLoading}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500"
              />
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-300">Phone <span className="text-slate-500">(Optional)</span></Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                {...register('phone')}
                disabled={isLoading}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500"
              />
              {errors.phone && (
                <p className="text-xs text-red-400">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                {...register('password')}
                disabled={isLoading}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500"
              />
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                {...register('confirmPassword')}
                disabled={isLoading}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
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

            <p className="text-center text-xs text-slate-500">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-slate-400 hover:text-white">Terms</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-slate-400 hover:text-white">Privacy Policy</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
