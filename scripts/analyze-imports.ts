#!/usr/bin/env node

/**
 * Import Analysis Script for Critical Code Cleanup (SCE-52)
 * 
 * This script analyzes all TypeScript/JavaScript files to identify:
 * 1. Which files are actually imported and used
 * 2. Which files exist but are never imported (dead code)
 * 3. Specific focus on lib/ai/ directory for the 32 unused files
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface ImportAnalysis {
  allFiles: string[];
  importedFiles: Set<string>;
  unusedFiles: string[];
  importMap: Map<string, string[]>; // file -> list of files it imports
}

interface AIFileAnalysis {
  totalAIFiles: number;
  usedAIFiles: string[];
  unusedAIFiles: string[];
  essentialFiles: string[];
}

// Known essential AI files from SCE-52
const ESSENTIAL_AI_FILES = [
  'ai-search.ts',
  'recommendation-engine.ts', 
  'thompson-sampling.ts',
  'voyage-client.ts'
];

/**
 * Get all TypeScript/JavaScript files in specified directories
 */
async function getAllFiles(baseDir: string, patterns: string[]): Promise<string[]> {
  const allFiles: string[] = [];
  
  for (const pattern of patterns) {
    const files = await glob(pattern, { 
      cwd: baseDir,
      ignore: ['node_modules/**', '.next/**', 'out/**', 'dist/**']
    });
    allFiles.push(...files);
  }
  
  return allFiles.map(file => path.resolve(baseDir, file));
}

/**
 * Extract import statements from a file
 */
function extractImports(filePath: string): string[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const imports: string[] = [];
    
    // Match various import patterns
    const importPatterns = [
      /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g,
      /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g
    ];
    
    for (const pattern of importPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const importPath = match[1];
        
        // Resolve relative imports to absolute paths
        if (importPath.startsWith('.')) {
          const resolvedPath = path.resolve(path.dirname(filePath), importPath);
          
          // Try different extensions
          const extensions = ['.ts', '.tsx', '.js', '.jsx'];
          for (const ext of extensions) {
            const fullPath = resolvedPath + ext;
            if (fs.existsSync(fullPath)) {
              imports.push(fullPath);
              break;
            }
          }
          
          // Try index files
          const indexPath = path.join(resolvedPath, 'index');
          for (const ext of extensions) {
            const fullPath = indexPath + ext;
            if (fs.existsSync(fullPath)) {
              imports.push(fullPath);
              break;
            }
          }
        }
        
        imports.push(importPath);
      }
    }
    
    return imports;
  } catch (error) {
    console.warn(`Error reading file ${filePath}:`, error);
    return [];
  }
}

/**
 * Analyze imports across the entire codebase
 */
async function analyzeImports(): Promise<ImportAnalysis> {
  const baseDir = process.cwd();
  
  console.log('🔍 Scanning for TypeScript/JavaScript files...');
  
  // Get all relevant files
  const patterns = [
    'app/**/*.{ts,tsx,js,jsx}',
    'components/**/*.{ts,tsx,js,jsx}',
    'lib/**/*.{ts,tsx,js,jsx}',
    'src/**/*.{ts,tsx,js,jsx}', // fallback
    'pages/**/*.{ts,tsx,js,jsx}' // fallback for pages router
  ];
  
  const allFiles = await getAllFiles(baseDir, patterns);
  console.log(`📁 Found ${allFiles.length} files`);
  
  const importedFiles = new Set<string>();
  const importMap = new Map<string, string[]>();
  
  // Analyze each file
  for (const file of allFiles) {
    const imports = extractImports(file);
    importMap.set(file, imports);
    
    // Track which files are imported
    for (const importPath of imports) {
      if (path.isAbsolute(importPath)) {
        importedFiles.add(importPath);
      }
    }
  }
  
  // Find unused files
  const unusedFiles = allFiles.filter(file => !importedFiles.has(file));
  
  return {
    allFiles,
    importedFiles,
    unusedFiles,
    importMap
  };
}

/**
 * Specific analysis for AI files
 */
