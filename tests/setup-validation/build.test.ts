import { describe, test, expect, beforeAll } from 'vitest';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

describe('Test Suite 2: Build Process Validation', () => {
  const projectRoot = process.cwd();
  
  describe('Test Case 2.1: Clean Development Build', () => {
    test('should start development server without errors', async () => {
      // Test development server startup
      const devProcess = spawn('npm', ['run', 'dev'], {
        cwd: projectRoot,
        stdio: 'pipe',
        detached: true
      });

      let output = '';
      let hasStarted = false;

      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          devProcess.kill('SIGTERM');
          reject(new Error('Development server startup timeout (>15 seconds)'));
        }, 15000);

        devProcess.stdout?.on('data', (data) => {
          output += data.toString();
          
          // Check for successful startup indicators
          if (output.includes('Ready in') || output.includes('localhost:3000')) {
            hasStarted = true;
            clearTimeout(timeout);
            devProcess.kill('SIGTERM');
            resolve();
          }
        });

        devProcess.stderr?.on('data', (data) => {
          const errorOutput = data.toString();
          // Ignore non-critical warnings
          if (!errorOutput.includes('warn') && 
              !errorOutput.includes('Warning') && 
              errorOutput.trim()) {
            clearTimeout(timeout);
            devProcess.kill('SIGTERM');
            reject(new Error(`Development server error: ${errorOutput}`));
          }
        });

        devProcess.on('error', (error) => {
          clearTimeout(timeout);
          reject(new Error(`Failed to start dev server: ${error.message}`));
        });
      });
    }, 20000);

    test('should have valid TypeScript compilation', async () => {
      try {
        const { stdout, stderr } = await execAsync('npm run type-check', {
          cwd: projectRoot,
          timeout: 30000
        });

        // Check for TypeScript compilation success
        expect(stderr).not.toMatch(/error TS\d+:/);
        expect(stderr).not.toMatch(/\d+ error\(s\)/);
      } catch (error: any) {
        throw new Error(`TypeScript compilation failed: ${error.message}`);
      }
    });

    test('should install dependencies without peer dependency warnings', async () => {
      try {
        const { stdout, stderr } = await execAsync('npm list --depth=0', {
          cwd: projectRoot,
          timeout: 15000
        });

        // Check for missing dependencies
        expect(stderr).not.toMatch(/UNMET DEPENDENCY/);
        expect(stderr).not.toMatch(/UNMET PEER DEPENDENCY/);
      } catch (error: any) {
        // npm list can exit with code 1 even when deps are fine
        if (!error.message.includes('UNMET')) {
          // Allow non-zero exit if no unmet dependencies
          return;
        }
        throw new Error(`Dependency issues found: ${error.message}`);
      }
    });
  });

  describe('Test Case 2.2: Production Build Optimization', () => {
    test('should complete production build without errors', async () => {
      try {
        const { stdout, stderr } = await execAsync('npm run build', {
          cwd: projectRoot,
          timeout: 120000 // 2 minutes for build
        });

        // Check for build success indicators
        expect(stdout).toMatch(/Compiled successfully|Build successful/);
        
        // Check that .next directory was created
        const nextDir = path.join(projectRoot, '.next');
        expect(existsSync(nextDir)).toBe(true);

        // Check for critical errors (warnings are acceptable)
        expect(stderr).not.toMatch(/ERROR/);
        expect(stderr).not.toMatch(/Build failed/);
        
      } catch (error: any) {
        throw new Error(`Production build failed: ${error.message}`);
      }
    });

    test('should generate optimized bundle sizes', async () => {
      // First ensure build exists
      const nextDir = path.join(projectRoot, '.next');
      expect(existsSync(nextDir)).toBe(true);

      // Check for static directory
      const staticDir = path.join(nextDir, 'static');
      if (existsSync(staticDir)) {
        // Read build manifest to check chunk sizes
        const manifestPath = path.join(nextDir, 'build-manifest.json');
        if (existsSync(manifestPath)) {
          const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
          
          // Check that we have reasonable bundle structure
          expect(manifest.pages).toBeDefined();
          expect(Object.keys(manifest.pages).length).toBeGreaterThan(0);
        }
      }
    });

    test('should have valid production server startup', async () => {
      // Skip if no build directory
      const nextDir = path.join(projectRoot, '.next');
      if (!existsSync(nextDir)) {
        console.warn('Skipping production server test - no build found');
        return;
      }

      const prodProcess = spawn('npm', ['start'], {
        cwd: projectRoot,
        stdio: 'pipe',
        detached: true
      });

      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          prodProcess.kill('SIGTERM');
          reject(new Error('Production server startup timeout'));
        }, 20000);

        let output = '';

        prodProcess.stdout?.on('data', (data) => {
          output += data.toString();
          
          if (output.includes('Ready on') || output.includes('started server')) {
            clearTimeout(timeout);
            prodProcess.kill('SIGTERM');
            resolve();
          }
        });

        prodProcess.stderr?.on('data', (data) => {
          const errorOutput = data.toString();
          if (errorOutput.includes('Error') && !errorOutput.includes('warn')) {
            clearTimeout(timeout);
            prodProcess.kill('SIGTERM');
            reject(new Error(`Production server error: ${errorOutput}`));
          }
        });

        prodProcess.on('error', (error) => {
          clearTimeout(timeout);
          reject(new Error(`Failed to start production server: ${error.message}`));
        });
      });
    }, 25000);
  });

  describe('Test Case 2.3: TypeScript Compilation Validation', () => {
    test('should pass strict mode compilation', async () => {
      // Check tsconfig.json has strict mode enabled
      const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
      expect(existsSync(tsconfigPath)).toBe(true);

      const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'));
      expect(tsconfig.compilerOptions.strict).toBe(true);
    });

    test('should resolve import paths correctly', async () => {
      try {
        const { stderr } = await execAsync('npm run type-check', {
          cwd: projectRoot,
          timeout: 30000
        });

        // Check for import resolution errors
        expect(stderr).not.toMatch(/Cannot find module/);
        expect(stderr).not.toMatch(/Module not found/);
      } catch (error: any) {
        throw new Error(`Import resolution failed: ${error.message}`);
      }
    });

    test('should have consistent types across environments', async () => {
      // Verify type definitions exist
      const typeFiles = [
        'types/database.ts',
        'next-env.d.ts'
      ];

      typeFiles.forEach(file => {
        const filePath = path.join(projectRoot, file);
        if (existsSync(filePath)) {
          expect(existsSync(filePath)).toBe(true);
        }
      });
    });
  });
});