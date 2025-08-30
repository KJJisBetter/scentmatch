'use client';

import { useState, useEffect, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, Mail, RefreshCw } from 'lucide-react';
import { resendConfirmationEmail } from '@/app/actions/auth';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<
    'loading' | 'success' | 'error' | 'pending'
  >('pending');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [showResendForm, setShowResendForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    const errorType = searchParams.get('error');
    const emailParam = searchParams.get('email');
    const retryParam = searchParams.get('retry');

    if (errorType === 'verification-failed') {
      setStatus('error');
      setMessage(
        'Email verification failed. The link may have expired or been used already.'
      );
    } else if (errorType === 'invalid-token') {
      setStatus('error');
      setMessage(
        'The verification link is invalid or has expired. Please request a new verification email.'
      );
    } else if (errorType === 'access_denied') {
      setStatus('error');
      setMessage(
        'Email verification was denied. Please try signing up again or contact support.'
      );
    } else if (emailParam === 'check-inbox') {
      setStatus('pending');
      setMessage(
        'Please check your email inbox and click the verification link to activate your account.'
      );
    }
  }, [searchParams]);

  const handleResendEmail = () => {
    if (!email.trim()) {
      setResendMessage('Please enter your email address');
      return;
    }

    startTransition(async () => {
      try {
        const result = await resendConfirmationEmail(email);

        if (result.success) {
          setResendMessage(result.message);
          setShowResendForm(false);

          if (result.alreadyConfirmed) {
            setStatus('success');
            setMessage('Your email is already confirmed!');
          } else {
            setStatus('pending');
            setMessage('New confirmation email sent! Please check your inbox.');
          }
        } else {
          setResendMessage(result.error || 'Failed to resend email');
        }
      } catch (error) {
        setResendMessage('An unexpected error occurred. Please try again.');
        console.error('Resend error:', error);
      }
    });
  };

  const getStatusContent = () => {
    switch (status) {
      case 'loading':
        return {
          icon: (
            <Loader2 className='h-16 w-16 text-blue-500 animate-spin mx-auto' />
          ),
          title: 'Verifying your email...',
          description: 'Please wait while we confirm your email address.',
          variant: 'default' as const,
        };

      case 'success':
        return {
          icon: <CheckCircle className='h-16 w-16 text-green-500 mx-auto' />,
          title: 'Email verified successfully!',
          description: 'Your account has been activated. You can now sign in.',
          variant: 'default' as const,
        };

      case 'error':
        return {
          icon: <XCircle className='h-16 w-16 text-red-500 mx-auto' />,
          title: 'Verification failed',
          description:
            message || 'There was a problem verifying your email address.',
          variant: 'destructive' as const,
        };

      default: // pending
        return {
          icon: <Mail className='h-16 w-16 text-blue-500 mx-auto' />,
          title: 'Check your email',
          description:
            "We've sent a verification link to your email address. Please click the link to activate your account.",
          variant: 'default' as const,
        };
    }
  };

  const statusContent = getStatusContent();

  return (
    <div className='container mx-auto max-w-md py-12 px-4'>
      <Card>
        <CardHeader className='text-center space-y-4'>
          {statusContent.icon}
          <div>
            <CardTitle className='text-2xl font-bold'>
              {statusContent.title}
            </CardTitle>
            <CardDescription className='mt-2'>
              {statusContent.description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          {status === 'error' && (
            <Alert variant={statusContent.variant}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {status === 'pending' && (
            <div className='space-y-4'>
              <Alert>
                <AlertDescription>
                  Don't see the email? Check your spam folder or request a new
                  verification email below.
                </AlertDescription>
              </Alert>

              {!showResendForm ? (
                <div className='text-center space-y-2'>
                  <Button
                    variant='outline'
                    onClick={() => setShowResendForm(true)}
                    className='w-full'
                  >
                    <RefreshCw className='w-4 h-4 mr-2' />
                    Resend verification email
                  </Button>
                  <p className='text-sm text-gray-600'>
                    Or{' '}
                    <Link
                      href='/auth/signup'
                      className='font-medium text-blue-600 hover:text-blue-500'
                    >
                      sign up again
                    </Link>
                  </p>
                </div>
              ) : (
                <div className='space-y-3'>
                  <div>
                    <Label htmlFor='resend-email'>Email Address</Label>
                    <Input
                      id='resend-email'
                      type='email'
                      placeholder='Enter your email address'
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      disabled={isPending}
                    />
                  </div>

                  {resendMessage && (
                    <Alert
                      variant={
                        resendMessage.includes('sent')
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      <AlertDescription>{resendMessage}</AlertDescription>
                    </Alert>
                  )}

                  <div className='flex space-x-2'>
                    <Button
                      onClick={handleResendEmail}
                      disabled={isPending || !email.trim()}
                      className='flex-1'
                    >
                      {isPending ? (
                        <>
                          <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className='w-4 h-4 mr-2' />
                          Send Email
                        </>
                      )}
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() => {
                        setShowResendForm(false);
                        setResendMessage('');
                      }}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {status === 'success' && (
            <div className='text-center'>
              <Link href='/auth/login'>
                <Button className='w-full'>Continue to Sign In</Button>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className='space-y-3'>
              {!showResendForm ? (
                <div className='space-y-2'>
                  <Button
                    variant='outline'
                    onClick={() => setShowResendForm(true)}
                    className='w-full'
                  >
                    <RefreshCw className='w-4 h-4 mr-2' />
                    Resend verification email
                  </Button>
                  <Link href='/auth/signup'>
                    <Button variant='outline' className='w-full'>
                      Try signing up again
                    </Button>
                  </Link>
                  <Link href='/auth/login'>
                    <Button variant='ghost' className='w-full'>
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className='space-y-3'>
                  <div>
                    <Label htmlFor='resend-email-error'>Email Address</Label>
                    <Input
                      id='resend-email-error'
                      type='email'
                      placeholder='Enter your email address'
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      disabled={isPending}
                    />
                  </div>

                  {resendMessage && (
                    <Alert
                      variant={
                        resendMessage.includes('sent')
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      <AlertDescription>{resendMessage}</AlertDescription>
                    </Alert>
                  )}

                  <div className='flex space-x-2'>
                    <Button
                      onClick={handleResendEmail}
                      disabled={isPending || !email.trim()}
                      className='flex-1'
                    >
                      {isPending ? (
                        <>
                          <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className='w-4 h-4 mr-2' />
                          Send Email
                        </>
                      )}
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() => {
                        setShowResendForm(false);
                        setResendMessage('');
                      }}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {status === 'pending' && (
            <div className='text-center'>
              <p className='text-sm text-gray-600'>
                Already verified?{' '}
                <Link
                  href='/auth/login'
                  className='font-medium text-blue-600 hover:text-blue-500'
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
