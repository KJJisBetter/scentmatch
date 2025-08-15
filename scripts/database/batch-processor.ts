#!/usr/bin/env node

/**
 * Task 4.5: Batch Processing and Progress Tracking
 * 
 * Implements optimized batch processing with progress tracking, memory management,
 * and performance monitoring for large dataset imports.
 * 
 * Features:
 * - Dynamic batch size optimization
 * - Real-time progress tracking with ETA
 * - Memory usage monitoring
 * - Performance metrics
 * - Error isolation per batch
 * - Resumable imports
 * 
 * Usage: Used by import scripts for efficient processing
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'

// Types for batch processing
interface BatchProcessorOptions<T> {
  data: T[]
  batchSize: number
  tableName: string
  transformFn: (item: T) => any
  validateFn?: (item: T) => string[]
  conflictColumns?: string[]
  progressCallback?: (progress: BatchProgress) => void
  errorCallback?: (error: BatchError) => void
  resumeFile?: string
}

interface BatchProgress {
  currentBatch: number
  totalBatches: number
  processedRecords: number
  totalRecords: number
  successfulRecords: number
  failedRecords: number
  percentage: number
  eta: number // seconds
  speed: number // records per second
  memoryUsage: number // MB
  elapsedTime: number // seconds
}

interface BatchError {
  batchNumber: number
  error: string
  affectedRecords: string[]
  retryable: boolean
}

interface BatchResults<T> {
  totalProcessed: number
  successful: number
  failed: number
  errors: BatchError[]
  performance: {
    totalTime: number
    averageSpeed: number
    peakMemory: number
    optimalBatchSize: number
  }
  resumeData?: ResumeData<T>
}

interface ResumeData<T> {
  lastProcessedIndex: number
  successfulBatches: number[]
  failedBatches: number[]
  timestamp: string
}

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Memory thresholds (in MB)
const MEMORY_WARNING_THRESHOLD = 256
const MEMORY_CRITICAL_THRESHOLD = 512

// Performance optimization
const MIN_BATCH_SIZE = 10
const MAX_BATCH_SIZE = 500
const SPEED_THRESHOLD_ADJUSTMENT = 0.8 // Adjust batch size if speed drops below 80%

class BatchProcessor<T> {
  private supabase: any
  private options: BatchProcessorOptions<T>
  private startTime: number = 0
  private lastProgressTime: number = 0
  private speedHistory: number[] = []
  private memoryHistory: number[] = []
  private currentBatchSize: number
  
  constructor(options: BatchProcessorOptions<T>) {
    this.options = options
    this.currentBatchSize = options.batchSize
    
    // Initialize Supabase client
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  
  /**
   * Get current memory usage in MB
   */
  private getMemoryUsage(): number {
    const usage = process.memoryUsage()
    return Math.round(usage.heapUsed / 1024 / 1024)
  }
  
  /**
   * Calculate processing speed (records per second)
   */
  private calculateSpeed(recordsProcessed: number, elapsedTime: number): number {
    return elapsedTime > 0 ? recordsProcessed / elapsedTime : 0
  }
  
  /**
   * Optimize batch size based on performance metrics
   */
  private optimizeBatchSize(currentSpeed: number): void {
    if (this.speedHistory.length < 3) return
    
    const avgSpeed = this.speedHistory.slice(-3).reduce((a, b) => a + b) / 3
    const speedRatio = currentSpeed / avgSpeed
    
    // Adjust batch size based on speed trends
    if (speedRatio < SPEED_THRESHOLD_ADJUSTMENT && this.currentBatchSize > MIN_BATCH_SIZE) {
      this.currentBatchSize = Math.max(MIN_BATCH_SIZE, Math.floor(this.currentBatchSize * 0.8))
      console.log(`📉 Performance decreased, reducing batch size to ${this.currentBatchSize}`)
    } else if (speedRatio > 1.2 && this.currentBatchSize < MAX_BATCH_SIZE) {
      this.currentBatchSize = Math.min(MAX_BATCH_SIZE, Math.floor(this.currentBatchSize * 1.2))
      console.log(`📈 Performance good, increasing batch size to ${this.currentBatchSize}`)
    }
    
    // Memory-based adjustments
    const currentMemory = this.getMemoryUsage()
    if (currentMemory > MEMORY_WARNING_THRESHOLD) {
      this.currentBatchSize = Math.max(MIN_BATCH_SIZE, Math.floor(this.currentBatchSize * 0.7))
      console.log(`⚠️  High memory usage (${currentMemory}MB), reducing batch size to ${this.currentBatchSize}`)
    }
    
    if (currentMemory > MEMORY_CRITICAL_THRESHOLD) {
      throw new Error(`Critical memory usage: ${currentMemory}MB. Stopping to prevent system issues.`)
    }
  }
  
  /**
   * Save resume data for interrupted imports
   */
  private async saveResumeData(progress: BatchProgress, resumeFile?: string): Promise<void> {
    if (!resumeFile) return
    
    const resumeData: ResumeData<T> = {
      lastProcessedIndex: progress.processedRecords,
      successfulBatches: [], // Would track in real implementation
      failedBatches: [], // Would track in real implementation
      timestamp: new Date().toISOString()
    }
    
    try {
      await fs.writeFile(resumeFile, JSON.stringify(resumeData, null, 2))
    } catch (error) {
      console.warn(`Failed to save resume data: ${error}`)
    }
  }
  
  /**
   * Load resume data for continuing interrupted imports
   */
  private async loadResumeData(resumeFile: string): Promise<ResumeData<T> | null> {
    try {
      const data = await fs.readFile(resumeFile, 'utf-8')
      return JSON.parse(data) as ResumeData<T>
    } catch (error) {
      return null
    }
  }
  
  /**
   * Process a single batch with error handling
   */
  private async processBatch(
    batch: T[], 
    batchNumber: number, 
    totalBatches: number
  ): Promise<{ success: boolean, error?: string }> {
    
    try {
      // Validate batch if validator provided
      if (this.options.validateFn) {
        for (const item of batch) {
          const errors = this.options.validateFn(item)
          if (errors.length > 0) {
            throw new Error(`Validation failed: ${errors.join(', ')}`)
          }
        }
      }
      
      // Transform batch data
      const transformedBatch = batch.map(this.options.transformFn)
      
      // Insert batch into database
      const { data, error } = await this.supabase
        .from(this.options.tableName)
        .upsert(transformedBatch, {
          onConflict: this.options.conflictColumns?.join(',') || 'id',
          ignoreDuplicates: false
        })
        .select('id')
      
      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }
      
      return { success: true }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMessage }
    }
  }
  
  /**
   * Main batch processing function
   */
  async process(): Promise<BatchResults<T>> {
    this.startTime = Date.now()
    this.lastProgressTime = this.startTime
    
    const totalRecords = this.options.data.length
    const totalBatches = Math.ceil(totalRecords / this.currentBatchSize)
    
    let processedRecords = 0
    let successfulRecords = 0
    let failedRecords = 0
    const errors: BatchError[] = []
    let peakMemory = this.getMemoryUsage()
    
    console.log(`🚀 Starting batch processing: ${totalRecords} records in ~${totalBatches} batches`)
    console.log(`📦 Initial batch size: ${this.currentBatchSize}`)
    
    // Check for resume data
    const resumeData = this.options.resumeFile ? 
      await this.loadResumeData(this.options.resumeFile) : null
    
    let startIndex = resumeData?.lastProcessedIndex || 0
    if (resumeData) {
      console.log(`📤 Resuming from record ${startIndex}`)
      processedRecords = startIndex
    }
    
    // Process data in batches
    for (let i = startIndex; i < this.options.data.length; i += this.currentBatchSize) {
      const batch = this.options.data.slice(i, i + this.currentBatchSize)
      const batchNumber = Math.floor(i / this.currentBatchSize) + 1
      const adjustedTotalBatches = Math.ceil((totalRecords - startIndex) / this.currentBatchSize)
      
      console.log(`\n🔄 Processing batch ${batchNumber}/${adjustedTotalBatches} (${batch.length} records)`)
      
      // Process batch
      const batchStartTime = Date.now()
      const result = await this.processBatch(batch, batchNumber, adjustedTotalBatches)
      const batchEndTime = Date.now()
      
      // Update counters
      processedRecords += batch.length
      
      if (result.success) {
        successfulRecords += batch.length
        console.log(`✅ Batch ${batchNumber} completed successfully`)
      } else {
        failedRecords += batch.length
        console.error(`❌ Batch ${batchNumber} failed: ${result.error}`)
        
        // Extract record IDs for error tracking (assuming records have id field)
        const recordIds = batch.map((record: any) => record.id || `index-${i}`).slice(0, 5)
        
        errors.push({
          batchNumber,
          error: result.error || 'Unknown error',
          affectedRecords: recordIds,
          retryable: !result.error?.includes('validation') // Simple retry logic
        })
      }
      
      // Calculate progress metrics
      const currentTime = Date.now()
      const elapsedTime = (currentTime - this.startTime) / 1000
      const currentSpeed = this.calculateSpeed(processedRecords - startIndex, elapsedTime)
      const currentMemory = this.getMemoryUsage()
      
      // Track performance history
      this.speedHistory.push(currentSpeed)
      this.memoryHistory.push(currentMemory)
      if (this.speedHistory.length > 10) this.speedHistory.shift()
      if (this.memoryHistory.length > 10) this.memoryHistory.shift()
      
      // Update peak memory
      peakMemory = Math.max(peakMemory, currentMemory)
      
      // Calculate ETA
      const remainingRecords = totalRecords - processedRecords
      const eta = currentSpeed > 0 ? remainingRecords / currentSpeed : 0
      
      // Create progress object
      const progress: BatchProgress = {
        currentBatch: batchNumber,
        totalBatches: adjustedTotalBatches,
        processedRecords,
        totalRecords,
        successfulRecords,
        failedRecords,
        percentage: (processedRecords / totalRecords) * 100,
        eta: Math.round(eta),
        speed: Math.round(currentSpeed),
        memoryUsage: currentMemory,
        elapsedTime: Math.round(elapsedTime)
      }
      
      // Report progress
      console.log(`📊 Progress: ${processedRecords}/${totalRecords} (${progress.percentage.toFixed(1)}%)`)
      console.log(`⚡ Speed: ${progress.speed} records/sec | ETA: ${progress.eta}s | Memory: ${currentMemory}MB`)
      
      // Call progress callback if provided
      if (this.options.progressCallback) {
        this.options.progressCallback(progress)
      }
      
      // Save resume data periodically
      if (batchNumber % 10 === 0) {
        await this.saveResumeData(progress, this.options.resumeFile)
      }
      
      // Optimize batch size based on performance
      if (batchNumber % 5 === 0) { // Check every 5 batches
        this.optimizeBatchSize(currentSpeed)
      }
      
      // Force garbage collection if available
      if (global.gc && currentMemory > MEMORY_WARNING_THRESHOLD) {
        global.gc()
      }
    }
    
    // Calculate final metrics
    const totalTime = (Date.now() - this.startTime) / 1000
    const averageSpeed = this.calculateSpeed(processedRecords - startIndex, totalTime)
    
    // Clean up resume file if completed successfully
    if (this.options.resumeFile && failedRecords === 0) {
      try {
        await fs.unlink(this.options.resumeFile)
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    const results: BatchResults<T> = {
      totalProcessed: processedRecords - startIndex,
      successful: successfulRecords - (resumeData?.lastProcessedIndex || 0),
      failed: failedRecords,
      errors,
      performance: {
        totalTime,
        averageSpeed,
        peakMemory,
        optimalBatchSize: this.currentBatchSize
      }
    }
    
    console.log('\n📋 Batch Processing Summary:')
    console.log(`Total processed: ${results.totalProcessed}`)
    console.log(`Successful: ${results.successful}`)
    console.log(`Failed: ${results.failed}`)
    console.log(`Success rate: ${((results.successful / results.totalProcessed) * 100).toFixed(1)}%`)
    console.log(`Average speed: ${Math.round(results.performance.averageSpeed)} records/sec`)
    console.log(`Peak memory: ${results.performance.peakMemory}MB`)
    console.log(`Optimal batch size: ${results.performance.optimalBatchSize}`)
    console.log(`Total time: ${results.performance.totalTime.toFixed(2)}s`)
    
    return results
  }
}

/**
 * Utility function to create a batch processor
 */
export function createBatchProcessor<T>(options: BatchProcessorOptions<T>): BatchProcessor<T> {
  return new BatchProcessor(options)
}

/**
 * Simple wrapper for common batch processing scenarios
 */
export async function processBatch<T>(
  data: T[],
  tableName: string,
  transformFn: (item: T) => any,
  options: Partial<BatchProcessorOptions<T>> = {}
): Promise<BatchResults<T>> {
  
  const processor = new BatchProcessor({
    data,
    tableName,
    transformFn,
    batchSize: options.batchSize || 100,
    conflictColumns: options.conflictColumns || ['id'],
    validateFn: options.validateFn,
    progressCallback: options.progressCallback,
    errorCallback: options.errorCallback,
    resumeFile: options.resumeFile
  })
  
  return processor.process()
}

export { 
  BatchProcessor, 
  BatchProcessorOptions, 
  BatchProgress, 
  BatchError, 
  BatchResults,
  ResumeData
}