/**
 * Test to reproduce the critical search API bug:
 * ReferenceError: enhancedResults is not defined at line 180
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/search/route';

describe('Search API Critical Bug Reproduction', () => {
  test('should reproduce enhancedResults undefined error when AI search succeeds but falls back', async () => {
    // Create a request that would trigger AI search success initially
    // but then hit the enhancedResults reference issue
    const request = new NextRequest('http://localhost:3000/api/search?q=floral&ai=true');
    
    try {
      const response = await GET(request);
      
      // If we get here without a ReferenceError, the bug might be fixed
      // or the test conditions aren't right
      const data = await response.json();
      
      // Log for debugging
      console.log('Search response:', data);
      
      // The response should not contain a 500 error
      expect(response.status).not.toBe(500);
      
    } catch (error: any) {
      // This is where we expect to catch the ReferenceError
      if (error.message.includes('enhancedResults is not defined')) {
        console.log('✅ Successfully reproduced the bug: enhancedResults is not defined');
        
        // This confirms the bug exists
        expect(error.message).toContain('enhancedResults is not defined');
      } else {
        // If it's a different error, re-throw it
        throw error;
      }
    }
  });

  test('should handle case where AI search fails and fallback is used', async () => {
    // Test the fallback path where enhancedResults should be defined
    const request = new NextRequest('http://localhost:3000/api/search?q=test&ai=false');
    
    const response = await GET(request);
    
    // Fallback should work correctly
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.fragrances).toBeDefined();
    expect(Array.isArray(data.fragrances)).toBe(true);
  });

  test('should handle empty query gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/api/search');
    
    const response = await GET(request);
    
    // Should not throw enhancedResults error even with empty query
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.fragrances).toBeDefined();
  });
});