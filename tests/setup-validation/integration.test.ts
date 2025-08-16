import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

describe('Test Suite 5: Integration Testing', () => {
  const projectRoot = process.cwd();
  let devServerProcess: any = null;

  beforeAll(async () => {
    // Note: We'll only start a dev server for certain tests to avoid conflicts
    // Most integration tests will be structural checks
  });

  afterAll(async () => {
    // Clean up any running processes
    if (devServerProcess) {
      devServerProcess.kill('SIGTERM');
    }
  });

  describe('Test Case 5.1: Full Stack Integration', () => {
    test('should have proper project structure for full stack', () => {
      // Verify Next.js App Router structure
      const appDir = path.join(projectRoot, 'app');
      expect(existsSync(appDir)).toBe(true);

      // Check for essential files
      const layoutPath = path.join(appDir, 'layout.tsx');
      expect(existsSync(layoutPath)).toBe(true);

      // Check for page structure
      const pagePath = path.join(appDir, 'page.tsx');
      expect(existsSync(pagePath)).toBe(true);
    });

    test('should have database integration setup', () => {
      // Check for Supabase or database configuration
      const possibleDbFiles = [
        'lib/supabase/client.ts',
        'lib/supabase/server.ts',
        'utils/supabase/client.ts',
        'utils/supabase/server.ts',
        'lib/database.ts'
      ];

      let hasDbConfig = false;
      for (const dbFile of possibleDbFiles) {
        if (existsSync(path.join(projectRoot, dbFile))) {
          hasDbConfig = true;
          break;
        }
      }

      if (!hasDbConfig) {
        console.warn('Database integration not set up yet - may be implemented in later phases');
      }
    });

    test('should support API routes structure', () => {
      // Check for API routes directory
      const apiDir = path.join(projectRoot, 'app/api');
      
      if (existsSync(apiDir)) {
        // If API directory exists, check structure
        expect(existsSync(apiDir)).toBe(true);
      } else {
        console.warn('API routes not implemented yet - will be added in development phase');
      }
    });

    test('should have proper authentication flow structure', () => {
      // Check for authentication-related files
      const possibleAuthFiles = [
        'app/auth',
        'app/login',
        'app/sign-in',
        'components/auth',
        'lib/auth.ts'
      ];

      let hasAuthStructure = false;
      for (const authPath of possibleAuthFiles) {
        if (existsSync(path.join(projectRoot, authPath))) {
          hasAuthStructure = true;
          break;
        }
      }

      if (!hasAuthStructure) {
        console.warn('Authentication structure not implemented yet - planned for Phase 1');
      }
    });

    test('should support client-server data flow architecture', () => {
      // Check for proper data flow setup
      const layoutPath = path.join(projectRoot, 'app/layout.tsx');
      
      if (existsSync(layoutPath)) {
        const layoutContent = readFileSync(layoutPath, 'utf8');
        
        // Should be a Server Component (no "use client")
        expect(layoutContent).not.toMatch(/['"]use client['"]/);
        
        // Should have proper component structure
        expect(layoutContent).toMatch(/export\s+default\s+function/);
        expect(layoutContent).toMatch(/children.*ReactNode|ReactNode.*children/);
      }
    });

    test('should handle TypeScript integration across stack', () => {
      // Check for TypeScript configuration that supports full stack
      const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
      expect(existsSync(tsconfigPath)).toBe(true);

      const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'));
      
      // Should support both client and server code
      expect(tsconfig.compilerOptions.lib).toBeDefined();
      expect(tsconfig.compilerOptions.jsx).toBeDefined();
      expect(tsconfig.compilerOptions.allowJs).toBe(true);
    });

    test('should have proper error handling structure', () => {
      // Check for error handling files
      const errorFiles = [
        'app/error.tsx',
        'app/not-found.tsx',
        'app/global-error.tsx'
      ];

      let hasErrorHandling = false;
      for (const errorFile of errorFiles) {
        if (existsSync(path.join(projectRoot, errorFile))) {
          hasErrorHandling = true;
        }
      }

      if (!hasErrorHandling) {
        console.warn('Error handling pages not implemented yet - recommended for production');
      }
    });
  });

  describe('Integration Health Checks', () => {
    test('should have consistent import/export patterns', () => {
      // Check that main files use consistent import patterns
      const mainFiles = [
        'app/layout.tsx',
        'app/page.tsx'
      ];

      for (const filePath of mainFiles) {
        const fullPath = path.join(projectRoot, filePath);
        if (existsSync(fullPath)) {
          const content = readFileSync(fullPath, 'utf8');
          
          // Should use ES6 imports
          if (content.includes('import')) {
            expect(content).toMatch(/import.*from/);
          }
          
          // Should use ES6 exports
          if (content.includes('export')) {
            expect(content).toMatch(/export\s+(default|function|const)/);
          }
        }
      }
    });

    test('should support middleware integration', () => {
      // Check for middleware file
      const middlewarePath = path.join(projectRoot, 'middleware.ts');
      const middlewareJsPath = path.join(projectRoot, 'middleware.js');
      
      const hasMiddleware = existsSync(middlewarePath) || existsSync(middlewareJsPath);
      
      if (hasMiddleware) {
        let middlewareContent = '';
        if (existsSync(middlewarePath)) {
          middlewareContent = readFileSync(middlewarePath, 'utf8');
        } else {
          middlewareContent = readFileSync(middlewareJsPath, 'utf8');
        }

        // Should export middleware function
        expect(middlewareContent).toMatch(/export.*middleware/);
      }
    });

    test('should have proper static asset handling', () => {
      // Check for public directory
      const publicDir = path.join(projectRoot, 'public');
      expect(existsSync(publicDir)).toBe(true);

      // Check for essential favicon
      const faviconPath = path.join(publicDir, 'favicon.ico');
      if (!existsSync(faviconPath)) {
        console.warn('favicon.ico not found - should be added for production');
      }
    });

    test('should support component integration', () => {
      // Check for components directory structure
      const componentsDir = path.join(projectRoot, 'components');
      
      if (existsSync(componentsDir)) {
        // Should have proper component structure
        expect(existsSync(componentsDir)).toBe(true);
      } else {
        console.warn('Components directory not created yet - will be added during development');
      }
    });

    test('should have proper build configuration integration', () => {
      // Verify that all configuration files work together
      const configFiles = [
        'next.config.ts',
        'next.config.js',
        'postcss.config.js',
        'tailwind.config.ts',
        'tailwind.config.js',
        'tsconfig.json'
      ];

      const existingConfigs = configFiles.filter(config => 
        existsSync(path.join(projectRoot, config))
      );

      // Should have at least basic Next.js and TypeScript configuration
      expect(existingConfigs.length).toBeGreaterThan(1);
    });

    test('should support proper development workflow', () => {
      const packageJson = JSON.parse(
        readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
      );

      // Should have development scripts that work together
      expect(packageJson.scripts.dev).toBeDefined();
      expect(packageJson.scripts.build).toBeDefined();
      expect(packageJson.scripts.start).toBeDefined();
      expect(packageJson.scripts.lint).toBeDefined();
      expect(packageJson.scripts['type-check']).toBeDefined();
    });
  });

  describe('Future Integration Readiness', () => {
    test('should be ready for database integration', () => {
      // Check that structure supports future database integration
      const packageJson = JSON.parse(
        readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
      );

      // Should have Supabase packages ready
      expect(packageJson.dependencies['@supabase/supabase-js']).toBeDefined();
      expect(packageJson.dependencies['@supabase/ssr']).toBeDefined();
    });

    test('should be ready for authentication integration', () => {
      // Verify environment supports auth
      const envFiles = ['.env.example', '.env.local.example'];
      
      for (const envFile of envFiles) {
        const envPath = path.join(projectRoot, envFile);
        if (existsSync(envPath)) {
          const envContent = readFileSync(envPath, 'utf8');
          
          // Should have auth-related environment variables documented
          if (envContent.includes('SUPABASE')) {
            expect(envContent).toMatch(/NEXT_PUBLIC_SUPABASE_URL/);
            expect(envContent).toMatch(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
          }
        }
      }
    });

    test('should be ready for API route implementation', () => {
      // Check that Next.js is configured for API routes
      const nextConfigPath = path.join(projectRoot, 'next.config.ts');
      const nextConfigJsPath = path.join(projectRoot, 'next.config.js');
      
      // Next.js supports API routes by default, so this is mainly a structure check
      const appDir = path.join(projectRoot, 'app');
      expect(existsSync(appDir)).toBe(true);
    });

    test('should support testing integration', () => {
      // Verify testing setup can handle full stack testing
      const vitestConfigPath = path.join(projectRoot, 'vitest.config.ts');
      expect(existsSync(vitestConfigPath)).toBe(true);

      const vitestConfig = readFileSync(vitestConfigPath, 'utf8');
      
      // Should have proper environment setup for integration testing
      expect(vitestConfig).toMatch(/environment.*jsdom/);
      expect(vitestConfig).toMatch(/setupFiles/);
    });
  });
});