import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase';
import { FragranceDetailPage } from '@/components/fragrance/fragrance-detail-page';
import { InteractionTracker } from '@/components/fragrance/interaction-tracker';

interface FragrancePageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Individual Fragrance Detail Page
 *
 * Dynamic route: /fragrance/[id]
 * Features:
 * - Server-side fragrance data fetching
 * - SEO metadata generation
 * - Error handling for invalid IDs
 * - Client-side interaction tracking
 */

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: FragrancePageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerSupabase();

  try {
    const { data: fragrance } = await (supabase as any)
      .from('fragrances')
      .select(
        `
        id,
        name,
        brand_id,
        image_url,
        fragrance_brands:brand_id (
          name
        )
      `
      )
      .eq('id', id)
      .single();

    if (!fragrance) {
      return {
        title: 'Fragrance Not Found - ScentMatch',
        description: 'The requested fragrance could not be found.',
      };
    }

    const brandName =
      (fragrance.fragrance_brands as any)?.name || 'Unknown Brand';
    const title = `${fragrance.name} by ${brandName} - ScentMatch`;
    const description = `Discover ${fragrance.name} by ${brandName}. Explore scent notes, find similar fragrances, and order samples on ScentMatch.`;

    return {
      title,
      description,
      keywords: [
        fragrance.name,
        brandName,
        'fragrance',
        'perfume',
        'scent',
        'notes',
        'samples',
        'ScentMatch',
      ].join(', '),
      openGraph: {
        title,
        description,
        type: 'website',
        images: fragrance.image_url
          ? [
              {
                url: fragrance.image_url,
                width: 400,
                height: 400,
                alt: `${fragrance.name} by ${brandName}`,
              },
            ]
          : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: fragrance.image_url ? [fragrance.image_url] : undefined,
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch (error) {
    console.error(
      'Error generating metadata for fragrance:',
      (await params).id,
      error
    );

    return {
      title: 'Fragrance - ScentMatch',
      description:
        'Discover fragrances, explore scent notes, and find your perfect match.',
    };
  }
}

// Fetch fragrance data server-side
async function getFragranceData(id: string) {
  const supabase = await createServerSupabase();

  try {
    // Use the same fallback approach as the search API (which works)
    // Skip RPC calls that cause "call" errors and use direct database queries

    let fallbackQuery = (supabase as any).from('fragrances').select(`
        id,
        name,
        scent_family,
        sample_available,
        sample_price_usd,
        popularity_score,
        fragrance_brands:brand_id (
          name
        )
      `);

    // Find the specific fragrance by ID
    fallbackQuery = fallbackQuery.eq('id', id);

    const { data: fragranceResults, error: fallbackError } =
      await fallbackQuery;

    if (fallbackError || !fragranceResults || fragranceResults.length === 0) {
      console.error('Fragrance not found:', id, fallbackError);
      return null;
    }

    const fragrance = fragranceResults[0];
    if (!fragrance) {
      return null;
    }

    // For MVP, mock similar fragrances since the function might not exist
    const similarFragrances: any[] = [];

    // Transform search result to match expected interface
    const transformedFragrance = {
      id: fragrance.id,
      name: fragrance.name,
      brand_id: fragrance.fragrance_brands?.[0]?.name || '',
      scent_family: fragrance.scent_family,
      sample_available: fragrance.sample_available,
      sample_price_usd: fragrance.sample_price_usd,
      fragrance_brands: fragrance.fragrance_brands || [],
    };

    return {
      fragrance: transformedFragrance,
      similarFragrances,
    };
  } catch (error) {
    console.error('Error fetching fragrance data:', id, error);
    return null;
  }
}

// Main page component
export default async function FragrancePage({ params }: FragrancePageProps) {
  const { id } = await params;

  // Validate fragrance ID format
  if (!id || id.trim() === '') {
    console.error('Invalid fragrance ID:', id);
    notFound();
  }

  // Fetch fragrance data
  const data = await getFragranceData(id);

  if (!data) {
    notFound();
  }

  const { fragrance, similarFragrances } = data;

  return (
    <>
      {/* Track page view interaction */}
      <InteractionTracker
        fragranceId={fragrance.id}
        interactionType='view'
        interactionContext='detail_page'
      />

      {/* Main fragrance detail page */}
      <FragranceDetailPage
        fragrance={fragrance}
        similarFragrances={similarFragrances}
      />
    </>
  );
}

// Temporarily disable static generation for MVP
// Will re-enable once database schema is stable
export const dynamic = 'force-dynamic';
