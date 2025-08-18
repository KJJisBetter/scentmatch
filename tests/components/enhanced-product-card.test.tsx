import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnhancedFragranceCard } from '@/components/browse/enhanced-fragrance-card';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

const mockRouter = {
  push: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  (useRouter as any).mockReturnValue(mockRouter);
});

describe('EnhancedFragranceCard', () => {
  const mockFragrance = {
    fragrance_id: 1,
    name: 'Bleu de Chanel Eau de Parfum for Men',
    brand: 'Chanel',
    scent_family: 'Woody Aromatic',
    relevance_score: 0.85,
    description: 'A sophisticated woody aromatic fragrance',
    sample_price_usd: 12,
    sample_available: true,
    popularity_score: 9.2,
  };

  it('should render fragrance card with basic information', () => {
    render(<EnhancedFragranceCard fragrance={mockFragrance} />);

    expect(screen.getByText('Chanel')).toBeInTheDocument();
    expect(
      screen.getByText('Bleu de Chanel Eau de Parfum')
    ).toBeInTheDocument();
    expect(screen.getByText('Woody Aromatic')).toBeInTheDocument();
    expect(screen.getByText('$12')).toBeInTheDocument();
  });

  it('should detect and display gender tag for male fragrances', () => {
    render(<EnhancedFragranceCard fragrance={mockFragrance} />);

    const genderTag = screen.getByText('Male');
    expect(genderTag).toBeInTheDocument();
    expect(genderTag).toHaveClass('gender-tag-male');
  });

  it('should detect and display gender tag for female fragrances', () => {
    const femaleFragrance = {
      ...mockFragrance,
      name: 'Chanel No. 5 Eau de Parfum for Women',
    };

    render(<EnhancedFragranceCard fragrance={femaleFragrance} />);

    const genderTag = screen.getByText('Female');
    expect(genderTag).toBeInTheDocument();
    expect(genderTag).toHaveClass('gender-tag-female');
  });

  it('should display unisex tag for gender-neutral fragrances', () => {
    const unisexFragrance = {
      ...mockFragrance,
      name: 'Tom Ford Black Orchid',
    };

    render(<EnhancedFragranceCard fragrance={unisexFragrance} />);

    const genderTag = screen.getByText('Unisex');
    expect(genderTag).toBeInTheDocument();
    expect(genderTag).toHaveClass('gender-tag-unisex');
  });

  it('should truncate long fragrance names elegantly', () => {
    const longNameFragrance = {
      ...mockFragrance,
      name: 'Tom Ford Oud Wood Intense Very Long Name That Should Be Truncated Elegantly',
      brand: 'Tom Ford',
    };

    render(<EnhancedFragranceCard fragrance={longNameFragrance} />);

    // The component should truncate the name after removing brand
    const nameElement = screen.getByText('Oud Wood Intense Very Long...');
    expect(nameElement).toBeInTheDocument();
  });

  it('should show full name on hover', () => {
    const longNameFragrance = {
      ...mockFragrance,
      name: 'Tom Ford Oud Wood Intense Very Long Name That Should Be Truncated',
      brand: 'Tom Ford',
    };

    render(<EnhancedFragranceCard fragrance={longNameFragrance} />);

    expect(
      screen.getByTitle(
        'Tom Ford Oud Wood Intense Very Long Name That Should Be Truncated'
      )
    ).toBeInTheDocument();
  });

  it('should navigate to fragrance detail on card click', () => {
    render(<EnhancedFragranceCard fragrance={mockFragrance} />);

    const cardElement = screen.getByRole('button');
    fireEvent.click(cardElement);

    expect(mockRouter.push).toHaveBeenCalledWith('/fragrance/1');
  });

  it('should display sample availability and pricing correctly', () => {
    render(<EnhancedFragranceCard fragrance={mockFragrance} />);

    expect(screen.getByText('Sample Ready')).toBeInTheDocument();
    expect(screen.getByText('Try Sample')).toBeInTheDocument();
    expect(screen.getByText('$12')).toBeInTheDocument();
  });

  it('should show popular badge for high popularity fragrances', () => {
    render(<EnhancedFragranceCard fragrance={mockFragrance} />);

    expect(screen.getByText('Popular')).toBeInTheDocument();
  });

  it('should handle like button interaction', () => {
    render(<EnhancedFragranceCard fragrance={mockFragrance} />);

    const likeButton = screen.getByLabelText('Add to favorites');
    fireEvent.click(likeButton);

    expect(screen.getByLabelText('Remove from favorites')).toBeInTheDocument();
  });

  it('should prevent card navigation when action buttons are clicked', () => {
    render(<EnhancedFragranceCard fragrance={mockFragrance} />);

    const sampleButton = screen.getByText('Try Sample');
    fireEvent.click(sampleButton);

    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('should display rating and review count', () => {
    render(<EnhancedFragranceCard fragrance={mockFragrance} />);

    // Mock rating should be around 4.3 based on relevance score
    expect(screen.getByText(/4\.\d/)).toBeInTheDocument();
    expect(screen.getByText(/\(\d+\)/)).toBeInTheDocument();
  });

  it('should show discount badge when applicable', () => {
    const discountFragrance = {
      ...mockFragrance,
      fragrance_id: 4, // ID divisible by 4 triggers discount
    };

    render(<EnhancedFragranceCard fragrance={discountFragrance} />);

    expect(screen.getByText('15% OFF')).toBeInTheDocument();
  });

  it('should handle missing sample availability gracefully', () => {
    const noSampleFragrance = {
      ...mockFragrance,
      sample_available: false,
      sample_price_usd: undefined,
    };

    render(<EnhancedFragranceCard fragrance={noSampleFragrance} />);

    expect(screen.queryByText('Sample Ready')).not.toBeInTheDocument();
    expect(screen.queryByText('Try Sample')).not.toBeInTheDocument();
    expect(screen.getByText('View details')).toBeInTheDocument();
  });

  it('should apply proper CSS classes for responsive design', () => {
    render(<EnhancedFragranceCard fragrance={mockFragrance} />);

    const cardElement = screen.getByRole('button');
    expect(cardElement).toHaveClass(
      'group',
      'hover:shadow-lg',
      'hover:-translate-y-1',
      'transition-all'
    );
  });
});
