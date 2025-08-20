/**
 * Embedding System Monitoring and Health Dashboard
 * 
 * Provides real-time monitoring, health checks, and performance metrics
 * for the AI embedding generation system.
 */

import { createClient } from '@supabase/supabase-js';
import { getAIService } from '../lib/ai/index.js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Monitoring Configuration
const MONITOR_CONFIG = {
  refreshInterval: 30000, // 30 seconds
  alertThresholds: {
    queueBacklog: 100,
    failureRate: 0.15, // 15%
    avgProcessingTime: 10000, // 10 seconds
    costPerDay: 10.0 // $10/day
  },
  retentionDays: 30
};

class EmbeddingSystemMonitor {
  constructor() {
    this.startTime = Date.now();
    this.alerts = [];
  }

  async getSystemHealthDashboard() {
    console.clear();
    console.log('🤖 ScentMatch AI Embedding System Monitor');
    console.log('=' .repeat(60));
    console.log(`📅 ${new Date().toLocaleString()}\n`);

    // System Overview
    await this.reportSystemOverview();
    
    // Embedding Coverage
    await this.reportEmbeddingCoverage();
    
    // Queue Status
    await this.reportQueueStatus();
    
    // Performance Metrics
    await this.reportPerformanceMetrics();
    
    // Cost Analysis
    await this.reportCostAnalysis();
    
    // Recent Activity
    await this.reportRecentActivity();
    
    // Health Alerts
    await this.checkAndReportAlerts();

    console.log('=' .repeat(60));
    console.log('🔄 Auto-refresh in 30 seconds... (Ctrl+C to exit)');
  }

  async reportSystemOverview() {
    console.log('📊 System Overview:');
    
    try {
      // AI Service Health
      const aiService = getAIService();
      const aiHealth = await aiService.getSystemHealth();
      
      console.log(`   🤖 AI Providers: ${aiHealth.available_providers.length}/${aiHealth.total_providers} available`);
      console.log(`   🌍 Environment: ${aiHealth.environment}`);
      console.log(`   🎯 Status: ${aiHealth.status}`);
      
      // Database Connection
      const { error: dbError } = await supabase
        .from('fragrances')
        .select('id')
        .limit(1);
        
      console.log(`   🗄️  Database: ${dbError ? '❌ Error' : '✅ Connected'}`);
      
    } catch (error) {
      console.log(`   ❌ System check failed: ${error.message}`);
    }
    
    console.log('');
  }

  async reportEmbeddingCoverage() {
    console.log('📈 Embedding Coverage:');
    
    try {
      // Total fragrances
      const { data: totalCount } = await supabase
        .from('fragrances')
        .select('id', { count: 'exact', head: true });

      // Fragrances with embeddings
      const { data: embeddedCount } = await supabase
        .from('fragrances')
        .select('id', { count: 'exact', head: true })
        .not('embedding', 'is', null);

      // Recent embeddings (last 24 hours)
      const { data: recentCount } = await supabase
        .from('fragrances')
        .select('id', { count: 'exact', head: true })
        .not('embedding', 'is', null)
        .gte('embedding_generated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const coveragePercent = totalCount > 0 ? ((embeddedCount || 0) / totalCount * 100).toFixed(1) : '0';
      const missingCount = (totalCount || 0) - (embeddedCount || 0);

      console.log(`   📊 Total Coverage: ${embeddedCount}/${totalCount} (${coveragePercent}%)`);
      console.log(`   ❓ Missing Embeddings: ${missingCount}`);
      console.log(`   ⚡ Generated Today: ${recentCount || 0}`);
      
      // Coverage by model
      const { data: modelStats } = await supabase
        .from('fragrances')
        .select('embedding_model')
        .not('embedding', 'is', null);

      if (modelStats && modelStats.length > 0) {
        const modelCounts = modelStats.reduce((acc, item) => {
          acc[item.embedding_model] = (acc[item.embedding_model] || 0) + 1;
          return acc;
        }, {});

        console.log('   🎯 By Model:');
        Object.entries(modelCounts).forEach(([model, count]) => {
          console.log(`      - ${model}: ${count}`);
        });
      }

    } catch (error) {
      console.log(`   ❌ Coverage check failed: ${error.message}`);
    }
    
    console.log('');
  }

  async reportQueueStatus() {
    console.log('📋 Processing Queue:');
    
    try {
      // Queue status breakdown
      const { data: queueStats } = await supabase
        .from('ai_processing_queue')
        .select('status')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

      const statusCounts = queueStats?.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {}) || {};

      console.log(`   ⏳ Pending: ${statusCounts.pending || 0}`);
      console.log(`   🔄 Processing: ${statusCounts.processing || 0}`);
      console.log(`   ✅ Completed: ${statusCounts.completed || 0}`);
      console.log(`   ❌ Failed: ${statusCounts.failed || 0}`);
      console.log(`   🔁 Retrying: ${statusCounts.retrying || 0}`);

      // Queue backlog alert
      const backlog = (statusCounts.pending || 0) + (statusCounts.processing || 0);
      if (backlog > MONITOR_CONFIG.alertThresholds.queueBacklog) {
        console.log(`   ⚠️  HIGH BACKLOG: ${backlog} tasks pending`);
      }

      // Recent task types
      const { data: recentTasks } = await supabase
        .from('ai_processing_queue')
        .select('task_type')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(100);

      if (recentTasks && recentTasks.length > 0) {
        const taskTypeCounts = recentTasks.reduce((acc, item) => {
          acc[item.task_type] = (acc[item.task_type] || 0) + 1;
          return acc;
        }, {});

        console.log('   📝 Recent Task Types (24h):');
        Object.entries(taskTypeCounts).forEach(([type, count]) => {
          console.log(`      - ${type}: ${count}`);
        });
      }

    } catch (error) {
      console.log(`   ❌ Queue check failed: ${error.message}`);
    }
    
    console.log('');
  }

