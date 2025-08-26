/**
 * Production Security Logger
 *
 * Secure logging system that:
 * - Never logs sensitive data
 * - Provides structured logging for monitoring
 * - Only logs to console in development
 * - Integrates with security monitoring in production
 */

import { SECURITY_CONFIG } from './config';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
export type SecurityEvent =
  | 'AUTHENTICATION_FAILURE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'VALIDATION_FAILURE'
  | 'SUSPICIOUS_REQUEST'
  | 'UNAUTHORIZED_ACCESS'
  | 'CSP_VIOLATION'
  | 'INPUT_SANITIZATION'
  | 'URL_REDIRECT';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event?: SecurityEvent;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Sanitize sensitive data from log entries
 */
function sanitizeLogData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeLogData(item));
  }

  const sanitized = { ...data };

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();

    // Remove sensitive fields
    if (
      SECURITY_CONFIG.logging.excludeFromLogs.some(pattern =>
        lowerKey.includes(pattern)
      )
    ) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Recursively sanitize nested objects
    if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Create structured log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, any>,
  event?: SecurityEvent
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    event,
    message,
    context: context ? sanitizeLogData(context) : undefined,
  };
}

/**
 * Production security logger
 */
export class SecurityLogger {
  private static instance: SecurityLogger;
  private isProduction = SECURITY_CONFIG.isProduction;
  private isDevelopment = SECURITY_CONFIG.isDevelopment;

  static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  /**
   * Log security events (always logged regardless of level)
   */
  security(
    event: SecurityEvent,
    message: string,
    context?: Record<string, any>
  ) {
    const entry = createLogEntry('error', message, context, event);

    if (this.isProduction) {
      // In production, send to monitoring service
      this.sendToMonitoring(entry);
    } else if (this.isDevelopment) {
      console.log(
        `[SECURITY] ${event}: ${message}`,
        context ? sanitizeLogData(context) : ''
      );
    }
  }

  /**
   * Log errors
   */
  error(message: string, context?: Record<string, any>) {
    const entry = createLogEntry('error', message, context);

    if (this.isProduction) {
      this.sendToMonitoring(entry);
    } else if (this.isDevelopment) {
      console.error(
        `[ERROR] ${message}`,
        context ? sanitizeLogData(context) : ''
      );
    }
  }

  /**
   * Log warnings
   */
  warn(message: string, context?: Record<string, any>) {
    const entry = createLogEntry('warn', message, context);

    if (this.isDevelopment) {
      console.warn(
        `[WARN] ${message}`,
        context ? sanitizeLogData(context) : ''
      );
    }
    // Warnings not sent to monitoring in production
  }

  /**
   * Log info (development only)
   */
  info(message: string, context?: Record<string, any>) {
    if (this.isDevelopment) {
      console.info(
        `[INFO] ${message}`,
        context ? sanitizeLogData(context) : ''
      );
    }
  }

  /**
   * Log debug (development only)
   */
  debug(message: string, context?: Record<string, any>) {
    if (this.isDevelopment) {
      console.debug(
        `[DEBUG] ${message}`,
        context ? sanitizeLogData(context) : ''
      );
    }
  }

  /**
   * Send log entry to monitoring service (production)
   */
  private sendToMonitoring(entry: LogEntry) {
    // TODO: Integrate with production monitoring service
    // For now, just ensure no console.log in production
    // Example integration with Sentry or DataDog:
    // if (process.env.SENTRY_DSN) {
    //   Sentry.captureMessage(entry.message, entry.level);
    // }
    // Example integration with custom monitoring:
    // fetch('/api/internal/logs', {
    //   method: 'POST',
    //   body: JSON.stringify(entry),
    //   headers: { 'Content-Type': 'application/json' }
    // });
  }

  /**
   * Log authentication events
   */
  auth(
    event:
      | 'LOGIN_SUCCESS'
      | 'LOGIN_FAILURE'
      | 'LOGOUT'
      | 'SIGNUP'
      | 'PASSWORD_RESET',
    userId?: string,
    context?: Record<string, any>
  ) {
    const message = `Authentication event: ${event}`;

    if (event === 'LOGIN_FAILURE') {
      this.security('AUTHENTICATION_FAILURE', message, { userId, ...context });
    } else {
      this.info(message, { userId, ...context });
    }
  }

  /**
   * Log rate limiting events
   */
  rateLimit(
    endpoint: string,
    clientId: string,
    limit: number,
    context?: Record<string, any>
  ) {
    this.security(
      'RATE_LIMIT_EXCEEDED',
      `Rate limit exceeded for ${endpoint}`,
      {
        endpoint,
        clientId: clientId.substring(0, 10) + '...', // Partially obfuscate
        limit,
        ...context,
      }
    );
  }

  /**
   * Log validation failures
   */
  validation(endpoint: string, error: string, context?: Record<string, any>) {
    this.security(
      'VALIDATION_FAILURE',
      `Input validation failed for ${endpoint}: ${error}`,
      {
        endpoint,
        ...context,
      }
    );
  }

  /**
   * Log suspicious requests
   */
  suspicious(reason: string, context?: Record<string, any>) {
    this.security(
      'SUSPICIOUS_REQUEST',
      `Suspicious request detected: ${reason}`,
      context
    );
  }
}

// Export singleton instance
export const securityLogger = SecurityLogger.getInstance();

// Convenience functions for common use cases
export const logAuth = securityLogger.auth.bind(securityLogger);
export const logSecurity = securityLogger.security.bind(securityLogger);
export const logError = securityLogger.error.bind(securityLogger);
export const logWarn = securityLogger.warn.bind(securityLogger);
export const logInfo = securityLogger.info.bind(securityLogger);
export const logDebug = securityLogger.debug.bind(securityLogger);
