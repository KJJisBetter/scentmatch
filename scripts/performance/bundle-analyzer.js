const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Bundle Analysis Script
 * Analyzes bundle size impact and optimization opportunities
 */

class BundleAnalyzer {
  constructor() {
    this.buildDir = path.join(process.cwd(), '.next');
    this.resultsDir = path.join(process.cwd(), 'test-results', 'bundle-analysis');
    this.baselineFile = path.join(this.resultsDir, 'baseline.json');
    
    // Ensure results directory exists
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }

  async analyzeBundles() {
    console.log('🔍 Analyzing bundle sizes...\n');

    try {
      // Build the application
      console.log('Building application...');
      execSync('npm run build', { stdio: 'inherit' });

      // Analyze bundle composition
      const bundleStats = await this.getBundleStats();
      const analysis = await this.performAnalysis(bundleStats);
      
      // Compare with baseline if exists
      const comparison = await this.compareWithBaseline(bundleStats);
      
      // Generate report
      await this.generateReport(bundleStats, analysis, comparison);
      
      // Save current stats as potential new baseline
      await this.saveCurrentStats(bundleStats);

      return {
        bundleStats,
        analysis,
        comparison,
        passed: this.validateBundleSize(bundleStats, comparison)
      };

    } catch (error) {
      console.error('❌ Bundle analysis failed:', error.message);
      throw error;
    }
  }

  async getBundleStats() {
    const stats = {
      javascript: { files: [], totalSize: 0 },
      css: { files: [], totalSize: 0 },
      images: { files: [], totalSize: 0 },
      other: { files: [], totalSize: 0 },
      total: 0,
      timestamp: Date.now()
    };

    // Analyze .next/static directory
    const staticDir = path.join(this.buildDir, 'static');
    
    if (fs.existsSync(staticDir)) {
      await this.analyzeDirectory(staticDir, stats);
    }

    // Calculate totals
    stats.total = stats.javascript.totalSize + stats.css.totalSize + 
                  stats.images.totalSize + stats.other.totalSize;

    return stats;
  }

