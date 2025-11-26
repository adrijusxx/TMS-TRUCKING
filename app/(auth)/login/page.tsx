'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for error from query params (e.g., from /api/auth/error redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    if (errorParam) {
      setError(errorParam === 'CredentialsSignin' 
        ? 'Invalid email or password' 
        : 'An error occurred during sign in');
      // Clean up URL
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

    try {
      // Get callbackUrl from query params or default to dashboard
      const params = new URLSearchParams(window.location.search);
      const callbackUrl = params.get('callbackUrl') || '/dashboard';
      
      // Get basePath from environment variable (not from URL path)
      // For subdomain deployment (tms.vaidera.eu), basePath should be empty
      // For subdirectory deployment (domain.com/tms), basePath should be '/tms'
      // Don't detect from URL as it may already have basePath appended
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      
      // Ensure callbackUrl includes basePath
      const fullCallbackUrl = basePath && !callbackUrl.startsWith(basePath)
        ? `${basePath}${callbackUrl}`
        : callbackUrl;
      
      console.log('Attempting sign in with:', { 
        email: data.email, 
        callbackUrl: fullCallbackUrl,
        basePath 
      });

      // Test NextAuth API endpoint before attempting sign in
      try {
        const sessionTest = await fetch(`${basePath}/api/auth/session`, {
          method: 'GET',
          credentials: 'include',
        });
        
        if (!sessionTest.ok && sessionTest.status !== 401) {
          console.error('NextAuth API not responding:', sessionTest.status, sessionTest.statusText);
          setError(`Authentication server error: ${sessionTest.status} ${sessionTest.statusText}`);
          setIsLoading(false);
          return;
        }
      } catch (fetchError) {
        console.error('Failed to reach NextAuth API:', fetchError);
        setError('Cannot connect to authentication server. Please check your connection.');
        setIsLoading(false);
        return;
      }

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl: fullCallbackUrl,
      });

      console.log('Sign in result:', result);

      if (result?.error) {
        console.error('Sign in error:', result.error);
        let errorMessage = 'An error occurred during sign in';
        
        if (result.error === 'CredentialsSignin') {
          errorMessage = 'Invalid email or password';
        } else if (result.error === 'Configuration') {
          errorMessage = 'Authentication server configuration error. Please contact your administrator. (Missing NEXTAUTH_SECRET)';
        } else {
          errorMessage = `Sign in error: ${result.error}`;
        }
        
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      if (!result) {
        console.error('No result from signIn - this usually means NextAuth API route is not responding');
        setError('No response from authentication server. Please check server logs.');
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        // Use the callbackUrl we already calculated above
        // Debug logging (remove in production)
        if (process.env.NODE_ENV === 'development') {
          console.log('Login redirect:', { callbackUrl: fullCallbackUrl, basePath });
        }
        
        // Use window.location for a hard redirect to ensure session is set
        window.location.href = fullCallbackUrl;
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary p-3">
              <Truck className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">TMS Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                {error}
                {error.includes('Configuration') && (
                  <div className="mt-2 pt-2 border-t border-destructive/20">
                    <p className="text-xs mb-2">Try clearing your browser cookies or:</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await fetch('/api/auth/clear-session', { method: 'POST' });
                          window.location.reload();
                        } catch (e) {
                          console.error('Failed to clear session:', e);
                        }
                      }}
                      className="w-full"
                    >
                      Clear Session Cookies
                    </Button>
                  </div>
                )}
              </div>
            )}
            <div className="p-3 text-xs text-muted-foreground bg-muted/50 rounded-md border">
              <strong>Demo Credentials:</strong> All passwords are <code className="text-xs bg-background px-1 py-0.5 rounded">password123</code>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                autoComplete="username"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                {...register('password')}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Register here
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