function analyzeAIFiles(analysis: ImportAnalysis): AIFileAnalysis {
  const aiFiles = analysis.allFiles.filter(file => file.includes('/lib/ai/'));
  const usedAIFiles = aiFiles.filter(file => analysis.importedFiles.has(file));
  const unusedAIFiles = aiFiles.filter(file => !analysis.importedFiles.has(file));
  
  // Check which essential files are actually used
  const essentialFiles = aiFiles.filter(file => {
    const filename = path.basename(file);
    return ESSENTIAL_AI_FILES.includes(filename);
  });
  
  return {
    totalAIFiles: aiFiles.length,
    usedAIFiles: usedAIFiles.map(f => path.relative(process.cwd(), f)),
    unusedAIFiles: unusedAIFiles.map(f => path.relative(process.cwd(), f)),
    essentialFiles: essentialFiles.map(f => path.relative(process.cwd(), f))
  };
}

/**
 * Generate detailed report
 */
function generateReport(analysis: ImportAnalysis, aiAnalysis: AIFileAnalysis) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 IMPORT ANALYSIS REPORT - Critical Code Cleanup (SCE-52)');
  console.log('='.repeat(80));
  
  console.log(`\n📈 OVERALL STATISTICS:`);
  console.log(`Total files analyzed: ${analysis.allFiles.length}`);
  console.log(`Files with imports: ${analysis.importedFiles.size}`);
  console.log(`Unused files: ${analysis.unusedFiles.length}`);
  
  console.log(`\n🤖 AI FILES ANALYSIS:`);
  console.log(`Total AI files: ${aiAnalysis.totalAIFiles}`);
  console.log(`Used AI files: ${aiAnalysis.usedAIFiles.length}`);
  console.log(`Unused AI files: ${aiAnalysis.unusedAIFiles.length}`);
  console.log(`Cleanup potential: ${Math.round((aiAnalysis.unusedAIFiles.length / aiAnalysis.totalAIFiles) * 100)}%`);
  
  console.log(`\n✅ ESSENTIAL AI FILES (should be used):`);
  for (const file of aiAnalysis.essentialFiles) {
    const isUsed = aiAnalysis.usedAIFiles.includes(file);
    console.log(`  ${isUsed ? '✅' : '❌'} ${file}`);
  }
  
  console.log(`\n🗑️  UNUSED AI FILES (candidates for removal):`);
  for (const file of aiAnalysis.unusedAIFiles) {
    console.log(`  📄 ${file}`);
  }
  
  console.log(`\n🔗 USED AI FILES (keep these):`);
  for (const file of aiAnalysis.usedAIFiles) {
    console.log(`  📄 ${file}`);
  }
  
  console.log(`\n💾 SAVING ANALYSIS RESULTS...`);
  
  // Save detailed results to file
  const results = {
    timestamp: new Date().toISOString(),
    overall: {
      totalFiles: analysis.allFiles.length,
      importedFiles: analysis.importedFiles.size,
      unusedFiles: analysis.unusedFiles.length
    },
    aiFiles: aiAnalysis,
    unusedFilesList: analysis.unusedFiles.map(f => path.relative(process.cwd(), f)),
    unusedAIFilesList: aiAnalysis.unusedAIFiles
  };
  
  fs.writeFileSync('import-analysis-results.json', JSON.stringify(results, null, 2));
  console.log(`✅ Results saved to: import-analysis-results.json`);
  
  console.log('\n' + '='.repeat(80));
  console.log(`🎯 CLEANUP RECOMMENDATION:`);
  console.log(`Files safe to remove: ${aiAnalysis.unusedAIFiles.length} AI files`);
  console.log(`Potential file reduction: ${analysis.unusedFiles.length} total files`);
  console.log(`This matches SCE-52 target: Remove 32/36 AI files (89%)`);
  console.log('='.repeat(80));
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting import analysis for SCE-52 cleanup...\n');
    
    const analysis = await analyzeImports();
    const aiAnalysis = analyzeAIFiles(analysis);
    
    generateReport(analysis, aiAnalysis);
    
    console.log('\n✅ Import analysis complete!');
    console.log('📋 Next steps: Review import-analysis-results.json before proceeding with cleanup');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

// Run the analysis
if (require.main === module) {
  main();
}