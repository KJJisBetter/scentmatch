'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react'

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'pending'>('pending')
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  useEffect(() => {
    if (error === 'verification_failed') {
      setStatus('error')
      setMessage('Email verification failed. The link may have expired or been used already.')
    }
  }, [error])

  const getStatusContent = () => {
    switch (status) {
      case 'loading':
        return {
          icon: <Loader2 className="h-16 w-16 text-blue-500 animate-spin mx-auto" />,
          title: 'Verifying your email...',
          description: 'Please wait while we confirm your email address.',
          variant: 'default' as const
        }
      
      case 'success':
        return {
          icon: <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />,
          title: 'Email verified successfully!',
          description: 'Your account has been activated. You can now sign in.',
          variant: 'default' as const
        }
      
      case 'error':
        return {
          icon: <XCircle className="h-16 w-16 text-red-500 mx-auto" />,
          title: 'Verification failed',
          description: message || 'There was a problem verifying your email address.',
          variant: 'destructive' as const
        }
      
      default: // pending
        return {
          icon: <Mail className="h-16 w-16 text-blue-500 mx-auto" />,
          title: 'Check your email',
          description: 'We\'ve sent a verification link to your email address. Please click the link to activate your account.',
          variant: 'default' as const
        }
    }
  }

  const statusContent = getStatusContent()

  return (
    <div className="container mx-auto max-w-md py-12 px-4">
      <Card>
        <CardHeader className="text-center space-y-4">
          {statusContent.icon}
          <div>
            <CardTitle className="text-2xl font-bold">{statusContent.title}</CardTitle>
            <CardDescription className="mt-2">
              {statusContent.description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'error' && (
            <Alert variant={statusContent.variant}>
              <AlertDescription>
                {message}
              </AlertDescription>
            </Alert>
          )}

          {status === 'pending' && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Don't see the email? Check your spam folder or try signing up again.
                </AlertDescription>
              </Alert>
              
              <div className="text-center">
                <Link href="/auth/signup">
                  <Button variant="outline" className="w-full">
                    Resend verification email
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <Link href="/auth/login">
                <Button className="w-full">
                  Continue to Sign In
                </Button>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-2">
              <Link href="/auth/signup">
                <Button variant="outline" className="w-full">
                  Try signing up again
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="ghost" className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          )}

          {status === 'pending' && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already verified?{' '}
                <Link 
                  href="/auth/login" 
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}