  async reportPerformanceMetrics() {
    console.log('⚡ Performance Metrics:');
    
    try {
      // Get completed tasks from last 24 hours
      const { data: completedTasks } = await supabase
        .from('ai_processing_queue')
        .select('created_at, started_at, completed_at, task_type')
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (completedTasks && completedTasks.length > 0) {
        // Calculate average processing time
        const processingTimes = completedTasks
          .filter(task => task.started_at && task.completed_at)
          .map(task => {
            const start = new Date(task.started_at).getTime();
            const end = new Date(task.completed_at).getTime();
            return end - start;
          });

        const avgProcessingTime = processingTimes.length > 0
          ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
          : 0;

        console.log(`   ⏱️  Avg Processing Time: ${Math.round(avgProcessingTime / 1000)}s`);
        console.log(`   📊 Tasks Completed (24h): ${completedTasks.length}`);
        
        // Throughput calculation
        const throughputPerHour = Math.round(completedTasks.length);
        console.log(`   🚀 Throughput: ~${throughputPerHour} tasks/hour`);

        // Processing time alert
        if (avgProcessingTime > MONITOR_CONFIG.alertThresholds.avgProcessingTime) {
          console.log(`   ⚠️  SLOW PROCESSING: Avg time ${Math.round(avgProcessingTime / 1000)}s > ${MONITOR_CONFIG.alertThresholds.avgProcessingTime / 1000}s threshold`);
        }

      } else {
        console.log('   📭 No completed tasks in last 24 hours');
      }

      // Failure rate analysis
      const { data: failedTasks } = await supabase
        .from('ai_processing_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const totalRecentTasks = (completedTasks?.length || 0) + (failedTasks || 0);
      const failureRate = totalRecentTasks > 0 ? (failedTasks || 0) / totalRecentTasks : 0;

      console.log(`   📉 Failure Rate (24h): ${(failureRate * 100).toFixed(1)}%`);
      
      if (failureRate > MONITOR_CONFIG.alertThresholds.failureRate) {
        console.log(`   ⚠️  HIGH FAILURE RATE: ${(failureRate * 100).toFixed(1)}% > ${(MONITOR_CONFIG.alertThresholds.failureRate * 100).toFixed(1)}% threshold`);
      }

    } catch (error) {
      console.log(`   ❌ Performance check failed: ${error.message}`);
    }
    
    console.log('');
  }

  async reportCostAnalysis() {
    console.log('💰 Cost Analysis:');
    
    try {
      // Estimate cost based on recent activity
      const { data: recentTasks } = await supabase
        .from('ai_processing_queue')
        .select('task_type, task_data')
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (recentTasks && recentTasks.length > 0) {
        // Estimate costs (approximate)
        const embeddingTasks = recentTasks.filter(task => task.task_type === 'embedding_generation');
        const estimatedCostPer = 0.0036; // $0.0036 per embedding (voyage-3-large)
        const dailyCost = embeddingTasks.length * estimatedCostPer;

        console.log(`   💳 Estimated Cost (24h): $${dailyCost.toFixed(6)}`);
        console.log(`   📊 Embeddings Generated: ${embeddingTasks.length}`);
        console.log(`   💵 Cost per Embedding: $${estimatedCostPer.toFixed(6)}`);
        
        // Monthly projection
        const monthlyCost = dailyCost * 30;
        console.log(`   📅 Monthly Projection: $${monthlyCost.toFixed(2)}`);

        // Cost alert
        if (dailyCost > MONITOR_CONFIG.alertThresholds.costPerDay) {
          console.log(`   ⚠️  HIGH COST: $${dailyCost.toFixed(4)}/day > $${MONITOR_CONFIG.alertThresholds.costPerDay} threshold`);
        }

      } else {
        console.log('   📭 No completed tasks for cost analysis');
      }

    } catch (error) {
      console.log(`   ❌ Cost analysis failed: ${error.message}`);
    }
    
    console.log('');
  }

  async reportRecentActivity() {
    console.log('🕐 Recent Activity:');
    
    try {
      // Recent completed tasks
      const { data: recentCompleted } = await supabase
        .from('ai_processing_queue')
        .select('task_type, completed_at, task_data')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(5);

      if (recentCompleted && recentCompleted.length > 0) {
        console.log('   ✅ Recently Completed:');
        recentCompleted.forEach(task => {
          const time = new Date(task.completed_at).toLocaleTimeString();
          const fragranceId = task.task_data?.fragrance_id || 'unknown';
          console.log(`      ${time} - ${task.task_type} (${fragranceId})`);
        });
      }

      // Recent failures
      const { data: recentFailed } = await supabase
        .from('ai_processing_queue')
        .select('task_type, error_message, created_at')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentFailed && recentFailed.length > 0) {
        console.log('\n   ❌ Recent Failures:');
        recentFailed.forEach(task => {
          const time = new Date(task.created_at).toLocaleTimeString();
          const shortError = task.error_message?.substring(0, 50) + '...' || 'Unknown error';
          console.log(`      ${time} - ${task.task_type}: ${shortError}`);
        });
      }

    } catch (error) {
      console.log(`   ❌ Activity check failed: ${error.message}`);
    }
    
    console.log('');
  }

