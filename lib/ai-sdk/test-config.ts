/**
 * Test Configuration for AI SDK
 *
 * Simple test to verify the AI SDK setup is working correctly
 */

import { aiClient } from './client';

export async function testAISDKConfiguration(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    // Test basic configuration
    const healthCheck = await aiClient.healthCheck();

    if (healthCheck.status === 'healthy') {
      return {
        success: true,
        message: 'AI SDK configuration is working correctly',
        details: healthCheck,
      };
    } else {
      return {
        success: false,
        message: `AI SDK has issues: ${healthCheck.status}`,
        details: healthCheck,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `AI SDK configuration failed: ${error instanceof Error ? error.message : String(error)}`,
      details: error,
    };
  }
}

// Quick test function for development
export async function quickTest() {
  console.log('Testing AI SDK configuration...');
  const result = await testAISDKConfiguration();
  console.log('Result:', result);
  return result;
}
