#!/usr/bin/env node

/**
 * Task 4.6: Error Handling and Rollback Capabilities
 * 
 * Implements comprehensive error handling, transaction management, and rollback
 * capabilities for data import operations.
 * 
 * Features:
 * - Transaction-based imports with automatic rollback
 * - Error classification and handling strategies
 * - Retry mechanisms with exponential backoff
 * - Database state recovery
 * - Import resume capabilities
 * - Error reporting and logging
 * 
 * Usage: Used by import scripts for robust error handling
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'

// Error types and classifications
enum ErrorType {
  VALIDATION = 'validation',
  DATABASE = 'database',
  NETWORK = 'network',
  FILESYSTEM = 'filesystem',
  MEMORY = 'memory',
  TIMEOUT = 'timeout',
  CONSTRAINT = 'constraint',
  UNKNOWN = 'unknown'
}

enum ErrorSeverity {
  LOW = 'low',        // Can continue with warning
  MEDIUM = 'medium',  // Should retry
  HIGH = 'high',      // Must stop batch but can continue import
  CRITICAL = 'critical' // Must stop entire import
}

interface ImportError {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  details?: any
  retryable: boolean
  context: {
    operation: string
    table?: string
    recordId?: string
    batchNumber?: number
    timestamp: string
  }
}

interface RetryConfig {
  maxRetries: number
  baseDelay: number // ms
  maxDelay: number // ms
  backoffMultiplier: number
  retryableErrorTypes: ErrorType[]
}

interface TransactionState {
  id: string
  startTime: number
  operations: Array<{
    table: string
    operation: 'insert' | 'update' | 'delete'
    recordCount: number
    success: boolean
  }>
  rollbackData?: any
}

interface ImportState {
  importId: string
  startTime: number
  currentPhase: 'validation' | 'brands' | 'fragrances' | 'verification' | 'complete'
  brandsImported: number
  fragrancesImported: number
  errors: ImportError[]
  canResume: boolean
  checkpoints: Array<{
    phase: string
    timestamp: number
    recordCount: number
  }>
}

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableErrorTypes: [ErrorType.NETWORK, ErrorType.TIMEOUT, ErrorType.DATABASE]
}

class ImportErrorHandler {
  private supabase: any
  private retryConfig: RetryConfig
  private errors: ImportError[] = []
  private currentTransaction?: TransactionState
  private importState?: ImportState
  private stateFile: string
  
  constructor(retryConfig: Partial<RetryConfig> = {}) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig }
    this.stateFile = path.join(process.cwd(), '.import-state.json')
    
    // Initialize Supabase client
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  
  /**
   * Classify error type and severity
   */
  private classifyError(error: any): { type: ErrorType, severity: ErrorSeverity } {
    const errorMessage = error?.message?.toLowerCase() || ''
    const errorCode = error?.code
    
    // Database constraint violations
    if (errorMessage.includes('violates') || errorMessage.includes('constraint') || 
        errorMessage.includes('foreign key') || errorMessage.includes('unique')) {
      return { type: ErrorType.CONSTRAINT, severity: ErrorSeverity.HIGH }
    }
    
    // Network/connection errors
    if (errorMessage.includes('network') || errorMessage.includes('connection') ||
        errorMessage.includes('timeout') || errorCode === 'ECONNRESET') {
      return { type: ErrorType.NETWORK, severity: ErrorSeverity.MEDIUM }
    }
    
    // Database errors
    if (errorMessage.includes('database') || errorMessage.includes('sql') ||
        errorMessage.includes('relation') || errorMessage.includes('column')) {
      return { type: ErrorType.DATABASE, severity: ErrorSeverity.HIGH }
    }
    
    // Validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('invalid') ||
        errorMessage.includes('required') || errorMessage.includes('format')) {
      return { type: ErrorType.VALIDATION, severity: ErrorSeverity.CRITICAL }
    }
    
    // Memory errors
    if (errorMessage.includes('memory') || errorMessage.includes('heap')) {
      return { type: ErrorType.MEMORY, severity: ErrorSeverity.CRITICAL }
    }
    
    // File system errors
    if (errorMessage.includes('file') || errorMessage.includes('directory') ||
        errorMessage.includes('permission') || errorCode === 'ENOENT') {
      return { type: ErrorType.FILESYSTEM, severity: ErrorSeverity.CRITICAL }
    }
    
    // Timeout errors
    if (errorMessage.includes('timeout') || errorCode === 'ETIMEDOUT') {
      return { type: ErrorType.TIMEOUT, severity: ErrorSeverity.MEDIUM }
    }
    
    // Default to unknown
    return { type: ErrorType.UNKNOWN, severity: ErrorSeverity.HIGH }
  }
  
  /**
   * Create structured error object
   */
  createError(
    error: any, 
    operation: string, 
    context: Partial<ImportError['context']> = {}
  ): ImportError {
    const { type, severity } = this.classifyError(error)
    
    const importError: ImportError = {
      type,
      severity,
      message: error?.message || String(error),
      details: error,
      retryable: this.retryConfig.retryableErrorTypes.includes(type) && 
                severity !== ErrorSeverity.CRITICAL,
      context: {
        operation,
        timestamp: new Date().toISOString(),
        ...context
      }
    }
    
    this.errors.push(importError)
    return importError
  }
  
  /**
   * Execute operation with retry logic
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    context: Partial<ImportError['context']> = {}
  ): Promise<T> {
    let lastError: any
    
    for (let attempt = 1; attempt <= this.retryConfig.maxRetries + 1; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        const importError = this.createError(error, operationName, context)
        
        console.error(`❌ Attempt ${attempt} failed for ${operationName}: ${importError.message}`)
        
        // Don't retry if not retryable or critical
        if (!importError.retryable || attempt > this.retryConfig.maxRetries) {
          throw error
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
          this.retryConfig.maxDelay
        )
        
        console.log(`⏳ Retrying in ${delay}ms... (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1})`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw lastError
  }
  
  /**
   * Start a new import session
   */
  async startImport(importId: string): Promise<void> {
    this.importState = {
      importId,
      startTime: Date.now(),
      currentPhase: 'validation',
      brandsImported: 0,
      fragrancesImported: 0,
      errors: [],
      canResume: true,
      checkpoints: []
    }
    
    await this.saveImportState()
    console.log(`🚀 Started import session: ${importId}`)
  }
  
  /**
   * Create checkpoint for resumable imports
   */
  async createCheckpoint(phase: string, recordCount: number): Promise<void> {
    if (!this.importState) return
    
    this.importState.currentPhase = phase as any
    this.importState.checkpoints.push({
      phase,
      timestamp: Date.now(),
      recordCount
    })
    
    await this.saveImportState()
    console.log(`📍 Checkpoint created: ${phase} (${recordCount} records)`)
  }
  
  /**
   * Start database transaction
   */
  async startTransaction(operationName: string): Promise<string> {
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    this.currentTransaction = {
      id: transactionId,
      startTime: Date.now(),
      operations: []
    }
    
    // Note: Supabase doesn't expose explicit transactions in client SDK
    // We'll implement logical transaction tracking for rollback purposes
    console.log(`🔒 Started logical transaction: ${transactionId} for ${operationName}`)
    
    return transactionId
  }
  
  /**
   * Record operation in current transaction
   */
  recordOperation(
    table: string, 
    operation: 'insert' | 'update' | 'delete', 
    recordCount: number,
    success: boolean = true
  ): void {
    if (!this.currentTransaction) return
    
    this.currentTransaction.operations.push({
      table,
      operation,
      recordCount,
      success
    })
  }
  
  /**
   * Commit transaction
   */
  async commitTransaction(): Promise<void> {
    if (!this.currentTransaction) return
    
    const duration = Date.now() - this.currentTransaction.startTime
    console.log(`✅ Transaction ${this.currentTransaction.id} committed after ${duration}ms`)
    console.log(`   Operations: ${this.currentTransaction.operations.length}`)
    
    this.currentTransaction = undefined
  }
  
  /**
   * Rollback transaction - clean up imported data
   */
  async rollbackTransaction(reason: string): Promise<void> {
    if (!this.currentTransaction) return
    
    console.log(`🔄 Rolling back transaction ${this.currentTransaction.id}: ${reason}`)
    
    // Rollback operations in reverse order
    for (let i = this.currentTransaction.operations.length - 1; i >= 0; i--) {
      const op = this.currentTransaction.operations[i]
      
      if (!op.success) continue // Skip failed operations
      
      try {
        console.log(`  🔄 Rolling back ${op.operation} on ${op.table} (${op.recordCount} records)`)
        
        // For import rollback, we typically delete all records from this session
        // In a more sophisticated system, we'd track specific record IDs
        if (op.operation === 'insert') {
          // For safety, we'll only rollback records from recent import
          // This is a simplified approach - real implementation would track specific IDs
          const cutoffTime = new Date(this.currentTransaction.startTime).toISOString()
          
          if (op.table === 'fragrance_brands') {
            await this.supabase
              .from('fragrance_brands')
              .delete()
              .gte('created_at', cutoffTime)
          } else if (op.table === 'fragrances') {
            await this.supabase
              .from('fragrances')
              .delete()
              .gte('created_at', cutoffTime)
          }
        }
        
        console.log(`  ✅ Rollback completed for ${op.table}`)
        
      } catch (error) {
        console.error(`  ❌ Rollback failed for ${op.table}: ${error}`)
        // Continue with other rollbacks even if one fails
      }
    }
    
    const duration = Date.now() - this.currentTransaction.startTime
    console.log(`🔄 Transaction rollback completed after ${duration}ms`)
    
    this.currentTransaction = undefined
  }
  
  /**
   * Save import state for resume capability
   */
  private async saveImportState(): Promise<void> {
    if (!this.importState) return
    
    try {
      await fs.writeFile(this.stateFile, JSON.stringify(this.importState, null, 2))
    } catch (error) {
      console.warn(`Failed to save import state: ${error}`)
    }
  }
  
  /**
   * Load import state for resume
   */
  async loadImportState(): Promise<ImportState | null> {
    try {
      const data = await fs.readFile(this.stateFile, 'utf-8')
      this.importState = JSON.parse(data) as ImportState
      this.errors = this.importState.errors
      return this.importState
    } catch (error) {
      return null
    }
  }
  
  /**
   * Clean up import state after successful completion
   */
  async cleanupImportState(): Promise<void> {
    try {
      await fs.unlink(this.stateFile)
    } catch (error) {
      // Ignore cleanup errors
    }
  }
  
  /**
   * Check if import can be resumed
   */
  canResumeImport(): boolean {
    return this.importState?.canResume || false
  }
  
  /**
   * Handle critical error - stop import and rollback
   */
  async handleCriticalError(error: any, operation: string): Promise<never> {
    const importError = this.createError(error, operation)
    
    console.error(`💥 CRITICAL ERROR in ${operation}:`)
    console.error(`   Type: ${importError.type}`)
    console.error(`   Message: ${importError.message}`)
    
    // Mark import as non-resumable for critical errors
    if (this.importState) {
      this.importState.canResume = false
      await this.saveImportState()
    }
    
    // Rollback current transaction if any
    if (this.currentTransaction) {
      await this.rollbackTransaction(`Critical error: ${importError.message}`)
    }
    
    // Generate error report
    await this.generateErrorReport()
    
    throw error
  }
  
  /**
   * Validate database state after import
   */
  async validateDatabaseState(): Promise<{ valid: boolean, issues: string[] }> {
    const issues: string[] = []
    
    try {
      console.log('🔍 Validating database state after import...')
      
      // Check for orphaned fragrances
      const { data: orphanedFragrances, error: orphanError } = await this.supabase
        .rpc('find_orphaned_fragrances')
        .limit(10)
      
      if (orphanError) {
        console.warn(`Warning: Could not check for orphaned fragrances: ${orphanError.message}`)
      } else if (orphanedFragrances && orphanedFragrances.length > 0) {
        issues.push(`Found ${orphanedFragrances.length} orphaned fragrances without valid brand references`)
      }
      
      // Check data integrity
      const { count: brandCount } = await this.supabase
        .from('fragrance_brands')
        .select('*', { count: 'exact', head: true })
      
      const { count: fragranceCount } = await this.supabase
        .from('fragrances')
        .select('*', { count: 'exact', head: true })
      
      if (brandCount === 0) {
        issues.push('No brands found in database')
      }
      
      if (fragranceCount === 0) {
        issues.push('No fragrances found in database')
      }
      
      console.log(`✅ Database validation completed: ${brandCount} brands, ${fragranceCount} fragrances`)
      
      if (issues.length > 0) {
        console.warn('⚠️  Database state issues found:')
        issues.forEach(issue => console.warn(`   - ${issue}`))
      }
      
      return { valid: issues.length === 0, issues }
      
    } catch (error) {
      issues.push(`Database validation failed: ${error}`)
      return { valid: false, issues }
    }
  }
  
  /**
   * Generate comprehensive error report
   */
  async generateErrorReport(): Promise<void> {
    const reportPath = path.join(process.cwd(), `import-error-report-${Date.now()}.json`)
    
    const report = {
      importId: this.importState?.importId,
      timestamp: new Date().toISOString(),
      duration: this.importState ? Date.now() - this.importState.startTime : 0,
      currentPhase: this.importState?.currentPhase,
      errors: this.errors,
      errorSummary: {
        total: this.errors.length,
        byType: this.errors.reduce((acc, err) => {
          acc[err.type] = (acc[err.type] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        bySeverity: this.errors.reduce((acc, err) => {
          acc[err.severity] = (acc[err.severity] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        retryable: this.errors.filter(e => e.retryable).length
      },
      importState: this.importState,
      recommendations: this.generateRecommendations()
    }
    
    try {
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
      console.log(`📄 Error report saved to: ${reportPath}`)
    } catch (error) {
      console.error(`Failed to save error report: ${error}`)
    }
  }
  
  /**
   * Generate recommendations based on error patterns
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    const errorCounts = this.errors.reduce((acc, err) => {
      acc[err.type] = (acc[err.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    if (errorCounts[ErrorType.MEMORY] > 0) {
      recommendations.push('Reduce batch size to lower memory usage')
      recommendations.push('Ensure adequate system memory is available')
    }
    
    if (errorCounts[ErrorType.NETWORK] > 2) {
      recommendations.push('Check network connectivity to Supabase')
      recommendations.push('Consider increasing retry delays for network operations')
    }
    
    if (errorCounts[ErrorType.CONSTRAINT] > 0) {
      recommendations.push('Verify database schema matches expected structure')
      recommendations.push('Check for data integrity issues in source files')
    }
    
    if (errorCounts[ErrorType.VALIDATION] > 0) {
      recommendations.push('Review and fix data validation errors in source files')
      recommendations.push('Run data validation script before import')
    }
    
    if (errorCounts[ErrorType.DATABASE] > 0) {
      recommendations.push('Verify database permissions and access')
      recommendations.push('Check Supabase service status')
    }
    
    return recommendations
  }
  
  /**
   * Get error summary
   */
  getErrorSummary(): { total: number, critical: number, retryable: number } {
    return {
      total: this.errors.length,
      critical: this.errors.filter(e => e.severity === ErrorSeverity.CRITICAL).length,
      retryable: this.errors.filter(e => e.retryable).length
    }
  }
  
  /**
   * Get all errors
   */
  getErrors(): ImportError[] {
    return [...this.errors]
  }
  
  /**
   * Clear errors
   */
  clearErrors(): void {
    this.errors = []
  }
}

// Export singleton instance for global error handling
export const globalErrorHandler = new ImportErrorHandler()

export {
  ImportErrorHandler,
  ErrorType,
  ErrorSeverity,
  ImportError,
  RetryConfig,
  TransactionState,
  ImportState
}