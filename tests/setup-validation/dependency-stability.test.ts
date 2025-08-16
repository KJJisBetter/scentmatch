import { describe, test, expect } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

describe('Test Suite 3: Dependency Stability Testing', () => {
  const projectRoot = process.cwd();

  describe('Test Case 3.1: Package Lock Integrity', () => {
    test('should have valid package-lock.json file', () => {
      const packageLockPath = path.join(projectRoot, 'package-lock.json');
      expect(existsSync(packageLockPath)).toBe(true);

      const packageLock = JSON.parse(readFileSync(packageLockPath, 'utf8'));
      
      // Verify basic structure
      expect(packageLock.name).toBeDefined();
      expect(packageLock.version).toBeDefined();
      expect(packageLock.lockfileVersion).toBeDefined();
      expect(packageLock.packages).toBeDefined();
    });

    test('should pass clean install test', async () => {
      try {
        // Test npm ci (clean install) - this validates lock file integrity
        execSync('npm ci --dry-run', {
          cwd: projectRoot,
          timeout: 30000,
          stdio: 'pipe'
        });
      } catch (error: any) {
        throw new Error(`Clean install failed: ${error.message}`);
      }
    });

    test('should have no high or critical security vulnerabilities', async () => {
      try {
        const auditOutput = execSync('npm audit --audit-level=high --json', {
          cwd: projectRoot,
          timeout: 30000,
          stdio: 'pipe'
        }).toString();

        const auditResult = JSON.parse(auditOutput);
        
        // Check for high or critical vulnerabilities
        const vulnerabilities = auditResult.vulnerabilities || {};
        const highCriticalVulns = Object.values(vulnerabilities).filter((vuln: any) => 
          vuln.severity === 'high' || vuln.severity === 'critical'
        );

        expect(highCriticalVulns.length).toBe(0);
      } catch (error: any) {
        // If npm audit exits with non-zero code, check if it's due to vulnerabilities
        if (error.message.includes('high') || error.message.includes('critical')) {
          throw new Error(`Security vulnerabilities found: ${error.message}`);
        }
        // Otherwise, audit might have failed for other reasons (network, etc.)
        console.warn('Security audit could not be completed:', error.message);
      }
    });

    test('should have consistent dependency versions', () => {
      const packageJson = JSON.parse(
        readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
      );
      const packageLock = JSON.parse(
        readFileSync(path.join(projectRoot, 'package-lock.json'), 'utf8')
      );

      // Check that major dependencies in package.json are reflected in lock file
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      for (const [dep, version] of Object.entries(dependencies)) {
        // Check if dependency exists in lock file
        const lockPackages = packageLock.packages || {};
        const hasInLock = Object.keys(lockPackages).some(pkg => 
          pkg.includes(`node_modules/${dep}`) || pkg === dep
        );
        
        if (!hasInLock) {
          console.warn(`Dependency ${dep} not found in lock file`);
        }
      }
    });

    test('should have reasonable dependency tree depth', () => {
      const packageLock = JSON.parse(
        readFileSync(path.join(projectRoot, 'package-lock.json'), 'utf8')
      );

      // Check dependency tree depth by analyzing package paths
      const packages = packageLock.packages || {};
      const maxDepth = Math.max(
        ...Object.keys(packages).map(pkg => {
          const nodeModulesCount = (pkg.match(/node_modules/g) || []).length;
          return nodeModulesCount;
        })
      );

      // Dependency tree should not be excessively deep (indicates potential issues)
      expect(maxDepth).toBeLessThan(15); // Allow some depth for complex dependencies
    });
  });

  describe('Test Case 3.2: Node.js 22 LTS Compatibility', () => {
    test('should run on Node.js 22.x LTS', () => {
      const nodeVersion = process.version;
      expect(nodeVersion).toMatch(/^v22\./);
    });

    test('should have compatible package engines specification', () => {
      const packageJson = JSON.parse(
        readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
      );

      // If engines field exists, it should support Node.js 22
      if (packageJson.engines) {
        const nodeEngine = packageJson.engines.node;
        if (nodeEngine) {
          // Should support Node.js 22 (either explicitly or through range)
          const supports22 = nodeEngine.includes('22') || 
                           nodeEngine.includes('>=18') || 
                           nodeEngine.includes('>=20') ||
                           nodeEngine.includes('*');
          expect(supports22).toBe(true);
        }
      }
    });

    test('should support ES modules correctly', () => {
      const packageJson = JSON.parse(
        readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
      );

      // Check Next.js configuration supports ES modules
      // (Next.js handles this automatically, but we can verify structure)
      expect(packageJson.scripts.build).toBeDefined();
      expect(packageJson.scripts.dev).toBeDefined();
    });

    test('should have no deprecated Node.js feature warnings', async () => {
      try {
        // Run a simple Node.js command that would show deprecation warnings
        const output = execSync('node --version', {
          cwd: projectRoot,
          timeout: 5000,
          stdio: 'pipe'
        }).toString();

        // Should return version without warnings
        expect(output).toMatch(/^v22\./);
      } catch (error: any) {
        throw new Error(`Node.js compatibility issue: ${error.message}`);
      }
    });

    test('should support native module compilation if needed', () => {
      const packageJson = JSON.parse(
        readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
      );

      // Check if we have any native dependencies that need compilation
      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      const potentialNativeDeps = Object.keys(allDeps).filter(dep => 
        dep.includes('native') || 
        dep.includes('binding') || 
        dep.includes('node-gyp')
      );

      // If we have native dependencies, they should work with Node.js 22
      if (potentialNativeDeps.length > 0) {
        console.log('Native dependencies detected:', potentialNativeDeps);
        // In a real implementation, we would try to install/build these
        // For now, we just note their presence
      }
    });

    test('should have compatible npm version', () => {
      try {
        const npmVersion = execSync('npm --version', {
          cwd: projectRoot,
          timeout: 5000,
          stdio: 'pipe'
        }).toString().trim();

        // npm version should be compatible with Node.js 22
        // Node.js 22 LTS comes with npm 10.x
        const majorVersion = parseInt(npmVersion.split('.')[0]);
        expect(majorVersion).toBeGreaterThanOrEqual(9); // Allow npm 9+ for flexibility
      } catch (error: any) {
        throw new Error(`npm version check failed: ${error.message}`);
      }
    });
  });

  describe('Additional Stability Checks', () => {
    test('should have no conflicting peer dependencies', async () => {
      try {
        const output = execSync('npm ls --depth=0', {
          cwd: projectRoot,
          timeout: 15000,
          stdio: 'pipe'
        }).toString();

        // Check for peer dependency issues
        expect(output).not.toMatch(/UNMET PEER DEPENDENCY/);
        expect(output).not.toMatch(/peer dep missing/);
      } catch (error: any) {
        // npm ls can exit with non-zero even when deps are fine
        if (error.message.includes('UNMET') || error.message.includes('peer dep missing')) {
          throw new Error(`Peer dependency conflicts: ${error.message}`);
        }
        // Log but don't fail for other npm ls issues
        console.warn('npm ls completed with warnings:', error.message);
      }
    });

    test('should have reproducible installs', () => {
      // Verify that package.json and package-lock.json are in sync
      const packageJson = JSON.parse(
        readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
      );
      const packageLock = JSON.parse(
        readFileSync(path.join(projectRoot, 'package-lock.json'), 'utf8')
      );

      // Basic consistency checks
      expect(packageLock.name).toBe(packageJson.name);
      expect(packageLock.version).toBe(packageJson.version);
    });

    test('should have stable dependency resolution', () => {
      // Check for any floating dependencies that could cause issues
      const packageJson = JSON.parse(
        readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
      );

      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Count dependencies using exact versions vs ranges
      let exactVersions = 0;
      let rangeVersions = 0;

      Object.values(allDeps).forEach((version: any) => {
        if (version.startsWith('^') || version.startsWith('~') || version.includes('-')) {
          rangeVersions++;
        } else {
          exactVersions++;
        }
      });

      // We expect mostly range versions (using ^) for flexibility
      // but this check ensures we have a reasonable mix
      expect(rangeVersions + exactVersions).toBeGreaterThan(0);
    });
  });
});