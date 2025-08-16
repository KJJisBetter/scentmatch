import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signOut } from '@/app/actions/auth'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome to ScentMatch</h1>
            <p className="text-gray-600">
              Hello, {profile?.email || user.email}! Ready to discover your perfect fragrance?
            </p>
          </div>
          <form action={async () => {
            'use server'
            await signOut()
          }}>
            <Button variant="outline" type="submit">
              Sign Out
            </Button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>My Collection</CardTitle>
              <CardDescription>
                View and manage your fragrance collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                View Collection
              </Button>
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
              <Button className="w-full">
                Get Recommendations
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Discover Samples</CardTitle>
              <CardDescription>
                Find affordable samples and travel sizes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Browse Samples
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Email Confirmed:</strong> {user.email_confirmed_at ? 'Yes' : 'No'}</p>
                <p><strong>Account Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}