  async checkAndReportAlerts() {
    console.log('🚨 System Alerts:');
    
    const alerts = [];

    try {
      // Check queue backlog
      const { data: pendingTasks } = await supabase
        .from('ai_processing_queue')
        .select('id', { count: 'exact', head: true })
        .in('status', ['pending', 'processing']);

      const backlog = pendingTasks || 0;
      if (backlog > MONITOR_CONFIG.alertThresholds.queueBacklog) {
        alerts.push({
          type: 'HIGH_QUEUE_BACKLOG',
          severity: 'WARNING',
          message: `Queue backlog: ${backlog} tasks`,
          threshold: MONITOR_CONFIG.alertThresholds.queueBacklog
        });
      }

      // Check recent failure rate
      const { data: recentTotal } = await supabase
        .from('ai_processing_queue')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { data: recentFailed } = await supabase
        .from('ai_processing_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const failureRate = recentTotal > 0 ? (recentFailed || 0) / recentTotal : 0;
      if (failureRate > MONITOR_CONFIG.alertThresholds.failureRate) {
        alerts.push({
          type: 'HIGH_FAILURE_RATE',
          severity: 'ERROR',
          message: `Failure rate: ${(failureRate * 100).toFixed(1)}%`,
          threshold: `${(MONITOR_CONFIG.alertThresholds.failureRate * 100).toFixed(1)}%`
        });
      }

      // Check for stuck tasks (processing for >1 hour)
      const { data: stuckTasks } = await supabase
        .from('ai_processing_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'processing')
        .lt('started_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      if (stuckTasks && stuckTasks > 0) {
        alerts.push({
          type: 'STUCK_TASKS',
          severity: 'WARNING',
          message: `${stuckTasks} tasks processing >1 hour`,
          threshold: '1 hour'
        });
      }

      // Display alerts
      if (alerts.length === 0) {
        console.log('   ✅ No alerts - system healthy');
      } else {
        alerts.forEach(alert => {
          const icon = alert.severity === 'ERROR' ? '🔴' : '🟡';
          console.log(`   ${icon} ${alert.type}: ${alert.message} (threshold: ${alert.threshold})`);
        });
      }

    } catch (error) {
      console.log(`   ❌ Alert check failed: ${error.message}`);
    }
    
    console.log('');
  }

  async getBatchProgress(jobId) {
    try {
      const { data: job } = await supabase
        .from('ai_processing_queue')
        .select('task_data, status, created_at, completed_at')
        .eq('id', jobId)
        .single();

      if (!job) {
        return { error: 'Job not found' };
      }

      const progress = job.task_data || {};
      const elapsedMs = job.completed_at 
        ? new Date(job.completed_at).getTime() - new Date(job.created_at).getTime()
        : Date.now() - new Date(job.created_at).getTime();

      return {
        job_id: jobId,
        status: job.status,
        total_items: progress.total_fragrances || 0,
        processed_items: progress.processed || 0,
        successful: progress.successful || 0,
        failed: progress.failed || 0,
        percentage: progress.completion_percentage || 0,
        elapsed_time_ms: elapsedMs,
        total_cost: progress.total_cost || 0
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  async startMonitoring() {
    console.log('🔄 Starting continuous monitoring...\n');
    
    // Initial health check
    await this.getSystemHealthDashboard();
    
    // Set up monitoring interval
    setInterval(async () => {
      try {
        await this.getSystemHealthDashboard();
      } catch (error) {
        console.error('❌ Monitoring error:', error.message);
      }
    }, MONITOR_CONFIG.refreshInterval);
  }

  async generateHealthReport() {
    const report = {
      timestamp: new Date().toISOString(),
      system_status: 'healthy',
      alerts: [],
      metrics: {},
      recommendations: []
    };

    try {
      // System health
      const aiService = getAIService();
      const aiHealth = await aiService.getSystemHealth();
      report.metrics.ai_providers = aiHealth.available_providers.length;
      report.metrics.ai_status = aiHealth.status;

      // Embedding coverage
      const { data: totalCount } = await supabase
        .from('fragrances')
        .select('id', { count: 'exact', head: true });

      const { data: embeddedCount } = await supabase
        .from('fragrances')
        .select('id', { count: 'exact', head: true })
        .not('embedding', 'is', null);

      report.metrics.embedding_coverage = totalCount > 0 ? (embeddedCount || 0) / totalCount : 0;
      report.metrics.total_fragrances = totalCount || 0;
      report.metrics.embedded_fragrances = embeddedCount || 0;

      // Queue metrics
      const { data: queueStats } = await supabase
        .from('ai_processing_queue')
        .select('status')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const statusCounts = queueStats?.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {}) || {};

      report.metrics.queue_backlog = (statusCounts.pending || 0) + (statusCounts.processing || 0);
      report.metrics.completed_tasks_24h = statusCounts.completed || 0;
      report.metrics.failed_tasks_24h = statusCounts.failed || 0;

      // Generate recommendations
      if (report.metrics.embedding_coverage < 0.5) {
        report.recommendations.push('Consider running batch embedding regeneration');
      }

      if (report.metrics.queue_backlog > 50) {
        report.recommendations.push('High queue backlog - consider scaling processing');
      }

      // Determine overall status
      if (report.metrics.embedding_coverage < 0.1 || report.metrics.queue_backlog > 200) {
        report.system_status = 'critical';
      } else if (report.metrics.embedding_coverage < 0.8 || report.metrics.queue_backlog > 100) {
        report.system_status = 'warning';
      }

      return report;

    } catch (error) {
      report.system_status = 'error';
      report.alerts.push({
        type: 'HEALTH_CHECK_FAILED',
        message: error.message
      });
      
      return report;
    }
  }
}

// Command-line interface
async function main() {
  const monitor = new EmbeddingSystemMonitor();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'dashboard':
      await monitor.startMonitoring();
      break;
      
    case 'health':
      const health = await monitor.generateHealthReport();
      console.log(JSON.stringify(health, null, 2));
      break;
      
    case 'progress':
      const jobId = process.argv[3];
      if (!jobId) {
        console.error('❌ Job ID required for progress check');
        console.log('Usage: node monitor-embedding-system.js progress <job-id>');
        process.exit(1);
      }
      
      const progress = await monitor.getBatchProgress(jobId);
      console.log(JSON.stringify(progress, null, 2));
      break;
      
    default:
      console.log('🤖 ScentMatch Embedding System Monitor\n');
      console.log('Available commands:');
      console.log('  dashboard  - Start interactive monitoring dashboard');
      console.log('  health     - Generate health report (JSON)');
      console.log('  progress   - Check batch job progress\n');
      console.log('Examples:');
      console.log('  node monitor-embedding-system.js dashboard');
      console.log('  node monitor-embedding-system.js health');
      console.log('  node monitor-embedding-system.js progress <job-id>');
      break;
  }
}

// Handle interruption gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Monitoring stopped by user');
  process.exit(0);
});

// Run monitoring
main().catch(error => {
  console.error('💥 Monitor failed:', error);
  process.exit(1);
});