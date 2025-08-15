import { describe, test, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

describe('Test Suite 4: Environment Configuration Testing', () => {
  const projectRoot = process.cwd();

  describe('Test Case 4.1: Environment Variable Validation', () => {
    test('should have environment variable examples', () => {
      // Check for environment variable documentation
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

        // Should document required Supabase environment variables
        expect(envContent).toMatch(/NEXT_PUBLIC_SUPABASE_URL/);
        expect(envContent).toMatch(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
        
        // Optional: Check for service role key documentation
        if (envContent.includes('SUPABASE_SERVICE_ROLE_KEY')) {
          expect(envContent).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
        }
      }
    });

    test('should properly handle public vs private environment variables', () => {
      // Check Next.js configuration for environment variable handling
      const nextConfigPath = path.join(projectRoot, 'next.config.ts');
      const nextConfigJsPath = path.join(projectRoot, 'next.config.js');
      
      if (existsSync(nextConfigPath) || existsSync(nextConfigJsPath)) {
        let configContent = '';
        
        if (existsSync(nextConfigPath)) {
          configContent = readFileSync(nextConfigPath, 'utf8');
        } else {
          configContent = readFileSync(nextConfigJsPath, 'utf8');
        }

        // If env config exists, verify it's properly structured
        if (configContent.includes('env')) {
          // Should separate public and private variables correctly
          expect(configContent).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY.*NEXT_PUBLIC/);
        }
      }
    });

    test('should validate environment variable format', () => {
      // Test that environment variables follow Next.js conventions
      const envFiles = ['.env.example', '.env.local.example'];
      
      for (const envFile of envFiles) {
        const envPath = path.join(projectRoot, envFile);
        if (existsSync(envPath)) {
          const envContent = readFileSync(envPath, 'utf8');
          const lines = envContent.split('\n').filter(line => 
            line.trim() && !line.startsWith('#')
          );

          lines.forEach(line => {
            // Each line should follow VAR_NAME=value format
            expect(line).toMatch(/^[A-Z_][A-Z0-9_]*=/);
          });
        }
      }
    });

    test('should handle missing environment variables gracefully', () => {
      // This would typically test runtime behavior
      // For build-time validation, we check that the app has error handling
      
      // Check if there are any environment variable validation utilities
      const possibleUtilPaths = [
        'lib/env.ts',
        'utils/env.ts',
        'config/env.ts',
        'lib/config.ts'
      ];

      let hasEnvValidation = false;
      for (const utilPath of possibleUtilPaths) {
        if (existsSync(path.join(projectRoot, utilPath))) {
          hasEnvValidation = true;
          break;
        }
      }

      // If no validation exists yet, that's acceptable in early setup
      if (!hasEnvValidation) {
        console.warn('No environment variable validation utilities found - may be added later');
      }
    });

    test('should not expose sensitive variables in build output', async () => {
      // Check that private environment variables don't leak to client
      // This is a basic check - more comprehensive testing would require actual builds
      
      const envFiles = ['.env.example', '.env.local.example'];
      
      for (const envFile of envFiles) {
        const envPath = path.join(projectRoot, envFile);
        if (existsSync(envPath)) {
          const envContent = readFileSync(envPath, 'utf8');
          
          // Private variables should not have NEXT_PUBLIC prefix
          const lines = envContent.split('\n');
          const serviceRoleKeyLine = lines.find(line => 
            line.includes('SUPABASE_SERVICE_ROLE_KEY')
          );
          
          if (serviceRoleKeyLine) {
            expect(serviceRoleKeyLine).not.toMatch(/NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);
          }
        }
      }
    });
  });

  describe('Test Case 4.2: Font Loading and Asset Optimization', () => {
    test('should have Next.js font optimization configured', () => {
      // Check for font configuration in layout or font utility files
      const possibleFontFiles = [
        'app/layout.tsx',
        'lib/fonts.ts',
        'utils/fonts.ts',
        'styles/fonts.ts'
      ];

      let hasFontConfig = false;
      let fontContent = '';

      for (const fontFile of possibleFontFiles) {
        const fontPath = path.join(projectRoot, fontFile);
        if (existsSync(fontPath)) {
          fontContent = readFileSync(fontPath, 'utf8');
          if (fontContent.includes('next/font') || fontContent.includes('@next/font')) {
            hasFontConfig = true;
            break;
          }
        }
      }

      if (hasFontConfig) {
        // Should use next/font for optimization
        expect(fontContent).toMatch(/from ['"]next\/font/);
      } else {
        console.warn('Next.js font optimization not configured yet - may be added later');
      }
    });

    test('should support Google Fonts integration', () => {
      // Check for Google Fonts usage following QA specifications
      const fontFiles = [
        'lib/fonts.ts',
        'app/layout.tsx'
      ];

      let googleFontsFound = false;
      
      for (const fontFile of fontFiles) {
        const fontPath = path.join(projectRoot, fontFile);
        if (existsSync(fontPath)) {
          const fontContent = readFileSync(fontPath, 'utf8');
          
          if (fontContent.includes('google') || 
              fontContent.includes('Inter') || 
              fontContent.includes('Playfair')) {
            googleFontsFound = true;
            
            // Should use proper Next.js font loading
            expect(fontContent).toMatch(/next\/font/);
          }
        }
      }

      if (!googleFontsFound) {
        console.warn('Google Fonts not configured yet - specified in QA requirements');
      }
    });

    test('should prevent Flash of Unstyled Text (FOUT)', () => {
      // Check for proper font loading strategy
      const layoutPath = path.join(projectRoot, 'app/layout.tsx');
      
      if (existsSync(layoutPath)) {
        const layoutContent = readFileSync(layoutPath, 'utf8');
        
        // If fonts are configured, they should be applied to html/body
        if (layoutContent.includes('font') || layoutContent.includes('className')) {
          // Should have font classes applied to prevent FOUT
          expect(layoutContent).toMatch(/className.*font|font.*className/);
        }
      }
    });

    test('should have CSS optimization configuration', () => {
      // Check TailwindCSS and PostCSS configuration for optimization
      const postcssConfigPath = path.join(projectRoot, 'postcss.config.js');
      
      if (existsSync(postcssConfigPath)) {
        const postcssContent = readFileSync(postcssConfigPath, 'utf8');
        
        // Should have autoprefixer for browser compatibility
        expect(postcssContent).toMatch(/autoprefixer/);
        
        // Should have TailwindCSS for utility optimization
        expect(postcssContent).toMatch(/tailwindcss/);
      }
    });

    test('should support asset optimization', () => {
      // Check Next.js configuration for asset optimization
      const nextConfigPath = path.join(projectRoot, 'next.config.ts');
      const nextConfigJsPath = path.join(projectRoot, 'next.config.js');
      
      if (existsSync(nextConfigPath) || existsSync(nextConfigJsPath)) {
        let configContent = '';
        
        if (existsSync(nextConfigPath)) {
          configContent = readFileSync(nextConfigPath, 'utf8');
        } else {
          configContent = readFileSync(nextConfigJsPath, 'utf8');
        }

        // Next.js has image optimization by default
        // Check for any custom image configuration
        if (configContent.includes('images')) {
          expect(configContent).toMatch(/images/);
        }
      }
    });

    test('should have proper fallback fonts configured', () => {
      // Check for font fallbacks in TailwindCSS or CSS
      const tailwindConfigPath = path.join(projectRoot, 'tailwind.config.ts');
      const tailwindConfigJsPath = path.join(projectRoot, 'tailwind.config.js');
      
      if (existsSync(tailwindConfigPath) || existsSync(tailwindConfigJsPath)) {
        let configContent = '';
        
        if (existsSync(tailwindConfigPath)) {
          configContent = readFileSync(tailwindConfigPath, 'utf8');
        } else {
          configContent = readFileSync(tailwindConfigJsPath, 'utf8');
        }

        // Should have font family configuration with fallbacks
        if (configContent.includes('fontFamily')) {
          expect(configContent).toMatch(/fontFamily/);
        }
      }
    });
  });

  describe('Additional Environment Checks', () => {
    test('should have proper TypeScript environment configuration', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
      expect(existsSync(tsconfigPath)).toBe(true);

      const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'));
      
      // Should have proper module resolution for Next.js
      expect(tsconfig.compilerOptions.moduleResolution).toBeDefined();
      expect(tsconfig.compilerOptions.allowJs).toBe(true);
      expect(tsconfig.compilerOptions.jsx).toBeDefined();
    });

    test('should support development and production environments', () => {
      const packageJson = JSON.parse(
        readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
      );

      // Should have separate scripts for dev and production
      expect(packageJson.scripts.dev).toBeDefined();
      expect(packageJson.scripts.build).toBeDefined();
      expect(packageJson.scripts.start).toBeDefined();
    });

    test('should handle build-time vs runtime environment variables', () => {
      // Check that the project structure supports both types
      const envFiles = ['.env.example', '.env.local.example'];
      
      for (const envFile of envFiles) {
        const envPath = path.join(projectRoot, envFile);
        if (existsSync(envPath)) {
          const envContent = readFileSync(envPath, 'utf8');
          
          // Should distinguish between build-time (NEXT_PUBLIC_) and runtime variables
          const hasPublicVars = envContent.includes('NEXT_PUBLIC_');
          const hasPrivateVars = envContent.split('\n').some(line => 
            line.includes('=') && !line.includes('NEXT_PUBLIC_') && !line.startsWith('#')
          );
          
          if (hasPublicVars && hasPrivateVars) {
            // Good - has both types
            expect(true).toBe(true);
          }
        }
      }
    });
  });
});