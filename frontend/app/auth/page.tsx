'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { signIn, signUp, confirmSignUp, resendConfirmationCode, saveTokens, isAuthenticated } from '@/lib/auth';

type AuthView = 'signin' | 'signup' | 'confirm';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/design';

  const [view, setView] = useState<AuthView>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace(redirectTo);
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const { idToken, accessToken } = await signIn(email, password);
      saveTokens(idToken, accessToken);
      toast.success('Signed in!');
      router.push(redirectTo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      if (msg.includes('UserNotConfirmedException')) {
        setPendingEmail(email);
        setView('confirm');
        toast.info('Please confirm your email first');
      } else {
        toast.error(msg.replace(/^.*?: /, ''));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) return;
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password);
      // In local mode, signUp auto-logs in (no email confirm needed)
      if (process.env.NEXT_PUBLIC_LOCAL_MODE === 'true') {
        toast.success('Account created! Redirecting...');
        router.push(redirectTo);
        return;
      }
      setPendingEmail(email);
      setView('confirm');
      toast.success('Account created! Check your email for the confirmation code.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign up failed';
      if (msg.includes('UsernameExistsException')) {
        toast.error('An account with this email already exists. Please sign in.');
        setView('signin');
      } else {
        toast.error(msg.replace(/^.*?: /, ''));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setLoading(true);
    try {
      await confirmSignUp(pendingEmail, code);
      toast.success('Email confirmed! Signing you in...');
      const { idToken, accessToken } = await signIn(pendingEmail, password);
      saveTokens(idToken, accessToken);
      router.push(redirectTo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Confirmation failed';
      toast.error(msg.replace(/^.*?: /, ''));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendConfirmationCode(pendingEmail);
      toast.success('Confirmation code resent!');
    } catch {
      toast.error('Failed to resend code');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-indigo-900 to-purple-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-3xl font-black text-white">EPIC<span className="text-orange-400">WEAVE</span></span>
          </Link>
          <p className="text-purple-300 text-sm mt-2">AI-Powered Custom Mythology Apparel</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="pb-4">
            {view === 'signin' && (
              <>
                <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                <CardDescription>Sign in to your EpicWeave account</CardDescription>
              </>
            )}
            {view === 'signup' && (
              <>
                <CardTitle className="text-2xl font-bold">Create account</CardTitle>
                <CardDescription>Join EpicWeave to start creating</CardDescription>
              </>
            )}
            {view === 'confirm' && (
              <>
                <CardTitle className="text-2xl font-bold">Confirm your email</CardTitle>
                <CardDescription>
                  We sent a 6-digit code to <strong>{pendingEmail}</strong>
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent>
            {/* Sign In Form */}
            {view === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Email</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading} size="lg">
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  No account?{' '}
                  <button type="button" onClick={() => setView('signup')} className="text-primary font-medium hover:underline">
                    Create one
                  </button>
                </p>
              </form>
            )}

            {/* Sign Up Form */}
            {view === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Email</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Password</label>
                  <Input
                    type="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading} size="lg">
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button type="button" onClick={() => setView('signin')} className="text-primary font-medium hover:underline">
                    Sign in
                  </button>
                </p>
              </form>
            )}

            {/* Confirm Email Form */}
            {view === 'confirm' && (
              <form onSubmit={handleConfirm} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Confirmation Code</label>
                  <Input
                    type="text"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                    className="text-center text-2xl tracking-widest font-mono"
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading || code.length !== 6} size="lg">
                  {loading ? 'Confirming...' : 'Confirm Email'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Didn&apos;t receive it?{' '}
                  <button type="button" onClick={handleResend} className="text-primary font-medium hover:underline">
                    Resend code
                  </button>
                </p>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-purple-400 text-xs mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
