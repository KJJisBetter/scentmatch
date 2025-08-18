'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUp } from '@/app/actions/auth';
import {
  Sparkles,
  Eye,
  EyeOff,
  Mail,
  Lock,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: p => p.length >= 8 },
  { label: 'One uppercase letter', test: p => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: p => /[a-z]/.test(p) },
  { label: 'One number', test: p => /\d/.test(p) },
];

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Real-time email validation with helpful guidance
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
    if (error && error.includes('email')) setError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (!passwordTouched) setPasswordTouched(true);
    if (error && error.includes('password')) setError('');
  };

  const getPasswordStrength = () => {
    const metRequirements = passwordRequirements.filter(req =>
      req.test(password)
    ).length;
    if (metRequirements < 2)
      return {
        level: 'weak',
        color: 'text-destructive',
        bgColor: 'bg-destructive',
      };
    if (metRequirements < 4)
      return {
        level: 'medium',
        color: 'text-gold-600',
        bgColor: 'bg-gold-400',
      };
    return {
      level: 'strong',
      color: 'text-green-600',
      bgColor: 'bg-green-400',
    };
  };

  const isFormValid = () => {
    return (
      email &&
      !emailError &&
      passwordRequirements.every(req => req.test(password))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid() || isPending) return;

    setIsSubmitted(true);
    startTransition(async () => {
      const result = await signUp(email, password);

      if (result.error) {
        setError(result.error);
        setIsSubmitted(false);
      } else {
        // Success! Redirect to login for dev workflow
        if (result.redirect) {
          router.push(result.redirect);
        } else {
          router.push('/auth/signin');
        }
      }
    });
  };

  // Note: Removed email verification UI for dev workflow - redirects directly to login

  return (
    <div className='min-h-screen bg-gradient-to-br from-cream-50 via-background to-plum-50/30 flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        {/* Brand header with trust signals */}
        <div className='text-center mb-8'>
          <Link href='/' className='inline-flex items-center space-x-2 mb-4'>
            <div className='h-8 w-8 rounded-lg bg-gradient-to-br from-plum-600 to-plum-800 flex items-center justify-center'>
              <Sparkles className='h-5 w-5 text-white' />
            </div>
            <span className='font-serif text-xl font-bold text-gradient-primary'>
              ScentMatch
            </span>
          </Link>

          {/* Social proof and trust signals */}
          <div className='flex items-center justify-center space-x-4 text-xs text-muted-foreground mb-6'>
            <div className='flex items-center space-x-1'>
              <ShieldCheck className='h-4 w-4 text-plum-600' />
              <span>Secure & Private</span>
            </div>
            <div className='flex items-center space-x-1'>
              <Users className='h-4 w-4 text-gold-600' />
              <span>10,000+ Users</span>
            </div>
          </div>
        </div>

        <Card className='card-elevated border-0 shadow-strong'>
          <CardHeader className='text-center pb-4'>
            <CardTitle className='font-serif text-2xl text-gradient-primary'>
              Discover Your Perfect Scent
            </CardTitle>
            <CardDescription className='text-base leading-relaxed'>
              Join the AI-powered fragrance discovery platform that finds scents
              you'll actually love
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-6'>
            <form onSubmit={handleSubmit} className='space-y-4'>
              {/* Global error display */}
              {error && (
                <div className='bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start space-x-2'>
                  <XCircle className='h-4 w-4 text-destructive flex-shrink-0 mt-0.5' />
                  <p className='text-sm text-destructive'>{error}</p>
                </div>
              )}

              {/* Email field with helpful validation */}
              <div className='space-y-2'>
                <Label
                  htmlFor='email'
                  className='text-sm font-medium text-foreground'
                >
                  Email Address
                </Label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                  <Input
                    id='email'
                    type='email'
                    value={email}
                    onChange={handleEmailChange}
                    className={cn(
                      'pl-10 h-12 touch-target transition-all duration-200',
                      emailError && email
                        ? 'border-destructive focus-visible:ring-destructive/20'
                        : '',
                      email && !emailError
                        ? 'border-green-500 focus-visible:ring-green-500/20'
                        : ''
                    )}
                    placeholder='you@example.com'
                    autoComplete='email'
                    required
                    disabled={isPending}
                  />
                  {email && !emailError && (
                    <CheckCircle className='absolute right-3 top-3 h-4 w-4 text-green-500' />
                  )}
                </div>
                {emailError && (
                  <p className='text-sm text-destructive flex items-center space-x-1'>
                    <XCircle className='h-3 w-3 flex-shrink-0' />
                    <span>{emailError}</span>
                  </p>
                )}
              </div>

              {/* Password field with strength indicator */}
              <div className='space-y-2'>
                <Label
                  htmlFor='password'
                  className='text-sm font-medium text-foreground'
                >
                  Create Password
                </Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                  <Input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    className='pl-10 pr-10 h-12 touch-target'
                    placeholder='Create a secure password'
                    autoComplete='new-password'
                    required
                    disabled={isPending}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-3 h-4 w-4 touch-target text-muted-foreground hover:text-foreground transition-colors'
                    tabIndex={-1}
                    disabled={isPending}
                  >
                    {showPassword ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </button>
                </div>

                {/* Password strength indicator */}
                {passwordTouched && password && (
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs text-muted-foreground'>
                        Password strength:
                      </span>
                      <span
                        className={cn(
                          'text-xs font-medium',
                          getPasswordStrength().color
                        )}
                      >
                        {getPasswordStrength().level.charAt(0).toUpperCase() +
                          getPasswordStrength().level.slice(1)}
                      </span>
                    </div>
                    <div className='w-full bg-muted rounded-full h-1'>
                      <div
                        className={cn(
                          'h-1 rounded-full transition-all duration-300',
                          getPasswordStrength().bgColor
                        )}
                        style={{
                          width: `${(passwordRequirements.filter(req => req.test(password)).length / 4) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Password requirements with positive reinforcement */}
                {passwordTouched && (
                  <div className='space-y-1'>
                    {passwordRequirements.map((req, index) => {
                      const isMet = req.test(password);
                      return (
                        <div
                          key={index}
                          className='flex items-center space-x-2 text-xs'
                        >
                          {isMet ? (
                            <CheckCircle className='h-3 w-3 text-green-500 flex-shrink-0' />
                          ) : (
                            <div className='h-3 w-3 rounded-full border border-muted-foreground/30 flex-shrink-0' />
                          )}
                          <span
                            className={
                              isMet ? 'text-green-600' : 'text-muted-foreground'
                            }
                          >
                            {req.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submit button with loading state */}
              <Button
                type='submit'
                className='w-full h-12 touch-target font-medium relative'
                variant='premium'
                disabled={!isFormValid() || isPending}
              >
                {isPending ? (
                  <div className='flex items-center space-x-2'>
                    <div className='h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    <span>Creating your account...</span>
                  </div>
                ) : (
                  <span>Start My Fragrance Journey</span>
                )}
              </Button>
            </form>

            {/* Trust reinforcement and legal */}
            <div className='space-y-4 pt-4 border-t border-border/40'>
              <div className='text-xs text-center text-muted-foreground space-y-2'>
                <p>
                  By creating an account, you agree to our{' '}
                  <Link
                    href='/terms'
                    className='text-plum-600 hover:text-plum-700 underline'
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    href='/privacy'
                    className='text-plum-600 hover:text-plum-700 underline'
                  >
                    Privacy Policy
                  </Link>
                </p>
                <div className='flex items-center justify-center space-x-1'>
                  <ShieldCheck className='h-3 w-3 text-plum-600' />
                  <span>Your data is encrypted and secure</span>
                </div>
              </div>

              {/* Sign in option */}
              <div className='text-center text-sm'>
                <span className='text-muted-foreground'>
                  Already have an account?{' '}
                </span>
                <Link
                  href='/auth/signin'
                  className='text-plum-600 hover:text-plum-700 font-medium underline'
                >
                  Sign in
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
