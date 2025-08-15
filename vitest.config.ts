import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local for testing
config({ path: resolve(__dirname, '.env.local') });

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    css: true,
    // Enhanced coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '.next/',
        'out/',
        'public/',
        '**/*.stories.*',
        '**/*.test.*',
        '**/*.spec.*',
      ],
      // Coverage thresholds for TDD enforcement
      thresholds: {
        lines: 80,
        functions: 75,
        branches: 70,
        statements: 80,
      },
      // Include source files for coverage
      include: ['app/**/*', 'components/**/*', 'lib/**/*', 'types/**/*'],
    },
    // Performance testing configuration
    timeout: 10000,
    testTimeout: 5000,
    // Parallel execution for faster testing
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
    // Enhanced reporting
    reporters: ['verbose', 'junit'],
    outputFile: {
      junit: './test-results.xml',
    },
    // Test environment configuration
    env: {
      NODE_ENV: 'test',
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@/components': resolve(__dirname, './components'),
      '@/lib': resolve(__dirname, './lib'),
      '@/types': resolve(__dirname, './types'),
      '@/app': resolve(__dirname, './app'),
      '@/tests': resolve(__dirname, './tests'),
    },
  },
  // Optimize for testing performance
  esbuild: {
    target: 'node14',
  },
});
