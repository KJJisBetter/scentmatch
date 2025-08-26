import { Metadata } from 'next';
import { SearchPage } from '@/components/search/search-page';

export const metadata: Metadata = {
  title: 'Search Fragrances - ScentMatch',
  description:
    'Discover your perfect fragrance with AI-powered search and filtering.',
};

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    brand?: string;
    notes?: string;
    price?: string;
  }>;
}

export default async function Search({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const initialQuery = resolvedSearchParams.q || '';
  const initialFilters = {
    brands: resolvedSearchParams.brand ? [resolvedSearchParams.brand] : [],
    notes: resolvedSearchParams.notes
      ? resolvedSearchParams.notes.split(',')
      : [],
    priceRange: resolvedSearchParams.price
      ? resolvedSearchParams.price.split('-').map(Number)
      : undefined,
  };

  return (
    <main className='min-h-screen pb-20 md:pb-8'>
      <SearchPage initialQuery={initialQuery} initialFilters={initialFilters} />
    </main>
  );
}
