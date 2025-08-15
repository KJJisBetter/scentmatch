export const mockFragrances = [
  {
    id: '1',
    name: 'Aventus',
    brand: 'Creed',
    description: 'A sophisticated scent of pineapple, birch, and musk',
    notes: {
      top: ['Pineapple', 'Bergamot', 'Apple', 'Blackcurrant'],
      middle: ['Birch', 'Patchouli', 'Moroccan Jasmine', 'Rose'],
      base: ['Musk', 'Oak Moss', 'Ambergris', 'Vanilla'],
    },
    rating: 4.5,
    price: 350,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Sauvage',
    brand: 'Dior',
    description: 'Fresh and raw with bergamot and pepper',
    notes: {
      top: ['Bergamot', 'Pepper'],
      middle: ['Sichuan Pepper', 'Lavender', 'Pink Pepper', 'Vetiver'],
      base: ['Cedar', 'Labdanum', 'Ambroxan'],
    },
    rating: 4.3,
    price: 120,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  preferences: {
    favorite_notes: ['vanilla', 'bergamot', 'sandalwood'],
    disliked_notes: ['patchouli'],
    preferred_intensity: 'medium',
    occasion_preferences: ['casual', 'evening'],
  },
};

export const mockRecommendations = [
  {
    fragrance_id: '1',
    user_id: 'test-user-id',
    score: 0.95,
    reasons: ['Matches your vanilla preference', 'Popular evening scent'],
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    fragrance_id: '2',
    user_id: 'test-user-id',
    score: 0.87,
    reasons: ['Fresh bergamot notes', 'Versatile for casual wear'],
    created_at: '2024-01-01T00:00:00Z',
  },
];
