/**
 * Execute HNSW Index Optimization Script
 * 
 * Runs the complete HNSW index optimization for multi-resolution embeddings
 */

import { executeHNSWOptimization } from '../lib/ai/hnsw-index-optimizer';

async function main() {
  try {
    console.log('🚀 Starting HNSW Index Optimization for ScentMatch AI System...\n');
    
    const result = await executeHNSWOptimization();
    
    if (result.optimization_completed) {
      console.log('🎉 SUCCESS: HNSW Index Optimization completed successfully!');
      console.log(`📈 Performance Improvement: ${result.performance_improvement}`);
      console.log(`🚀 Production Ready: ${result.production_ready}`);
    } else {
      console.log('⚠️  PARTIAL SUCCESS: Some optimizations may need attention');
      console.log('📋 Review the summary for details');
    }
    
    console.log('\n📊 Optimization Summary:');
    console.log('========================');
    console.log(JSON.stringify(result.summary, null, 2));
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ HNSW optimization failed:', error);
    process.exit(1);
  }
}

main();