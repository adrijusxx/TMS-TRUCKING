'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, ArrowRight, Loader2, Shield, Zap, BarChart3 } from 'lucide-react';
import Link from 'next/link';

const features = [
  { icon: Zap, label: 'Real-time dispatch & tracking' },
  { icon: Shield, label: 'DOT compliance tools' },
  { icon: BarChart3, label: 'Fleet analytics & reporting' },
];

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRegistered, setShowRegistered] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    const registered = params.get('registered');
    
    if (registered === 'true') {
      setShowRegistered(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    if (errorParam) {
      setError(errorParam === 'CredentialsSignin' 
        ? 'Invalid email or password' 
        : 'An error occurred during sign in');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);
    setShowRegistered(false);

    try {
      const params = new URLSearchParams(window.location.search);
      const callbackUrl = params.get('callbackUrl') || '/dashboard';
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      
      const fullCallbackUrl = basePath && !callbackUrl.startsWith(basePath)
        ? `${basePath}${callbackUrl}`
        : callbackUrl;

      try {
        const sessionTest = await fetch(`${basePath}/api/auth/session`, {
          method: 'GET',
          credentials: 'include',
        });
        
        if (!sessionTest.ok && sessionTest.status !== 401) {
          setError(`Authentication server error: ${sessionTest.status}`);
          setIsLoading(false);
          return;
        }
      } catch {
        setError('Cannot connect to authentication server.');
        setIsLoading(false);
        return;
      }

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl: fullCallbackUrl,
      });

      if (result?.error) {
        let errorMessage = 'An error occurred during sign in';
        
        if (result.error === 'CredentialsSignin') {
          errorMessage = 'Invalid email or password';
        } else if (result.error === 'Configuration') {
          errorMessage = 'Authentication configuration error. Please contact support.';
        } else {
          errorMessage = `Sign in error: ${result.error}`;
        }
        
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      if (!result) {
        setError('No response from authentication server.');
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        window.location.href = fullCallbackUrl;
      }
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
            Welcome Back
          </h1>
          
          <p className="text-slate-400 text-lg mb-8">
            Sign in to access your fleet management dashboard.
          </p>
          
          <ul className="space-y-4">
            {features.map((item, idx) => (
              <li key={idx} className="flex items-center gap-3 text-slate-300">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <item.icon className="h-4 w-4 text-purple-400" />
                </div>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="relative z-10 text-sm text-slate-500">
          <p>Secure login • 256-bit encryption</p>
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
            <h2 className="text-2xl font-bold text-white mb-2">Sign In</h2>
            <p className="text-slate-400">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
            {showRegistered && (
              <div className="p-3 text-sm text-emerald-400 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                Account created successfully! Please sign in.
              </div>
            )}
            
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-500/10 rounded-lg border border-red-500/20">
                {error}
              </div>
            )}

            <div className="p-3 text-xs text-slate-400 bg-slate-900/50 rounded-lg border border-slate-800">
              <strong>Demo:</strong> Use any seeded email with password <code className="text-purple-400 bg-slate-800 px-1.5 py-0.5 rounded">password123</code>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                autoComplete="username"
                {...register('email')}
                disabled={isLoading}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500"
              />
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                {...register('password')}
                disabled={isLoading}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500"
              />
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
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
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-center text-sm text-slate-400">
              Don't have an account?{' '}
              <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium">
                Create one
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
