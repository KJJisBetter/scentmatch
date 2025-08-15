'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the actual login page
    router.replace('/auth/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-background to-plum-50/30 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="h-8 w-8 border-2 border-plum-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to sign in...</p>
      </div>
    </div>
  );
}