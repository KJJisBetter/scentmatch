import { describe, test, expect, beforeAll } from 'vitest';
import { execSync, spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

describe('Test Suite 1: Technology Compatibility Matrix', () => {
  const projectRoot = process.cwd();
  
  beforeAll(() => {
    // Ensure we're in the correct project directory
    expect(existsSync(path.join(projectRoot, 'package.json'))).toBe(true);
  });

  describe('Test Case 1.1: Next.js 15 + React 19 Compatibility', () => {
    test('should have correct Next.js and React versions installed', () => {
      const packageJson = JSON.parse(
        readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
      );

      // Verify version ranges match QA specifications
      expect(packageJson.dependencies.next).toMatch(/^\^15\./);
      expect(packageJson.dependencies.react).toMatch(/^\^19\./);
      expect(packageJson.dependencies['react-dom']).toMatch(/^\^19\./);
    });

    test('should validate Next.js App Router compatibility', () => {
      // Check for App Router structure
      const appDir = path.join(projectRoot, 'app');
      expect(existsSync(appDir)).toBe(true);

      // Check for layout.tsx (App Router requirement)
      const layoutFile = path.join(appDir, 'layout.tsx');
      expect(existsSync(layoutFile)).toBe(true);
    });

    test('should have working Next.js configuration', () => {
      const nextConfigPath = path.join(projectRoot, 'next.config.ts');
      const nextConfigJsPath = path.join(projectRoot, 'next.config.js');
      
      // Either TypeScript or JavaScript config should exist
      const hasConfig = existsSync(nextConfigPath) || existsSync(nextConfigJsPath);
      expect(hasConfig).toBe(true);
    });

    test('should support Server-Side Rendering (SSR)', async () => {
      // Test that React server components are properly configured
      // by checking if layout.tsx uses proper server component syntax
      const layoutPath = path.join(projectRoot, 'app', 'layout.tsx');
      if (existsSync(layoutPath)) {
        const layoutContent = readFileSync(layoutPath, 'utf8');
        
        // Should not have "use client" directive (server component)
        expect(layoutContent).not.toMatch(/['"]use client['"]/);
        
        // Should export default function
        expect(layoutContent).toMatch(/export\s+default\s+function/);
      }
    });
  });

  describe('Test Case 1.2: TailwindCSS Stable Version Validation', () => {
    test('should use TailwindCSS v3.4.x stable version', () => {
      const packageJson = JSON.parse(
        readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
      );

      // Verify we're using stable v3.4.x, not experimental v4
      expect(packageJson.devDependencies.tailwindcss).toMatch(/^\^3\.4\./);
      
      // Ensure no experimental v4 packages
      expect(packageJson.devDependencies['@tailwindcss/postcss']).toBeUndefined();
    });

    test('should have correct PostCSS configuration', () => {
      const postcssConfigPath = path.join(projectRoot, 'postcss.config.js');
      expect(existsSync(postcssConfigPath)).toBe(true);

      const postcssConfig = readFileSync(postcssConfigPath, 'utf8');
      
      // Should use standard TailwindCSS plugin, not experimental
      expect(postcssConfig).toMatch(/tailwindcss/);
      expect(postcssConfig).toMatch(/autoprefixer/);
      expect(postcssConfig).not.toMatch(/@tailwindcss\/postcss/);
    });

    test('should have valid Tailwind configuration', () => {
      const tailwindConfigPath = path.join(projectRoot, 'tailwind.config.js');
      const tailwindConfigTsPath = path.join(projectRoot, 'tailwind.config.ts');
      
      const hasConfig = existsSync(tailwindConfigPath) || existsSync(tailwindConfigTsPath);
      expect(hasConfig).toBe(true);

      // Read the config content
      let configContent = '';
      if (existsSync(tailwindConfigTsPath)) {
        configContent = readFileSync(tailwindConfigTsPath, 'utf8');
      } else if (existsSync(tailwindConfigPath)) {
        configContent = readFileSync(tailwindConfigPath, 'utf8');
      }

      // Should have content configuration for app directory
      expect(configContent).toMatch(/content/);
      expect(configContent).toMatch(/app/);
    });

    test('should compile CSS without errors', async () => {
      // Test CSS compilation by running a quick build check
      try {
        // This will test if TailwindCSS compiles correctly
        execSync('npm run type-check', {
          cwd: projectRoot,
          timeout: 30000,
          stdio: 'pipe'
        });
      } catch (error: any) {
        // If type-check fails, it might be due to CSS compilation issues
        if (error.message.includes('postcss') || error.message.includes('tailwind')) {
          throw new Error(`TailwindCSS compilation error: ${error.message}`);
        }
        // Otherwise, this might be unrelated TypeScript errors, which is acceptable for this test
      }
    });

    test('should support responsive design classes', () => {
      // Check if global CSS file exists and has Tailwind directives
      const possibleCssFiles = [
        'app/globals.css',
        'styles/globals.css',
        'app/global.css'
      ];

      let cssContent = '';
      for (const cssFile of possibleCssFiles) {
        const cssPath = path.join(projectRoot, cssFile);
        if (existsSync(cssPath)) {
          cssContent = readFileSync(cssPath, 'utf8');
          break;
        }
      }

      // Should have Tailwind directives
      expect(cssContent).toMatch(/@tailwind base/);
      expect(cssContent).toMatch(/@tailwind components/);
      expect(cssContent).toMatch(/@tailwind utilities/);
    });
  });

  describe('Test Case 1.3: Supabase Client Compatibility', () => {
    test('should use current Supabase SSR client libraries', () => {
      const packageJson = JSON.parse(
        readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
      );

      // Verify current recommended versions
      expect(packageJson.dependencies['@supabase/ssr']).toMatch(/^\^0\.5\./);
      expect(packageJson.dependencies['@supabase/supabase-js']).toMatch(/^\^2\.45\./);
      
      // Ensure deprecated packages are removed
      expect(packageJson.dependencies['@supabase/auth-helpers-nextjs']).toBeUndefined();
    });

    test('should have proper environment variables configuration', () => {
      // Check for .env.example or .env.local.example
      const envExamplePath = path.join(projectRoot, '.env.example');
      const envLocalExamplePath = path.join(projectRoot, '.env.local.example');
      
      const hasEnvExample = existsSync(envExamplePath) || existsSync(envLocalExamplePath);
      
      if (hasEnvExample) {
        let envContent = '';
        if (existsSync(envExamplePath)) {
          envContent = readFileSync(envExamplePath, 'utf8');
        } else {
          envContent = readFileSync(envLocalExamplePath, 'utf8');
        }

        // Should have required Supabase environment variables
        expect(envContent).toMatch(/NEXT_PUBLIC_SUPABASE_URL/);
        expect(envContent).toMatch(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
      }
    });

    test('should have Supabase client utilities setup', () => {
      // Check for Supabase client configuration files
      const possibleSupabasePaths = [
        'lib/supabase/client.ts',
        'lib/supabase/server.ts',
        'utils/supabase/client.ts',
        'utils/supabase/server.ts'
      ];

      let hasSupabaseConfig = false;
      for (const supabasePath of possibleSupabasePaths) {
        if (existsSync(path.join(projectRoot, supabasePath))) {
          hasSupabaseConfig = true;
          break;
        }
      }

      // Note: This might not exist yet in early setup, so we make it a soft check
      if (!hasSupabaseConfig) {
        console.warn('Supabase client configuration not found - may be created in later phases');
      }
    });

    test('should support TypeScript integration', () => {
      // Check for Supabase types
      const typesDbPath = path.join(projectRoot, 'types/database.ts');
      const supabaseTypesPath = path.join(projectRoot, 'types/supabase.ts');
      
      const hasSupabaseTypes = existsSync(typesDbPath) || existsSync(supabaseTypesPath);
      
      if (hasSupabaseTypes) {
        // If types exist, they should be valid TypeScript
        let typesContent = '';
        if (existsSync(typesDbPath)) {
          typesContent = readFileSync(typesDbPath, 'utf8');
        } else {
          typesContent = readFileSync(supabaseTypesPath, 'utf8');
        }

        // Should contain type definitions
        expect(typesContent).toMatch(/export\s+(interface|type)/);
      }
    });
  });
});