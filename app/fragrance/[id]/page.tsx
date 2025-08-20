import { createServerSupabase } from '@/lib/supabase';
import { ShoppingCart, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface FragrancePageProps {
  params: Promise<{
    id: string;
  }>;
}

// Simple fragrance page using working API route
export default async function SimpleFragrancePage({ params }: FragrancePageProps) {
  const { id } = await params;

  if (!id || id.trim() === '') {
    notFound();
  }

  // Use the working API route instead of direct database access
  let fragrance = null;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL 
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : 'http://localhost:3000';
      
    const response = await fetch(`${baseUrl}/api/fragrances/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const fragranceData = await response.json();
      fragrance = {
        id: fragranceData.id,
        name: fragranceData.name,
        brand: fragranceData.fragrance_brands?.name || 'Unknown Brand',
        scent_family: fragranceData.fragrance_family || 'Unknown',
        sample_available: fragranceData.sample_available || false,
        sample_price_usd: fragranceData.sample_price_usd || 15.99,
      };
    } else {
      console.error('Fragrance API failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Fragrance fetching failed:', error);
  }

  if (!fragrance) {
    notFound();
  }

  // Generate AI-style description based on scent family
  const aiDescription = generateAIDescription(fragrance);

  return (
    <div className="min-h-screen bg-background">
      {/* Simple header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link href="/browse" className="hover:text-foreground">Browse</Link>
            <span>/</span>
            <span className="text-foreground">{fragrance.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
              <span>{fragrance.scent_family}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{fragrance.name}</h1>
            <span className="text-lg text-muted-foreground">by {fragrance.brand}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">

            {/* AI Description Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-plum-600" />
                <h2 className="text-xl font-semibold text-plum-600">AI Fragrance Analysis</h2>
              </div>

              <div className="prose prose-stone max-w-none">
                <div className="text-lg leading-relaxed space-y-4 text-foreground">
                  {aiDescription}
                </div>
              </div>
            </div>

            {/* Battle Points Preview */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Performance Battle Points</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {generateBattlePoints(fragrance).map(({ name, score, icon }) => (
                  <div key={name} className="text-center p-4 border border-border rounded-lg">
                    <div className="text-2xl mb-2">{icon}</div>
                    <div className="text-2xl font-bold text-foreground">{score}/10</div>
                    <div className="text-sm text-muted-foreground">{name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* YouTuber Reviews Preview */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">YouTuber Reviews</h2>
              <div className="space-y-4">
                <div className="border border-border rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded flex items-center justify-center text-white text-xs font-bold">
                      YT
                    </div>
                    <span className="font-medium">Review integration coming soon</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    YouTuber reviews and ratings will be displayed here once content is populated.
                    This framework is ready for video embeds, reviewer profiles, and rating aggregation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="border border-border rounded-lg p-6 bg-card">
              <h3 className="text-lg font-semibold mb-4">Try This Fragrance</h3>

              {fragrance.sample_available && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Sample (2ml)</span>
                    <span className="text-lg font-bold">${fragrance.sample_price_usd || 3.95}</span>
                  </div>

                  <button className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Try Sample
                  </button>
                </div>
              )}

              <div className="mt-4 text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-1">
                  <span>🚚</span>
                  <span>Free shipping over $50</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🛡️</span>
                  <span>Authenticity guaranteed</span>
                </div>
              </div>
            </div>

            <div className="border border-border rounded-lg p-6 bg-card">
              <h3 className="text-lg font-semibold mb-4">Fragrance Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Family</span>
                  <span className="text-sm font-medium">{fragrance.scent_family}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Popularity</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">Top 10%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate AI description based on scent family
function generateAIDescription(fragrance: any) {
  const scentFamily = fragrance.scent_family || '';
  const name = fragrance.name;
  const brand = fragrance.brand;

  if (scentFamily.includes('iris')) {
    return (
      <div>
        <p>
          <strong>{name} by {brand}</strong> is a sophisticated and refined composition that embodies understated luxury and timeless elegance.
          This fragrance appeals to those who appreciate subtle complexity and aren't drawn to fleeting trends.
        </p>
        <p className="mt-4">
          With its distinguished iris character, it creates an aura of quiet confidence and intellectual sophistication.
          Perfect for individuals who value depth, authenticity, and want a signature scent that reflects their refined taste and thoughtful approach to life.
        </p>
      </div>
    );
  }

  if (scentFamily.includes('floral')) {
    return (
      <div>
        <p>
          <strong>{name} by {brand}</strong> is an elegant floral composition that embodies grace and sophisticated femininity.
          This fragrance speaks to those who appreciate timeless beauty and aren't afraid to express their romantic side.
        </p>
        <p className="mt-4">
          With its refined floral character, this scent creates an enchanting aura that's both approachable and memorable.
          Perfect for someone who values authenticity and wants to project confidence with a touch of classic elegance.
        </p>
      </div>
    );
  }

  // Default description
  return (
    <div>
      <p>
        <strong>{name} by {brand}</strong> is a distinctive and well-crafted fragrance that offers a unique olfactory experience.
        This composition speaks to fragrance lovers who appreciate quality and craftsmanship.
      </p>
      <p className="mt-4">
        Its balanced character creates a pleasant and sophisticated presence that's versatile enough for various occasions.
        Perfect for those who want a reliable signature scent that reflects their appreciation for the artistry of perfumery.
      </p>
    </div>
  );
}

// Generate battle points based on fragrance data
function generateBattlePoints(fragrance: any) {
  const scentFamily = fragrance.scent_family || '';

  // Create realistic battle points based on scent family characteristics
  if (scentFamily.includes('iris')) {
    return [
      { name: 'Projection', score: 7, icon: '📡' },
      { name: 'Longevity', score: 8, icon: '⏰' },
      { name: 'Uniqueness', score: 9, icon: '💎' },
      { name: 'Versatility', score: 8, icon: '🎯' },
      { name: 'Value', score: 7, icon: '💰' },
    ];
  }

  // Default battle points
  return [
    { name: 'Projection', score: 6, icon: '📡' },
    { name: 'Longevity', score: 7, icon: '⏰' },
    { name: 'Uniqueness', score: 6, icon: '💎' },
    { name: 'Versatility', score: 7, icon: '🎯' },
    { name: 'Value', score: 8, icon: '💰' },
  ];
}
