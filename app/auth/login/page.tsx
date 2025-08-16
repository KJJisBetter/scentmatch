'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { signIn } from '@/app/actions/auth';
import { Sparkles, Eye, EyeOff, Mail, Lock, XCircle, ShieldCheck, Users, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  // Helpful email validation
  const validateEmail = (email: string) => {
    if (!email) return '';
    if (!email.includes('@')) return 'Email address needs an @ symbol';
    if (!email.includes('.')) return 'Email address needs a domain (like .com)';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(validateEmail(value));
    if (error) setError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError('');
  };

  const isFormValid = () => {
    return email && !emailError && password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid() || isPending) return;

    startTransition(async () => {
      const result = await signIn(email, password);
      
      if (result.error) {
        setError(result.error);
      } else {
        // Success! Smooth transition to dashboard
        router.push(redirectTo);
        router.refresh();
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-background to-plum-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand header with trust signals */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-plum-600 to-plum-800 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-serif text-xl font-bold text-gradient-primary">ScentMatch</span>
          </Link>

          {/* Social proof and trust signals */}
          <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground mb-6">
            <div className="flex items-center space-x-1">
              <ShieldCheck className="h-4 w-4 text-plum-600" />
              <span>Secure Login</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-gold-600" />
              <span>10,000+ Members</span>
            </div>
          </div>
        </div>

        <Card className="card-elevated border-0 shadow-strong">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-serif text-2xl text-gradient-primary">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              Continue your fragrance discovery journey
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Global error display with helpful guidance */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start space-x-2">
                  <XCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-destructive">
                    <p className="font-medium">{error}</p>
                    {error.includes('Invalid email or password') && (
                      <p className="mt-1 text-xs">
                        Double-check your credentials or{' '}
                        <Link 
                          href="/auth/reset" 
                          className="underline font-medium hover:text-destructive/80"
                        >
                          reset your password
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    className={cn(
                      "pl-10 h-12 touch-target transition-all duration-200",
                      emailError && email ? "border-destructive focus-visible:ring-destructive/20" : ""
                    )}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    disabled={isPending}
                  />
                </div>
                {emailError && (
                  <p className="text-sm text-destructive flex items-center space-x-1">
                    <XCircle className="h-3 w-3 flex-shrink-0" />
                    <span>{emailError}</span>
                  </p>
                )}
              </div>

              {/* Password field with forgot password link */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  <Link 
                    href="/auth/reset" 
                    className="text-xs text-plum-600 hover:text-plum-700 font-medium underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    className="pl-10 pr-10 h-12 touch-target"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 touch-target text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    disabled={isPending}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me option with clear explanation */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  disabled={isPending}
                />
                <Label 
                  htmlFor="remember" 
                  className="text-sm text-foreground cursor-pointer select-none"
                >
                  Remember me on this device
                </Label>
              </div>

              {/* Submit button with loading state */}
              <Button 
                type="submit" 
                className="w-full h-12 touch-target font-medium"
                variant="premium"
                disabled={!isFormValid() || isPending}
              >
                {isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing you in...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>

            {/* Additional options and security */}
            <div className="space-y-4 pt-4 border-t border-border/40">
              {/* Security reassurance */}
              <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground">
                <ShieldCheck className="h-3 w-3 text-plum-600" />
                <span>Your login is encrypted and secure</span>
              </div>

              {/* Sign up option */}
              <div className="text-center text-sm">
                <span className="text-muted-foreground">New to ScentMatch? </span>
                <Link 
                  href="/auth/signup" 
                  className="text-plum-600 hover:text-plum-700 font-medium underline"
                >
                  Create your account
                </Link>
              </div>
            </div>

            {/* Quick value reminder for hesitant users */}
            <div className="bg-gradient-to-r from-plum-50 to-cream-50 rounded-lg p-4 text-center">
              <p className="text-sm text-plum-900 font-medium mb-2">
                Ready to continue discovering?
              </p>
              <div className="flex items-center justify-center space-x-4 text-xs text-plum-700">
                <div className="flex items-center space-x-1">
                  <Sparkles className="h-3 w-3" />
                  <span>AI recommendations</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>•</span>
                  <span>Sample discovery</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}