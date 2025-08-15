'use client';

import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resetPassword, updatePassword } from '@/app/actions/auth';
import { Sparkles, Eye, EyeOff, Mail, Lock, XCircle, CheckCircle, ShieldCheck, Users, RefreshCw, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
];

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  
  // Check if this is a password reset confirmation (has access_token)
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const isResetConfirmation = accessToken && refreshToken;

  // Email validation with helpful guidance
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
    setNewPassword(e.target.value);
    if (!passwordTouched) setPasswordTouched(true);
    if (error) setError('');
  };

  const getPasswordStrength = () => {
    const metRequirements = passwordRequirements.filter(req => req.test(newPassword)).length;
    if (metRequirements < 2) return { level: 'weak', color: 'text-destructive', bgColor: 'bg-destructive' };
    if (metRequirements < 4) return { level: 'medium', color: 'text-gold-600', bgColor: 'bg-gold-400' };
    return { level: 'strong', color: 'text-green-600', bgColor: 'bg-green-400' };
  };

  const isEmailFormValid = () => email && !emailError;
  const isPasswordFormValid = () => passwordRequirements.every(req => req.test(newPassword));

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailFormValid() || isPending) return;

    startTransition(async () => {
      const result = await resetPassword(email);
      
      if (result.error) {
        setError(result.error);
      } else {
        setSuccessMessage(result.message || 'Check your email for reset instructions');
        setEmail(''); // Clear form for security
      }
    });
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordFormValid() || isPending) return;

    startTransition(async () => {
      const result = await updatePassword(newPassword, accessToken!, refreshToken!);
      
      if (result.error) {
        setError(result.error);
      } else {
        setSuccessMessage('Password updated successfully! You will be redirected shortly.');
        // The action handles redirect after successful update
      }
    });
  };

  // Success state for reset request
  if (successMessage && !isResetConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 via-background to-plum-50/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="card-elevated border-0 shadow-strong">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="space-y-6">
                {/* Success icon with animation */}
                <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-plum-600 to-plum-800 flex items-center justify-center animate-scale-in active">
                  <Mail className="h-8 w-8 text-white" />
                </div>

                {/* Success headline */}
                <div className="space-y-3">
                  <h1 className="font-serif text-2xl font-bold text-gradient-primary">
                    Check Your Email
                  </h1>
                  <p className="text-muted-foreground leading-relaxed">
                    We've sent password reset instructions to your email address if an account exists.
                  </p>
                </div>

                {/* Reassuring next steps */}
                <div className="bg-gradient-to-r from-plum-50 to-cream-50 rounded-lg p-4 space-y-3">
                  <h3 className="font-medium text-plum-900">What to do next:</h3>
                  <div className="space-y-2 text-sm text-plum-700">
                    <div className="flex items-start space-x-2">
                      <Mail className="h-4 w-4 text-plum-600 flex-shrink-0 mt-0.5" />
                      <span>Check your email inbox for reset instructions</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <RefreshCw className="h-4 w-4 text-plum-600 flex-shrink-0 mt-0.5" />
                      <span>The link will expire in 1 hour for security</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <ShieldCheck className="h-4 w-4 text-plum-600 flex-shrink-0 mt-0.5" />
                      <span>Check spam folder if you don't see it</span>
                    </div>
                  </div>
                </div>

                {/* Back to login option */}
                <div className="space-y-4">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/auth/login">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Sign In
                    </Link>
                  </Button>
                  
                  <p className="text-xs text-muted-foreground">
                    Didn't receive the email?{' '}
                    <button
                      onClick={() => {
                        setSuccessMessage('');
                        setError('');
                      }}
                      className="text-plum-600 hover:text-plum-700 font-medium underline"
                    >
                      Try again
                    </button>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Password update form (when user clicks reset link)
  if (isResetConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 via-background to-plum-50/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Brand header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-plum-600 to-plum-800 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="font-serif text-xl font-bold text-gradient-primary">ScentMatch</span>
            </Link>

            {/* Security reassurance */}
            <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-plum-600" />
              <span>Secure password reset</span>
            </div>
          </div>

          <Card className="card-elevated border-0 shadow-strong">
            <CardHeader className="text-center pb-4">
              <CardTitle className="font-serif text-2xl text-gradient-primary">
                Create New Password
              </CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Choose a strong password to keep your fragrance collection secure
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                {/* Error display */}
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start space-x-2">
                    <XCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-destructive">
                      <p className="font-medium">{error}</p>
                      {error.includes('expired') && (
                        <p className="mt-1 text-xs">
                          <Link 
                            href="/auth/reset" 
                            className="underline font-medium hover:text-destructive/80"
                          >
                            Request a new reset link
                          </Link>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Success message */}
                {successMessage && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-800 font-medium">{successMessage}</p>
                  </div>
                )}

                {/* Password field with strength indicator */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium text-foreground">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={handlePasswordChange}
                      className="pl-10 pr-10 h-12 touch-target"
                      placeholder="Create a secure password"
                      autoComplete="new-password"
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

                  {/* Password strength indicator */}
                  {passwordTouched && newPassword && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Password strength:</span>
                        <span className={cn("text-xs font-medium", getPasswordStrength().color)}>
                          {getPasswordStrength().level.charAt(0).toUpperCase() + getPasswordStrength().level.slice(1)}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1">
                        <div 
                          className={cn("h-1 rounded-full transition-all duration-300", getPasswordStrength().bgColor)}
                          style={{ width: `${(passwordRequirements.filter(req => req.test(newPassword)).length / 4) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Password requirements */}
                  {passwordTouched && (
                    <div className="space-y-1">
                      {passwordRequirements.map((req, index) => {
                        const isMet = req.test(newPassword);
                        return (
                          <div key={index} className="flex items-center space-x-2 text-xs">
                            {isMet ? (
                              <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                            ) : (
                              <div className="h-3 w-3 rounded-full border border-muted-foreground/30 flex-shrink-0" />
                            )}
                            <span className={isMet ? "text-green-600" : "text-muted-foreground"}>
                              {req.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <Button 
                  type="submit" 
                  className="w-full h-12 touch-target font-medium"
                  variant="premium"
                  disabled={!isPasswordFormValid() || isPending}
                >
                  {isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Updating password...</span>
                    </div>
                  ) : (
                    <span>Update Password</span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Initial reset request form
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

          {/* Trust signals */}
          <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground mb-6">
            <div className="flex items-center space-x-1">
              <ShieldCheck className="h-4 w-4 text-plum-600" />
              <span>Secure Reset</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-gold-600" />
              <span>Trusted by 10,000+</span>
            </div>
          </div>
        </div>

        <Card className="card-elevated border-0 shadow-strong">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-serif text-2xl text-gradient-primary">
              Reset Your Password
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              Don't worry, it happens! We'll send you secure instructions to regain access to your fragrance collection.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleResetRequest} className="space-y-4">
              {/* Error display */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start space-x-2">
                  <XCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
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

              {/* Submit button */}
              <Button 
                type="submit" 
                className="w-full h-12 touch-target font-medium"
                variant="premium"
                disabled={!isEmailFormValid() || isPending}
              >
                {isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending reset link...</span>
                  </div>
                ) : (
                  <span>Send Reset Instructions</span>
                )}
              </Button>
            </form>

            {/* Additional options */}
            <div className="space-y-4 pt-4 border-t border-border/40">
              {/* Security reassurance */}
              <div className="bg-gradient-to-r from-plum-50 to-cream-50 rounded-lg p-3 text-center">
                <p className="text-xs text-plum-900 font-medium mb-1">Security First</p>
                <p className="text-xs text-plum-700">
                  Reset links expire in 1 hour and can only be used once for your protection.
                </p>
              </div>

              {/* Back to login */}
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Remember your password? </span>
                <Link 
                  href="/auth/login" 
                  className="text-plum-600 hover:text-plum-700 font-medium underline"
                >
                  Sign in instead
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}