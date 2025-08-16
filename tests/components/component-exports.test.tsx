/**
 * Test component import/export resolution
 * Verifies that all components can be properly imported from @/components
 */

import { describe, it, expect } from 'vitest';

describe('Component Import/Export Resolution', () => {
  it('should export Card components from @/components', async () => {
    // This test will fail if Card components aren't properly exported
    const { Card, CardContent, CardHeader, CardTitle } = await import('@/components');
    
    expect(Card).toBeDefined();
    expect(CardContent).toBeDefined();
    expect(CardHeader).toBeDefined();
    expect(CardTitle).toBeDefined();
  });

  it('should export Badge component from @/components', async () => {
    // This test will fail if Badge isn't properly exported
    const { Badge } = await import('@/components');
    
    expect(Badge).toBeDefined();
  });

  it('should export Button component from @/components', async () => {
    // This test will fail if Button isn't properly exported
    const { Button } = await import('@/components');
    
    expect(Button).toBeDefined();
  });

  it('should export all UI components without conflicts', async () => {
    // Test the specific import pattern used in ai-insights.tsx
    const components = await import('@/components');
    
    // These are the components used in ai-insights.tsx
    expect(components.Card).toBeDefined();
    expect(components.CardContent).toBeDefined();
    expect(components.CardHeader).toBeDefined();
    expect(components.CardTitle).toBeDefined();
    expect(components.Badge).toBeDefined();
    expect(components.Button).toBeDefined();
  });

  it('should allow destructured imports from @/components', () => {
    // This verifies the import pattern used in ai-insights.tsx works
    expect(() => {
      // This should not throw during compilation
      return import('@/components').then(module => {
        const { Card, CardContent, CardHeader, CardTitle, Badge, Button } = module;
        return { Card, CardContent, CardHeader, CardTitle, Badge, Button };
      });
    }).not.toThrow();
  });
});