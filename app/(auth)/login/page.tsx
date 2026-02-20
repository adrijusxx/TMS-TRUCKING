'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, ArrowRight, Loader2, Shield, Zap, BarChart3, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const features = [
  { icon: Zap, label: 'Real-time dispatch & tracking', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { icon: Shield, label: 'DOT compliance tools', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { icon: BarChart3, label: 'Fleet analytics & reporting', color: 'text-blue-400', bg: 'bg-blue-400/10' },
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
    <div className="min-h-screen flex bg-slate-950 selection:bg-purple-500/30">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12">
        {/* Dynamic Animated Background */}
        <div className="absolute inset-0 bg-slate-950 z-0">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-purple-600/20 blur-[120px] rounded-full"
          />
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 blur-[100px] rounded-full"
          />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50 z-0" />
        </div>

        <div className="relative z-10 w-full max-w-lg mx-auto flex-1 flex flex-col justify-center">
          <Link href="/" className="flex items-center space-x-3 mb-16 inline-block">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/20">
              <Truck className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">TMS Pro</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              Welcome back to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">your command center.</span>
            </h1>

            <p className="text-slate-300 text-lg mb-12 font-light leading-relaxed">
              Sign in to access your fleet operations, monitor active loads, and manage your drivers with zero friction.
            </p>

            <ul className="space-y-6">
              {features.map((item, idx) => (
                <motion.li
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + (idx * 0.1) }}
                  key={idx}
                  className="flex items-center gap-4 text-slate-200"
                >
                  <div className={`p-3 rounded-xl ${item.bg} border border-white/5`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <span className="font-medium tracking-wide">{item.label}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        <div className="relative z-10 w-full max-w-lg mx-auto text-sm text-slate-500 font-medium">
          <p className="flex items-center gap-2">
            <Shield className="w-4 h-4" /> Secure login • 256-bit encryption
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10 bg-slate-950/50 backdrop-blur-xl border-l border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-10">
            <Link href="/" className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/20">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">TMS Pro</span>
            </Link>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Sign In</h2>
            <p className="text-slate-400 font-light text-lg">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
            {showRegistered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="p-4 text-sm font-medium text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" /> Account created successfully! Please sign in.
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="p-4 text-sm font-medium text-red-400 bg-red-500/10 rounded-xl border border-red-500/20"
              >
                {error}
              </motion.div>
            )}



            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 font-medium ml-1">Work Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                autoComplete="username"
                {...register('email')}
                disabled={isLoading}
                className="h-12 bg-white/[0.03] border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500 focus:bg-white/[0.05] transition-colors rounded-xl font-medium"
              />
              {errors.email && (
                <p className="text-xs text-red-400 ml-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label htmlFor="password" className="text-slate-300 font-medium">Password</Label>
                <Link href="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
                disabled={isLoading}
                className="h-12 bg-white/[0.03] border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500 focus:bg-white/[0.05] transition-colors rounded-xl font-medium tracking-widest"
              />
              {errors.password && (
                <p className="text-xs text-red-400 ml-1">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold tracking-wide shadow-lg shadow-purple-900/40 border border-purple-500/30 group transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In to Workspace
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            <p className="text-center text-sm text-slate-400 font-medium">
              Don't have an account?{' '}
              <Link href="/register" className="text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/10 px-2 py-1 rounded-md ml-1">
                Create one
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
