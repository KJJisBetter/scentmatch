import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { signOut } from '@/app/actions/auth';

// Streaming Components for Progressive Loading
async function UserProfile({ userId }: { userId: string }) {
  const supabase = await createServerSupabase();
  
  const { data: profile } = await (supabase as any)
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return (
    <div>
      <h1 className='text-3xl font-bold'>Welcome to ScentMatch</h1>
      <p className='text-gray-600'>
        Hello, {profile?.email || 'Fragrance Explorer'}! Ready to discover your perfect fragrance?
      </p>
    </div>
  );
}

async function DashboardStats({ userId }: { userId: string }) {
  const supabase = await createServerSupabase();
  
  // Get collection stats  
  const { data: collectionStats } = await (supabase as any)
    .from('user_collections')
    .select('id, collection_type')
    .eq('user_id', userId);
    
  const totalCollection = collectionStats?.filter((c: any) => c.collection_type === 'owned')?.length || 0;
  const totalWishlist = collectionStats?.filter((c: any) => c.collection_type === 'wishlist')?.length || 0;
  
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      <Card>
        <CardHeader>
          <CardTitle>My Collection</CardTitle>
          <CardDescription>
            {totalCollection} fragrances owned
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className='w-full'>View Collection</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wishlist</CardTitle>
          <CardDescription>
            {totalWishlist} fragrances on wishlist
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className='w-full'>View Wishlist</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
          <CardDescription>
            Get AI-powered fragrance recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className='w-full'>Get Recommendations</Button>
        </CardContent>
      </Card>
    </div>
  );
}

async function AccountInfo({ userId }: { userId: string }) {
  const supabase = await createServerSupabase();
  
  const { data: { user } } = await (supabase as any).auth.getUser();
  
  if (!user) return null;
  
  return (
    <div className='mt-8'>
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>User ID:</strong> {user.id}
            </p>
            <p>
              <strong>Email Confirmed:</strong>{' '}
              {user.email_confirmed_at ? 'Yes' : 'No'}
            </p>
            <p>
              <strong>Account Created:</strong>{' '}
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading skeletons for progressive loading
function ProfileSkeleton() {
  return (
    <div>
      <div className='h-8 bg-gray-200 animate-pulse rounded w-1/2 mb-2'></div>
      <div className='h-4 bg-gray-200 animate-pulse rounded w-3/4'></div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className='h-5 bg-gray-200 animate-pulse rounded w-2/3 mb-2'></div>
            <div className='h-4 bg-gray-200 animate-pulse rounded w-1/2'></div>
          </CardHeader>
          <CardContent>
            <div className='h-10 bg-gray-200 animate-pulse rounded w-full'></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AccountSkeleton() {
  return (
    <div className='mt-8'>
      <Card>
        <CardHeader>
          <div className='h-6 bg-gray-200 animate-pulse rounded w-1/3'></div>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className='h-4 bg-gray-200 animate-pulse rounded w-full'></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error,
  } = await (supabase as any).auth.getUser();

  if (error || !user) {
    redirect('/auth/login');
  }

  return (
    <div className='container mx-auto py-8 px-4'>
      <div className='max-w-4xl mx-auto'>
        {/* Header section with sign-out - loads immediately */}
        <div className='flex justify-between items-center mb-8'>
          {/* User profile streams in progressively */}
          <Suspense fallback={<ProfileSkeleton />}>
            <UserProfile userId={user.id} />
          </Suspense>
          
          {/* Sign out button loads immediately */}
          <form
            action={async () => {
              'use server';
              await signOut();
            }}
          >
            <Button variant='outline' type='submit'>
              Sign Out
            </Button>
          </form>
        </div>

        {/* Dashboard stats stream in next */}
        <Suspense fallback={<StatsSkeleton />}>
          <DashboardStats userId={user.id} />
        </Suspense>

        {/* Account info streams in last (lowest priority) */}
        <Suspense fallback={<AccountSkeleton />}>
          <AccountInfo userId={user.id} />
        </Suspense>
      </div>
    </div>
  );
}