  async analyzeDirectory(dir, stats) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        await this.analyzeDirectory(itemPath, stats);
      } else {
        const size = stat.size;
        const ext = path.extname(item).toLowerCase();
        const relativePath = path.relative(this.buildDir, itemPath);

        const fileInfo = {
          path: relativePath,
          name: item,
          size: size,
          sizeKB: (size / 1024).toFixed(2),
          sizeMB: (size / (1024 * 1024)).toFixed(2)
        };

        if (ext === '.js') {
          stats.javascript.files.push(fileInfo);
          stats.javascript.totalSize += size;
        } else if (ext === '.css') {
          stats.css.files.push(fileInfo);
          stats.css.totalSize += size;
        } else if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico'].includes(ext)) {
          stats.images.files.push(fileInfo);
          stats.images.totalSize += size;
        } else {
          stats.other.files.push(fileInfo);
          stats.other.totalSize += size;
        }
      }
    }
  }

  async performAnalysis(stats) {
    const analysis = {
      summary: {
        totalFiles: 0,
        totalSizeKB: (stats.total / 1024).toFixed(2),
        totalSizeMB: (stats.total / (1024 * 1024)).toFixed(2)
      },
      javascript: {
        fileCount: stats.javascript.files.length,
        totalSizeKB: (stats.javascript.totalSize / 1024).toFixed(2),
        averageSizeKB: stats.javascript.files.length > 0 ? 
          (stats.javascript.totalSize / stats.javascript.files.length / 1024).toFixed(2) : 0,
        largestFiles: stats.javascript.files
          .sort((a, b) => b.size - a.size)
          .slice(0, 5)
      },
      css: {
        fileCount: stats.css.files.length,
        totalSizeKB: (stats.css.totalSize / 1024).toFixed(2),
        largestFiles: stats.css.files
          .sort((a, b) => b.size - a.size)
          .slice(0, 3)
      },
      recommendations: []
    };

    // Calculate total files
    analysis.summary.totalFiles = stats.javascript.files.length + 
                                 stats.css.files.length + 
                                 stats.images.files.length + 
                                 stats.other.files.length;

    // Generate recommendations
    this.generateRecommendations(stats, analysis);

    return analysis;
  }

  generateRecommendations(stats, analysis) {
    // JavaScript bundle size recommendations
    if (stats.javascript.totalSize > 500 * 1024) {
      analysis.recommendations.push({
        type: 'warning',
        category: 'JavaScript',
        message: `JavaScript bundle is ${(stats.javascript.totalSize / 1024).toFixed(0)}KB. Consider code splitting.`,
        impact: 'high'
      });
    }

    // CSS bundle size recommendations
    if (stats.css.totalSize > 100 * 1024) {
      analysis.recommendations.push({
        type: 'warning',
        category: 'CSS',
        message: `CSS bundle is ${(stats.css.totalSize / 1024).toFixed(0)}KB. Consider removing unused styles.`,
        impact: 'medium'
      });
    }

    // Check for duplicate or similar files
    const duplicateJS = this.findDuplicateFiles(stats.javascript.files);
    if (duplicateJS.length > 0) {
      analysis.recommendations.push({
        type: 'info',
        category: 'Optimization',
        message: `Found ${duplicateJS.length} potentially duplicate JavaScript files`,
        impact: 'medium'
      });
    }

    // Check chunk splitting effectiveness
    const chunks = stats.javascript.files.filter(f => f.name.includes('chunks/'));
    if (chunks.length === 0) {
      analysis.recommendations.push({
        type: 'warning',
        category: 'Code Splitting',
        message: 'No code splitting detected. Consider implementing dynamic imports.',
        impact: 'high'
      });
    }

    // Image optimization recommendations
    if (stats.images.totalSize > 1024 * 1024) {
      analysis.recommendations.push({
        type: 'warning',
        category: 'Images',
        message: `Image assets are ${(stats.images.totalSize / (1024 * 1024)).toFixed(1)}MB. Consider optimization.`,
        impact: 'medium'
      });
    }
  }

  findDuplicateFiles(files) {
    const duplicates = [];
    const sizeMap = new Map();

    files.forEach(file => {
      if (sizeMap.has(file.size)) {
        duplicates.push({
          size: file.size,
          files: [sizeMap.get(file.size), file.name]
        });
      } else {
        sizeMap.set(file.size, file.name);
      }
    });

    return duplicates;
  }

  async compareWithBaseline(currentStats) {
    if (!fs.existsSync(this.baselineFile)) {
      return {
        hasBaseline: false,
        message: 'No baseline found. Current stats will be saved as baseline.'
      };
    }

    const baseline = JSON.parse(fs.readFileSync(this.baselineFile, 'utf8'));
    
    const comparison = {
      hasBaseline: true,
      totalChange: currentStats.total - baseline.total,
      totalChangeKB: ((currentStats.total - baseline.total) / 1024).toFixed(2),
      percentChange: baseline.total > 0 ? 
        (((currentStats.total - baseline.total) / baseline.total) * 100).toFixed(1) : 0,
      categories: {
        javascript: {
          change: currentStats.javascript.totalSize - baseline.javascript.totalSize,
          changeKB: ((currentStats.javascript.totalSize - baseline.javascript.totalSize) / 1024).toFixed(2),
          percentChange: baseline.javascript.totalSize > 0 ? 
            (((currentStats.javascript.totalSize - baseline.javascript.totalSize) / baseline.javascript.totalSize) * 100).toFixed(1) : 0
        },
        css: {
          change: currentStats.css.totalSize - baseline.css.totalSize,
          changeKB: ((currentStats.css.totalSize - baseline.css.totalSize) / 1024).toFixed(2),
          percentChange: baseline.css.totalSize > 0 ? 
            (((currentStats.css.totalSize - baseline.css.totalSize) / baseline.css.totalSize) * 100).toFixed(1) : 0
        }
      }
    };

    return comparison;
  }

  validateBundleSize(stats, comparison) {
    const thresholds = {
      totalMaxKB: 600, // 600KB total max
      jsMaxKB: 500,    // 500KB JS max
      cssMaxKB: 100,   // 100KB CSS max
      increaseMaxKB: 50 // 50KB max increase from baseline
    };

    const issues = [];

    // Check absolute thresholds
    if (stats.total > thresholds.totalMaxKB * 1024) {
      issues.push(`Total bundle size (${(stats.total / 1024).toFixed(0)}KB) exceeds limit (${thresholds.totalMaxKB}KB)`);
    }

    if (stats.javascript.totalSize > thresholds.jsMaxKB * 1024) {
      issues.push(`JavaScript bundle (${(stats.javascript.totalSize / 1024).toFixed(0)}KB) exceeds limit (${thresholds.jsMaxKB}KB)`);
    }

    if (stats.css.totalSize > thresholds.cssMaxKB * 1024) {
      issues.push(`CSS bundle (${(stats.css.totalSize / 1024).toFixed(0)}KB) exceeds limit (${thresholds.cssMaxKB}KB)`);
    }

    // Check baseline comparison
    if (comparison.hasBaseline && Math.abs(comparison.totalChange) > thresholds.increaseMaxKB * 1024) {
      const changeType = comparison.totalChange > 0 ? 'increase' : 'decrease';
      issues.push(`Bundle size ${changeType} (${Math.abs(comparison.totalChangeKB)}KB) exceeds threshold (${thresholds.increaseMaxKB}KB)`);
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  async generateReport(stats, analysis, comparison) {
    const reportPath = path.join(this.resultsDir, `bundle-report-${Date.now()}.json`);
    const report = {
      timestamp: new Date().toISOString(),
      stats,
      analysis,
      comparison,
      validation: this.validateBundleSize(stats, comparison)
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate human-readable summary
    const summaryPath = path.join(this.resultsDir, 'latest-summary.md');
    const summary = this.generateMarkdownSummary(report);
    fs.writeFileSync(summaryPath, summary);

    console.log('📊 Bundle Analysis Report Generated:');
    console.log(`   JSON Report: ${reportPath}`);
    console.log(`   Summary: ${summaryPath}`);
    console.log(`\n${summary}`);
  }

  generateMarkdownSummary(report) {
    const { stats, analysis, comparison, validation } = report;
    
    let summary = `# Bundle Analysis Report\n\n`;
    summary += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n\n`;
    
    // Summary
    summary += `## Summary\n\n`;
    summary += `- **Total Files:** ${analysis.summary.totalFiles}\n`;
    summary += `- **Total Size:** ${analysis.summary.totalSizeKB} KB (${analysis.summary.totalSizeMB} MB)\n`;
    summary += `- **JavaScript:** ${analysis.javascript.totalSizeKB} KB (${analysis.javascript.fileCount} files)\n`;
    summary += `- **CSS:** ${analysis.css.totalSizeKB} KB (${analysis.css.fileCount} files)\n\n`;
    
    // Validation Results
    summary += `## Validation Results\n\n`;
    if (validation.passed) {
      summary += `✅ **PASSED** - Bundle size within acceptable limits\n\n`;
    } else {
      summary += `❌ **FAILED** - Bundle size issues detected:\n\n`;
      validation.issues.forEach(issue => {
        summary += `- ${issue}\n`;
      });
      summary += `\n`;
    }
    
    // Baseline Comparison
    if (comparison.hasBaseline) {
      summary += `## Baseline Comparison\n\n`;
      const changeIcon = comparison.totalChange > 0 ? '📈' : '📉';
      summary += `${changeIcon} **Total Change:** ${comparison.totalChangeKB} KB (${comparison.percentChange}%)\n`;
      summary += `- **JavaScript:** ${comparison.categories.javascript.changeKB} KB (${comparison.categories.javascript.percentChange}%)\n`;
      summary += `- **CSS:** ${comparison.categories.css.changeKB} KB (${comparison.categories.css.percentChange}%)\n\n`;
    }
    
    // Recommendations
    if (analysis.recommendations.length > 0) {
      summary += `## Recommendations\n\n`;
      analysis.recommendations.forEach(rec => {
        const icon = rec.type === 'warning' ? '⚠️' : 'ℹ️';
        summary += `${icon} **${rec.category}:** ${rec.message} (Impact: ${rec.impact})\n`;
      });
      summary += `\n`;
    }
    
    // Largest Files
    summary += `## Largest Files\n\n`;
    summary += `### JavaScript\n`;
    analysis.javascript.largestFiles.forEach((file, i) => {
      summary += `${i + 1}. ${file.name} - ${file.sizeKB} KB\n`;
    });
    
    if (analysis.css.largestFiles.length > 0) {
      summary += `\n### CSS\n`;
      analysis.css.largestFiles.forEach((file, i) => {
        summary += `${i + 1}. ${file.name} - ${file.sizeKB} KB\n`;
      });
    }
    
    return summary;
  }

  async saveCurrentStats(stats) {
    const baselineData = {
      timestamp: Date.now(),
      total: stats.total,
      javascript: {
        totalSize: stats.javascript.totalSize,
        fileCount: stats.javascript.files.length
      },
      css: {
        totalSize: stats.css.totalSize,
        fileCount: stats.css.files.length
      },
      images: {
        totalSize: stats.images.totalSize,
        fileCount: stats.images.files.length
      }
    };

    fs.writeFileSync(this.baselineFile, JSON.stringify(baselineData, null, 2));
    console.log(`💾 Baseline saved to ${this.baselineFile}`);
  }
}

// CLI execution
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  
  analyzer.analyzeBundles()
    .then(result => {
      console.log('\n🎯 Bundle analysis complete!');
      
      if (!result.passed) {
        console.log('❌ Bundle size validation failed');
        process.exit(1);
      } else {
        console.log('✅ Bundle size validation passed');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('💥 Bundle analysis failed:', error);
      process.exit(1);
    });
}

module.exports = BundleAnalyzer;