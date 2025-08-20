/**
 * A/B Testing Framework for Thompson Sampling vs Static Algorithms
 * 
 * Comprehensive framework for conducting controlled experiments comparing
 * Thompson Sampling bandit optimization against static algorithm selection.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

// Core Types
export interface ExperimentConfig {
  experiment_name: string;
  description?: string;
  control_algorithm: 'static_weights' | 'manual_selection';
  treatment_algorithm: 'thompson_sampling' | 'contextual_bandit';
  traffic_allocation: {
    control: number;
    treatment: number;
  };
  significance_level: number;
  minimum_sample_size: number;
  maximum_duration_days: number;
  success_metrics: string[];
}

export interface UserAssignment {
  user_id: string;
  experiment_id: string;
  group_name: 'control' | 'treatment';
  assignment_hash: string;
  assigned_at: Date;
}

export interface ExperimentResults {
  experiment_id: string;
  status: 'running' | 'completed' | 'failed';
  control_metrics: {
    sample_size: number;
    success_rate: number;
    average_reward: number;
    confidence_interval: { lower: number; upper: number };
  };
  treatment_metrics: {
    sample_size: number;
    success_rate: number;
    average_reward: number;
    confidence_interval: { lower: number; upper: number };
  };
  statistical_results: {
    effect_size: number;
    p_value: number;
    is_significant: boolean;
    confidence_level: number;
    statistical_power: number;
  };
  business_impact: {
    relative_improvement: number;
    estimated_value_increase: number;
    recommendation_confidence: 'deploy' | 'continue_testing' | 'abandon';
  };
}

// A/B Testing Manager
export class ABTestingManager {
  private supabase: SupabaseClient;
  private config: {
    enable_automatic_stopping: boolean;
    min_statistical_power: number;
    max_experiment_duration_days: number;
    significance_threshold: number;
  };

  constructor(supabase: SupabaseClient, config: Partial<{
    enable_automatic_stopping: boolean;
    min_statistical_power: number;
    max_experiment_duration_days: number;
    significance_threshold: number;
  }> = {}) {
    this.supabase = supabase;
    this.config = {
      enable_automatic_stopping: config.enable_automatic_stopping ?? true,
      min_statistical_power: config.min_statistical_power ?? 0.8,
      max_experiment_duration_days: config.max_experiment_duration_days ?? 30,
      significance_threshold: config.significance_threshold ?? 0.05
    };
  }

  /**
   * Create new A/B test experiment
   */
  async createExperiment(experimentConfig: ExperimentConfig): Promise<{
    success: boolean;
    experiment_id: string;
    estimated_duration_days: number;
    required_sample_size: number;
  }> {
    try {
      // Calculate required sample size for desired statistical power
      const requiredSampleSize = this.calculateSampleSize(
        experimentConfig.significance_level,
        this.config.min_statistical_power,
        0.05 // Expected effect size (5% improvement)
      );

      // Create experiment record
      const { data: experiment, error } = await this.supabase
        .from('ab_test_experiments')
        .insert({
          experiment_name: experimentConfig.experiment_name,
          description: experimentConfig.description,
          control_algorithm: experimentConfig.control_algorithm,
          treatment_algorithm: experimentConfig.treatment_algorithm,
          traffic_allocation: experimentConfig.traffic_allocation,
          significance_level: experimentConfig.significance_level,
          minimum_sample_size: Math.max(requiredSampleSize, experimentConfig.minimum_sample_size),
          maximum_duration_days: experimentConfig.maximum_duration_days,
          status: 'draft'
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create experiment: ${error.message}`);
      }

      // Estimate duration based on traffic allocation and daily users
      const estimatedDailyUsers = await this.estimateDailyActiveUsers();
      const dailySampleRate = estimatedDailyUsers * Math.min(experimentConfig.traffic_allocation.control, experimentConfig.traffic_allocation.treatment);
      const estimatedDuration = Math.ceil(requiredSampleSize / dailySampleRate);

      return {
        success: true,
        experiment_id: experiment.id,
        estimated_duration_days: estimatedDuration,
        required_sample_size: requiredSampleSize
      };

    } catch (error) {
      console.error('Failed to create experiment:', error);
      return {
        success: false,
        experiment_id: '',
        estimated_duration_days: 0,
        required_sample_size: 0
      };
    }
  }

  /**
   * Start an A/B test experiment
   */
  async startExperiment(experimentId: string): Promise<{
    success: boolean;
    started_at: Date;
    monitoring_enabled: boolean;
  }> {
    try {
      const { error } = await this.supabase
        .from('ab_test_experiments')
        .update({
          status: 'running',
          start_date: new Date().toISOString()
        })
        .eq('id', experimentId)
        .eq('status', 'draft');

      if (error) {
        throw new Error(`Failed to start experiment: ${error.message}`);
      }

      // Set up monitoring (schedule automatic checks)
      await this.setupExperimentMonitoring(experimentId);

      return {
        success: true,
        started_at: new Date(),
        monitoring_enabled: true
      };

    } catch (error) {
      console.error('Failed to start experiment:', error);
      return {
        success: false,
        started_at: new Date(),
        monitoring_enabled: false
      };
    }
  }

  /**
   * Assign user to experiment group using deterministic assignment
   */
  async assignUserToGroup(experimentId: string, userId: string): Promise<UserAssignment> {
    try {
      // Check if user is already assigned
      const { data: existingAssignment, error: checkError } = await this.supabase
        .from('ab_test_assignments')
        .select('*')
        .eq('experiment_id', experimentId)
        .eq('user_id', userId)
        .single();

      if (existingAssignment && !checkError) {
        return {
          user_id: userId,
          experiment_id: experimentId,
          group_name: existingAssignment.group_name,
          assignment_hash: existingAssignment.assignment_hash,
          assigned_at: new Date(existingAssignment.assigned_at)
        };
      }

      // Get experiment traffic allocation
      const { data: experiment, error: expError } = await this.supabase
        .from('ab_test_experiments')
        .select('traffic_allocation')
        .eq('id', experimentId)
        .eq('status', 'running')
        .single();

      if (expError || !experiment) {
        throw new Error('Experiment not found or not running');
      }

      // Generate deterministic assignment
      const assignment = this.generateDeterministicAssignment(userId, experimentId);
      const trafficAllocation = experiment.traffic_allocation as { control: number; treatment: number };
      const groupName = assignment.hash < trafficAllocation.control ? 'control' : 'treatment';

      // Store assignment
      const { data: newAssignment, error: assignError } = await this.supabase
        .from('ab_test_assignments')
        .insert({
          experiment_id: experimentId,
          user_id: userId,
          group_name: groupName,
          assignment_hash: assignment.assignment_hash
        })
        .select()
        .single();

      if (assignError) {
        throw new Error(`Failed to assign user: ${assignError.message}`);
      }

      return {
        user_id: userId,
        experiment_id: experimentId,
        group_name: newAssignment.group_name,
        assignment_hash: newAssignment.assignment_hash,
        assigned_at: new Date(newAssignment.assigned_at)
      };

    } catch (error) {
      console.error('User assignment failed:', error);
      // Return default assignment to prevent blocking user experience
      return {
        user_id: userId,
        experiment_id: experimentId,
        group_name: 'control',
        assignment_hash: 'fallback',
        assigned_at: new Date()
      };
    }
  }

  /**
   * Analyze experiment results and determine statistical significance
   */
  async analyzeExperimentResults(experimentId: string): Promise<ExperimentResults> {
    try {
      // Get experiment details
      const { data: experiment, error: expError } = await this.supabase
        .from('ab_test_experiments')
        .select('*')
        .eq('id', experimentId)
        .single();

      if (expError || !experiment) {
        throw new Error('Experiment not found');
      }

      // Get assignments and their performance data
      const { data: assignments, error: assignError } = await this.supabase
        .from('ab_test_assignments')
        .select(`
          group_name,
          user_id,
          recommendations_received,
          feedback_provided,
          conversion_events
        `)
        .eq('experiment_id', experimentId);

      if (assignError) {
        throw new Error(`Failed to get assignments: ${assignError.message}`);
      }

      // Get feedback data for statistical analysis
      const userIds = assignments?.map(a => a.user_id) || [];
      const { data: feedbackData, error: feedbackError } = await this.supabase
        .from('recommendation_feedback')
        .select('user_id, combined_reward, algorithm_used, created_at')
        .in('user_id', userIds)
        .gte('created_at', experiment.start_date);

      if (feedbackError) {
        throw new Error(`Failed to get feedback data: ${feedbackError.message}`);
      }

      // Separate control and treatment groups
      const controlAssignments = assignments?.filter(a => a.group_name === 'control') || [];
      const treatmentAssignments = assignments?.filter(a => a.group_name === 'treatment') || [];

      const controlUserIds = new Set(controlAssignments.map(a => a.user_id));
      const treatmentUserIds = new Set(treatmentAssignments.map(a => a.user_id));

      const controlFeedback = feedbackData?.filter(f => controlUserIds.has(f.user_id)) || [];
      const treatmentFeedback = feedbackData?.filter(f => treatmentUserIds.has(f.user_id)) || [];

      // Calculate metrics for each group
      const controlMetrics = this.calculateGroupMetrics(controlFeedback);
      const treatmentMetrics = this.calculateGroupMetrics(treatmentFeedback);

      // Perform statistical analysis
      const statisticalResults = this.performStatisticalTest(controlMetrics, treatmentMetrics);

      // Calculate business impact
      const businessImpact = this.calculateBusinessImpact(controlMetrics, treatmentMetrics, statisticalResults);

      return {
        experiment_id: experimentId,
        status: experiment.status,
        control_metrics: controlMetrics,
        treatment_metrics: treatmentMetrics,
        statistical_results: statisticalResults,
        business_impact: businessImpact
      };

    } catch (error) {
      console.error('Experiment analysis failed:', error);
      throw error;
    }
  }

  /**
   * Stop experiment and finalize results
   */
  async stopExperiment(experimentId: string, reason: string = 'manual_stop'): Promise<{
    success: boolean;
    final_results: ExperimentResults;
    recommendation: string;
  }> {
    try {
      // Analyze final results
      const finalResults = await this.analyzeExperimentResults(experimentId);

      // Update experiment status
      const { error } = await this.supabase
        .from('ab_test_experiments')
        .update({
          status: 'completed',
          end_date: new Date().toISOString(),
          p_value: finalResults.statistical_results.p_value,
          effect_size: finalResults.statistical_results.effect_size,
          is_statistically_significant: finalResults.statistical_results.is_significant
        })
        .eq('id', experimentId);

      if (error) {
        throw new Error(`Failed to stop experiment: ${error.message}`);
      }

      // Generate recommendation
      let recommendation = 'continue_testing';
      if (finalResults.statistical_results.is_significant) {
        if (finalResults.statistical_results.effect_size > 0) {
          recommendation = 'deploy_treatment';
        } else {
          recommendation = 'keep_control';
        }
      } else if (finalResults.statistical_results.statistical_power < 0.5) {
        recommendation = 'extend_test_duration';
      }

      return {
        success: true,
        final_results: finalResults,
        recommendation
      };

    } catch (error) {
      console.error('Failed to stop experiment:', error);
      throw error;
    }
  }

  /**
   * Check if user should use Thompson Sampling based on A/B test assignment
   */
  async shouldUseThompsonSampling(userId: string): Promise<{
    use_thompson_sampling: boolean;
    experiment_id?: string;
    group_assignment?: string;
    fallback_reason?: string;
  }> {
    try {
      // Get active experiments
      const { data: activeExperiments, error } = await this.supabase
        .from('ab_test_experiments')
        .select('id, treatment_algorithm')
        .eq('status', 'running')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !activeExperiments || activeExperiments.length === 0) {
        // No active experiments - use Thompson Sampling by default
        return {
          use_thompson_sampling: true,
          fallback_reason: 'no_active_experiments'
        };
      }

      const activeExperiment = activeExperiments[0];

      // Check user assignment
      const { data: assignment, error: assignError } = await this.supabase
        .from('ab_test_assignments')
        .select('group_name')
        .eq('experiment_id', activeExperiment.id)
        .eq('user_id', userId)
        .single();

      if (assignError || !assignment) {
        // User not assigned - assign them now
        const newAssignment = await this.assignUserToGroup(activeExperiment.id, userId);
        
        return {
          use_thompson_sampling: newAssignment.group_name === 'treatment',
          experiment_id: activeExperiment.id,
          group_assignment: newAssignment.group_name
        };
      }

      return {
        use_thompson_sampling: assignment.group_name === 'treatment',
        experiment_id: activeExperiment.id,
        group_assignment: assignment.group_name
      };

    } catch (error) {
      console.error('Failed to check Thompson Sampling assignment:', error);
      return {
        use_thompson_sampling: true,
        fallback_reason: 'assignment_check_failed'
      };
    }
  }

  /**
   * Record recommendation interaction for A/B test analysis
   */
  async recordExperimentInteraction(
    userId: string,
    interaction: {
      fragrance_id: string;
      action: string;
      algorithm_used: string;
      reward: number;
      context: any;
    }
  ): Promise<void> {
    try {
      // Find active experiment for this user
      const { data: assignment, error } = await this.supabase
        .from('ab_test_assignments')
        .select('experiment_id, group_name')
        .eq('user_id', userId)
        .limit(1);

      if (error || !assignment || assignment.length === 0) {
        return; // No experiment assignment, skip recording
      }

      const userAssignment = assignment[0];

      // Update assignment metrics
      await this.supabase
        .from('ab_test_assignments')
        .update({
          recommendations_received: this.supabase.sql`recommendations_received + 1`,
          feedback_provided: interaction.action !== 'view' ? this.supabase.sql`feedback_provided + 1` : this.supabase.sql`feedback_provided`,
          conversion_events: ['add_to_collection', 'purchase_intent', 'sample_purchase'].includes(interaction.action) 
            ? this.supabase.sql`conversion_events + 1` 
            : this.supabase.sql`conversion_events`
        })
        .eq('experiment_id', userAssignment.experiment_id)
        .eq('user_id', userId);

      // Check if experiment should be automatically stopped
      if (this.config.enable_automatic_stopping) {
        await this.checkAutomaticStop(userAssignment.experiment_id);
      }

    } catch (error) {
      console.error('Failed to record experiment interaction:', error);
    }
  }

  /**
   * Generate deterministic user assignment
   */
  private generateDeterministicAssignment(userId: string, experimentId: string): {
    hash: number;
    assignment_hash: string;
  } {
    const combinedString = `${userId}:${experimentId}`;
    const assignmentHash = createHash('sha256').update(combinedString).digest('hex');
    
    // Convert first 8 characters to normalized hash [0, 1)
    const hash = parseInt(assignmentHash.substring(0, 8), 16) / 0xffffffff;
    
    return {
      hash,
      assignment_hash: assignmentHash.substring(0, 16)
    };
  }

  /**
   * Calculate required sample size for statistical power
   */
  private calculateSampleSize(
    significanceLevel: number,
    statisticalPower: number,
    expectedEffectSize: number
  ): number {
    // Simplified sample size calculation for two-proportion z-test
    // In production, would use more sophisticated power analysis
    const zAlpha = this.getZScore(significanceLevel / 2); // Two-tailed test
    const zBeta = this.getZScore(1 - statisticalPower);
    
    const p1 = 0.1; // Assumed baseline conversion rate
    const p2 = p1 + expectedEffectSize;
    const pPool = (p1 + p2) / 2;
    
    const numerator = Math.pow(zAlpha + zBeta, 2) * 2 * pPool * (1 - pPool);
    const denominator = Math.pow(p2 - p1, 2);
    
    return Math.ceil(numerator / denominator);
  }

  /**
   * Get Z-score for given probability (approximation)
   */
  private getZScore(probability: number): number {
    // Simplified Z-score calculation
    if (probability <= 0.5) {
      return -this.getZScore(1 - probability);
    }
    
    const a0 = 2.515517;
    const a1 = 0.802853;
    const a2 = 0.010328;
    const b1 = 1.432788;
    const b2 = 0.189269;
    const b3 = 0.001308;
    
    const t = Math.sqrt(-2 * Math.log(1 - probability));
    return t - (a0 + a1 * t + a2 * t * t) / (1 + b1 * t + b2 * t * t + b3 * t * t * t);
  }

  /**
   * Calculate metrics for experiment group
   */
  private calculateGroupMetrics(feedbackData: any[]): {
    sample_size: number;
    success_rate: number;
    average_reward: number;
    confidence_interval: { lower: number; upper: number };
  } {
    const sampleSize = feedbackData.length;
    
    if (sampleSize === 0) {
      return {
        sample_size: 0,
        success_rate: 0,
        average_reward: 0,
        confidence_interval: { lower: 0, upper: 1 }
      };
    }

    const totalReward = feedbackData.reduce((sum, f) => sum + (f.combined_reward || 0), 0);
    const averageReward = totalReward / sampleSize;
    const successRate = averageReward; // Assuming normalized rewards [0, 1]

    // Calculate 95% confidence interval
    const stdError = Math.sqrt((successRate * (1 - successRate)) / sampleSize);
    const marginOfError = 1.96 * stdError;

    return {
      sample_size: sampleSize,
      success_rate: successRate,
      average_reward: averageReward,
      confidence_interval: {
        lower: Math.max(0, successRate - marginOfError),
        upper: Math.min(1, successRate + marginOfError)
      }
    };
  }

  /**
   * Perform statistical test comparing control vs treatment
   */
  private performStatisticalTest(
    controlMetrics: any,
    treatmentMetrics: any
  ): {
    effect_size: number;
    p_value: number;
    is_significant: boolean;
    confidence_level: number;
    statistical_power: number;
  } {
    const effectSize = treatmentMetrics.success_rate - controlMetrics.success_rate;
    
    // Two-proportion z-test
    const p1 = controlMetrics.success_rate;
    const p2 = treatmentMetrics.success_rate;
    const n1 = controlMetrics.sample_size;
    const n2 = treatmentMetrics.sample_size;
    
    if (n1 === 0 || n2 === 0) {
      return {
        effect_size: effectSize,
        p_value: 1.0,
        is_significant: false,
        confidence_level: 0,
        statistical_power: 0
      };
    }

    // Pooled proportion
    const pPool = (p1 * n1 + p2 * n2) / (n1 + n2);
    const standardError = Math.sqrt(pPool * (1 - pPool) * (1/n1 + 1/n2));
    
    const zScore = Math.abs(effectSize) / Math.max(standardError, 0.001);
    const pValue = 2 * (1 - this.normalCDF(zScore)); // Two-tailed test

    // Calculate statistical power (post-hoc)
    const powerZScore = (Math.abs(effectSize) / Math.max(standardError, 0.001)) - 1.96;
    const statisticalPower = this.normalCDF(powerZScore);

    return {
      effect_size: effectSize,
      p_value: pValue,
      is_significant: pValue < this.config.significance_threshold && Math.min(n1, n2) >= 100,
      confidence_level: 0.95,
      statistical_power: Math.max(0, statisticalPower)
    };
  }

  /**
   * Calculate business impact from experiment results
   */
  private calculateBusinessImpact(
    controlMetrics: any,
    treatmentMetrics: any,
    statisticalResults: any
  ): {
    relative_improvement: number;
    estimated_value_increase: number;
    recommendation_confidence: 'deploy' | 'continue_testing' | 'abandon';
  } {
    const relativeImprovement = controlMetrics.success_rate > 0 
      ? (treatmentMetrics.success_rate - controlMetrics.success_rate) / controlMetrics.success_rate
      : 0;

    // Estimate value increase (simplified)
    const estimatedValueIncrease = relativeImprovement * 100; // Percentage improvement

    let recommendationConfidence: 'deploy' | 'continue_testing' | 'abandon' = 'continue_testing';
    
    if (statisticalResults.is_significant) {
      if (statisticalResults.effect_size > 0.05) { // 5% improvement threshold
        recommendationConfidence = 'deploy';
      } else if (statisticalResults.effect_size < -0.02) { // 2% degradation threshold
        recommendationConfidence = 'abandon';
      }
    } else if (statisticalResults.statistical_power < 0.5) {
      recommendationConfidence = 'continue_testing';
    }

    return {
      relative_improvement: relativeImprovement,
      estimated_value_increase: estimatedValueIncrease,
      recommendation_confidence: recommendationConfidence
    };
  }

  /**
   * Estimate daily active users for experiment planning
   */
  private async estimateDailyActiveUsers(): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('user_interactions')
        .select('user_id', { count: 'exact' })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (error) {
        return 100; // Conservative estimate
      }

      return Math.max(50, Math.floor((data || 0) / 7)); // Average daily users over past week
    } catch (error) {
      return 100; // Default estimate
    }
  }

  /**
   * Set up automatic monitoring for experiment
   */
  private async setupExperimentMonitoring(experimentId: string): Promise<void> {
    // Add monitoring task to AI processing queue
    await this.supabase
      .from('ai_processing_queue')
      .insert({
        task_type: 'ab_test_monitoring',
        task_data: {
          experiment_id: experimentId,
          monitoring_type: 'statistical_significance_check',
          check_frequency_hours: 24
        },
        priority: 5,
        expires_at: new Date(Date.now() + this.config.max_experiment_duration_days * 24 * 60 * 60 * 1000).toISOString()
      });
  }

  /**
   * Check if experiment should be automatically stopped
   */
  private async checkAutomaticStop(experimentId: string): Promise<void> {
    try {
      const results = await this.analyzeExperimentResults(experimentId);
      
      // Stop if statistically significant with sufficient power
      if (results.statistical_results.is_significant && 
          results.statistical_results.statistical_power > this.config.min_statistical_power) {
        
        await this.stopExperiment(experimentId, 'automatic_significance_reached');
      }
      
      // Stop if maximum duration reached
      const { data: experiment } = await this.supabase
        .from('ab_test_experiments')
        .select('start_date, maximum_duration_days')
        .eq('id', experimentId)
        .single();

      if (experiment) {
        const daysRunning = (Date.now() - new Date(experiment.start_date).getTime()) / (1000 * 60 * 60 * 24);
        if (daysRunning >= experiment.maximum_duration_days) {
          await this.stopExperiment(experimentId, 'automatic_duration_limit');
        }
      }

    } catch (error) {
      console.error('Automatic stop check failed:', error);
    }
  }

  /**
   * Normal cumulative distribution function approximation
   */
  private normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  /**
   * Error function approximation
   */
  private erf(x: number): number {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }
}

// Experiment Coordinator
export class ExperimentCoordinator {
  private abTestManager: ABTestingManager;
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.abTestManager = new ABTestingManager(supabase);
  }

  /**
   * Coordinate recommendation generation based on A/B test assignment
   */
  async generateRecommendations(
    userId: string,
    requestContext: any
  ): Promise<{
    recommendations: any;
    experiment_metadata: {
      experiment_active: boolean;
      user_group?: string;
      algorithm_used: string;
      thompson_sampling_enabled: boolean;
    };
  }> {
    // Check A/B test assignment
    const samplingAssignment = await this.abTestManager.shouldUseThompsonSampling(userId);
    
    let recommendations;
    let algorithmUsed = 'static';

    if (samplingAssignment.use_thompson_sampling) {
      // Use Thompson Sampling approach
      algorithmUsed = 'thompson_sampling';
      // Implementation would call Thompson Sampling recommendation service
      recommendations = await this.generateThompsonSamplingRecommendations(userId, requestContext);
    } else {
      // Use static/control approach
      algorithmUsed = 'static_control';
      recommendations = await this.generateStaticRecommendations(userId, requestContext);
    }

    // Record the generation for experiment tracking
    if (samplingAssignment.experiment_id) {
      await this.abTestManager.recordExperimentInteraction(userId, {
        fragrance_id: 'recommendation_generation',
        action: 'recommendations_served',
        algorithm_used: algorithmUsed,
        reward: 0.5, // Neutral until user interacts
        context: requestContext
      });
    }

    return {
      recommendations,
      experiment_metadata: {
        experiment_active: !!samplingAssignment.experiment_id,
        user_group: samplingAssignment.group_assignment,
        algorithm_used: algorithmUsed,
        thompson_sampling_enabled: samplingAssignment.use_thompson_sampling
      }
    };
  }

  /**
   * Generate recommendations using Thompson Sampling
   */
  private async generateThompsonSamplingRecommendations(userId: string, context: any): Promise<any> {
    // This would call the Thompson Sampling-enabled recommendation service
    // For now, return mock enhanced recommendations
    return {
      perfect_matches: [],
      trending: [],
      adventurous: [],
      seasonal: [],
      algorithm_optimization: 'thompson_sampling'
    };
  }

  /**
   * Generate recommendations using static approach (control group)
   */
  private async generateStaticRecommendations(userId: string, context: any): Promise<any> {
    // This would call the original static recommendation approach
    return {
      perfect_matches: [],
      trending: [],
      adventurous: [],
      seasonal: [],
      algorithm_optimization: 'static_control'
    };
  }
}

// Convenience function to create AB testing manager
export function createABTestingManager(supabase: SupabaseClient): ABTestingManager {
  return new ABTestingManager(supabase, {
    enable_automatic_stopping: true,
    min_statistical_power: 0.8,
    max_experiment_duration_days: 30,
    significance_threshold: 0.05
  });
}